import Matter from 'matter-js';
import { addItems, towerHeight, towerHeightLines } from './engine';
import { isInFullScreen, requestFullScreen } from './full-screener';
import { options } from './config';

const appElement = document.getElementById("app") as HTMLElement;

let game: Game;
let engine: Matter.Engine;

/**
 * Applies viewport transforms based on `render.bounds` to a render context.
 * @method startViewTransform
 * @param {render} render
 */
function startViewTransform(render: Matter.Render) {
  var boundsWidth = render.bounds.max.x - render.bounds.min.x,
    boundsHeight = render.bounds.max.y - render.bounds.min.y,
    boundsScaleX = boundsWidth / (render.options.width as number),
    boundsScaleY = boundsHeight / (render.options.height as number);

  render.context.setTransform(
    ((render.options as any).pixelRatio) / boundsScaleX, 0, 0,
    ((render.options as any).pixelRatio) / boundsScaleY, 0, 0
  );

  render.context.translate(-render.bounds.min.x, -render.bounds.min.y);
};

/**
 * Resets all transforms on the render context.
 * @method endViewTransform
 * @param {render} render
 */
function endViewTransform(render: Matter.Render) {
  render.context.setTransform((render.options as any).pixelRatio, 0, 0, (render.options as any).pixelRatio, 0, 0);
};

function afterRender(render: Matter.Render) {
  startViewTransform(render);

  const ctx = render.context;
  for (const [rayStart, rayEnd] of towerHeightLines) {
    ctx.beginPath();
    ctx.moveTo(rayStart.x, rayStart.y);
    ctx.lineTo(rayEnd.x, rayEnd.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // ctx.fill();
  }
  endViewTransform(render);
}

// create limits for the viewport
const extents = {
  min: { x: -100, y: -300 },
  max: { x: 1100, y: 700 }
};

// get the centre of the viewport
const viewportCentre = {
  // x: gameWidth / 2,
  // y: gameHeight / 2,
  x: options.width * 0.5,
  y: options.height * 0.5
};



function translateView(render: Matter.Render, mouse: Matter.Mouse, deltaCentre: Matter.Vector) {
  const centreDist = Matter.Vector.magnitude(deltaCentre);

  // translate the view if mouse has moved over 50px from the centre of viewport
  if (centreDist < 50) {
    return;
  }
  // create a vector to translate the view, allowing the user to control view speed
  var direction = Matter.Vector.normalise(deltaCentre);

  const speed = Math.min(10, Math.pow(centreDist - 50, 2) * 0.0002);

  const translate = Matter.Vector.mult(direction, speed);

  // prevent the view moving outside the extents
  if (render.bounds.min.x + translate.x < extents.min.x)
    translate.x = extents.min.x - render.bounds.min.x;

  if (render.bounds.max.x + translate.x > extents.max.x)
    translate.x = extents.max.x - render.bounds.max.x;

  if (render.bounds.min.y + translate.y < extents.min.y)
    translate.y = extents.min.y - render.bounds.min.y;

  if (render.bounds.max.y + translate.y > extents.max.y)
    translate.y = extents.max.y - render.bounds.max.y;

  // move the view
  Matter.Bounds.translate(render.bounds, translate);

  // we must update the mouse too
  Matter.Mouse.setOffset(mouse, render.bounds.min);

  return translate;
}

export async function renderSetup(engine: Matter.Engine) {
  const render = Matter.Render.create({
    engine,
    // element,
    element: appElement,
    // element: document.body,
    options,
  });

  Matter.Render.run(render);

  // add mouse control
  console.log("render.canvas", render.canvas)
  var mouse = Matter.Mouse.create(render.canvas);
  let mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.1,
      angularStiffness: 0.1,
      render: {
        // visible: false
      },
    } as any,
  });

  Matter.Composite.add(engine.world, mouseConstraint);

  Matter.Events.on(mouseConstraint, "mousedown", () => {
    console.log("touch");
    const containerEl = document.getElementById("fullscreen-container");
    // const containerEl = appElement;
    if (!isInFullScreen()) {
      requestFullScreen(containerEl);
    }
  });

  let viewTarget = { x: 0, y: options.height };
  Matter.Events.on(mouseConstraint, "mousemove", () => {
    console.log("touch-move");
    // get vector from mouse relative to centre of viewport
    viewTarget = Matter.Vector.sub(mouse.absolute, viewportCentre);
  });

  // keep the mouse in sync with rendering
  // render.mouse = mouse;

  // keep track of current bounds scale (view zoom)
  const minScale = 0.6;
  const maxScale = 1.4;
  const defaultZoom = 0.9;
  let boundsScaleTarget = defaultZoom;
  let boundsScale = {
    x: 1,
    y: 1,
  };

  // use a render event to control our view
  const bankEl = document.getElementById('bank-label') as HTMLElement;
  const heightEl = document.getElementById('height-label') as HTMLElement;
  const earnEl = document.getElementById('earn-label') as HTMLElement;

  Matter.Events.on(render, 'afterRender', () => afterRender(render));

  Matter.Events.on(render, 'beforeRender', function () {
    let translate;
    // mouse wheel controls zoom
    var scaleFactor = mouse.wheelDelta * -0.1;
    if (scaleFactor !== 0) {
      if ((scaleFactor < 0 && boundsScale.x >= minScale) || (scaleFactor > 0 && boundsScale.x <= maxScale)) {
        boundsScaleTarget += scaleFactor;
      }
    }

    // if scale has changed
    if (Math.abs(boundsScale.x - boundsScaleTarget) > 0.01) {
      // smoothly tween scale factor
      scaleFactor = (boundsScaleTarget - boundsScale.x) * 0.2;
      boundsScale.x += scaleFactor;
      boundsScale.y += scaleFactor;

      // scale the render bounds
      render.bounds.max.x = render.bounds.min.x + options.width * boundsScale.x;
      render.bounds.max.y = render.bounds.min.y + options.height * boundsScale.y;

      // translate so zoom is from centre of view
      translate = {
        x: options.width * scaleFactor * -0.5,
        y: options.height * scaleFactor * -0.5
      };

      Matter.Bounds.translate(render.bounds, translate);

      // update mouse
      Matter.Mouse.setScale(mouse, boundsScale);
      Matter.Mouse.setOffset(mouse, render.bounds.min);
    }

    // console.log("deltaCentre", deltaCentre);
    translate = translateView(render, mouse, viewTarget);

    const height = towerHeight(engine);
    const earn = height * height;
    game.setEarn(earn);
    bankEl.textContent = "bank: $" + game.getBank();
    heightEl.textContent = "height: " + height;
    earnEl.textContent = "earn: $" + earn;
  });

  // create runner
  // WARNING: mouse.wheelDelta will not update if this
  // runner is initiated before the Matter.Render 
  var runner = Matter.Runner.create({
    isFixed: true,
  });
  Matter.Runner.run(runner, engine);
}

const storageKeys = {
  bank: 'bank',
}

class Game {
  private bankMoney = 0;
  private earn = 0;

  constructor() {
    const storedBank = localStorage.getItem(storageKeys.bank)
    if (storedBank) {
      this.bankMoney = +storedBank;
    }
  }

  setEarn(earn: number) {
    this.earn = earn;
  }

  cashOut() {
    this.bankMoney += this.earn;
    localStorage.setItem(storageKeys.bank, this.bankMoney.toString());

    // `clear` also removed the mouse callbacks.
    // Matter.World.clear(engine.world, false);
    const everything = Matter.Composite.allBodies(engine.world);
    everything.map(item => {
      Matter.World.remove(engine.world, item);
    });
    addItems(engine);
  }

  getBank() {
    return this.bankMoney;
  }
}

export function setupUI(_engine: Matter.Engine) {
  engine = _engine;
  game = new Game();
  (window as any)._game = game;

  renderSetup(_engine);
}