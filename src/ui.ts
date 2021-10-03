import * as Matter from 'matter-js';
import { addItems, towerHeight, towerHeightLines } from './engine';
import { isInFullScreen, requestFullScreen } from './full-screener';
import { options } from './config';
import { allToys, Toy } from './toys';
import { godpngUrl, sunpngUrl, birdspngUrl, fariopngUrl, piano2mp3Url, moneypngUrl } from './assets-generated';
import { Howl } from 'howler';

const appElement = document.getElementById("app") as HTMLElement;

interface CanvasText {
  text: string;
  x: number;
  y: number;
  isFixed: boolean;
}

interface CanvasImage {
  image: HTMLImageElement;
  x: number;
  y: number;
}

let game: Game;
let engine: Matter.Engine;
let render: Matter.Render;
let activeScene: BaseScene;
let sound: Howl;
const texts: CanvasText[] = [];
let earnText: CanvasText = {
  isFixed: false,
  text: "$$$$",
  x: -1000,
  y: 0,
};
let cashOutButton: Matter.Body;
let heightImage: CanvasImage | undefined;
let moneyImage: CanvasImage | undefined;
let draggedToy: Toy | null = null;

interface DragEvent {
  mouse: Matter.Mouse;
  body: Matter.Body;
}

const mouseButtons = {
  none: -1,
  left: 0,
  middle: 1,
  right: 2,
}

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
    ((render.options as any).pixelRatio) / boundsScaleY, 0, 0,
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

function drawImage(ctx: CanvasRenderingContext2D,
  image: HTMLImageElement, x: number, y: number, w: number, h: number, degrees: number) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(degrees * Math.PI / 180.0);
  ctx.translate(-x - w / 2, -y - h / 2);
  ctx.drawImage(image, x, y, w, h);
  ctx.restore();
}

function afterRender(render: Matter.Render) {
  startViewTransform(render);

  // draw lines
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

  // draw text
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  for (const textItem of texts) {
    // ctx.fillText(textItem.text, textItem.x, textItem.y);
    fillTextMultiLine(ctx, textItem.text, textItem.x, textItem.y);
  }

  if (heightImage && heightImage.image) {
    ctx.drawImage(heightImage.image, heightImage.x + 2 * Math.cos(Date.now() / 100), heightImage.y + 2 * Math.sin(Date.now() / 100));
  }

  endViewTransform(render);

  if (moneyImage && moneyImage.image) {
    ctx.drawImage(moneyImage.image, 400 + 5 * Math.cos(Date.now() / 100), 400 + 5 * Math.sin(Date.now() / 100));
    ctx.drawImage(moneyImage.image, 600 + 5 * Math.cos(Date.now() / 100), 400 + 5 * Math.sin(Date.now() / 100));
    ctx.drawImage(moneyImage.image, 800 + 5 * Math.cos(Date.now() / 100), 300 + 5 * Math.sin(Date.now() / 100));
  }

}

// create limits for the viewport
const extents = {
  min: { x: -500, y: -600 },
  max: { x: 1200, y: 700 }
};

// get the centre of the viewport
const viewportCentre = {
  x: options.width * 0.5,
  y: options.height * 0.5
};

function panView(render: Matter.Render, delta: Matter.Vector) {
  // create a vector to translate the view, allowing the user to control view speed
  // var direction = Matter.Vector.normalise(delta);

  // const speed = Math.min(10, Math.pow(centreDist - 50, 2) * 0.0002);
  // const translate = Matter.Vector.mult(direction, speed);
  const pixelSpeedFactor = 1.0;
  const translate = Matter.Vector.mult(delta, pixelSpeedFactor);

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

  return translate;
}

const defaultZoom = 0.9;
let boundsScaleTarget = defaultZoom;

export async function renderSetup(engine: Matter.Engine) {
  render = Matter.Render.create({
    engine,
    // element,
    element: appElement,
    // element: document.body,
    options,
  });

  Matter.Render.run(render);

  // add mouse control
  // console.log("render.canvas", render.canvas)
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

  const containerEl = document.getElementById("fullscreen-container");
  Matter.Events.on(mouseConstraint, "mousedown", () => {
    // console.log("touch");
    prevMousePos = Matter.Vector.clone(mouse.position);
    // const containerEl = appElement;
    if (!isInFullScreen()) {
      requestFullScreen(containerEl);
    }
  });

  Matter.Events.on(mouseConstraint, "mouseup", () => {
    // console.log("mouseoup");
    prevMousePos = Matter.Vector.clone(mouse.position);
    // prevMousePos is invalid now
    // For some reason, `mousemove` happens right after this
    // sometimes, without a proper `mousedown`. I suspect
    // that only happens with `touchmove`.
    prevMousePos = null;
  });

  Matter.Events.on(mouseConstraint, "startdrag", (ev: DragEvent) => {
    const toyIndex = +ev.body.label;
    draggedToy = allToys[toyIndex];
    console.log("draggedToy", draggedToy);

    activeScene.startDrag(ev);
  });

  let currentSoundIndex = 0;
  let soundOptions: soundNames[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  Matter.Events.on(mouseConstraint, "enddrag", (ev: DragEvent) => {
    if (draggedToy) {
      // sound.play('a');

      playSound(soundOptions[currentSoundIndex]);
      currentSoundIndex = (currentSoundIndex + 1) % soundOptions.length;
    }
    draggedToy = null;

    activeScene.endDrag(ev);
  });


  let prevMousePos: Matter.Vector | null = mouse.position;
  let prevMouseStamp = engine.timing.timestamp;

  // initial view should have instructions visible
  panView(render, { x: -650, y: -100 });
  Matter.Events.on(mouseConstraint, "mousemove", (stuff) => {
    const prevMouseAge = engine.timing.timestamp - prevMouseStamp;
    // if (prevMouseAge > 100) {
    //   console.log("Ignoring stale prevMousePos", prevMouseAge);
    //   prevMousePos = mouse.position;
    //   prevMouseStamp = engine.timing.timestamp;
    // }
    if (mouse.button != mouseButtons.none) {
      if (!stuff.source.body && prevMousePos && prevMouseAge < 100) {
        // dragging background
        const delta = Matter.Vector.sub(prevMousePos, mouse.position);
        // console.log("panView", prevMousePos, mouse.position);
        const size = Matter.Vector.magnitude(delta);
        if (size > 60) {
          console.log("too big panView, ignoring", delta);
        } else {
          panView(render, delta);
        }
      }

      const deltaFromCenter = Matter.Vector.sub(mouse.absolute, viewportCentre);
      const deltaMagnitude = Matter.Vector.magnitude(deltaFromCenter);
      if (stuff.source.body && deltaMagnitude > 150) {
        // When dragging things, let the edge of the map pan
        // so you can e.g. bring something from the floor to very high
        // up without letting go.
        const direction = Matter.Vector.normalise(deltaFromCenter);
        const delta = Matter.Vector.mult(direction, 3);
        panView(render, delta);
      }

      // we must update the mouse too
      Matter.Mouse.setOffset(mouse, render.bounds.min);
    }

    // console.log("touch-move");
    prevMousePos = Matter.Vector.clone(mouse.position);
    prevMouseStamp = engine.timing.timestamp;
  });

  // keep the mouse in sync with rendering
  // render.mouse = mouse;

  // keep track of current bounds scale (view zoom)
  const minScale = 0.6;
  const maxScale = 1.4;
  let boundsScale = {
    x: 1,
    y: 1,
  };

  // use a render event to control our view
  const bankEl = document.getElementById('bank-label') as HTMLElement;
  // const heightEl = document.getElementById('height-label') as HTMLElement;
  // const earnEl = document.getElementById('earn-label') as HTMLElement;

  Matter.Events.on(render, 'afterRender', () => afterRender(render));

  Matter.Events.on(render, 'beforeRender', function () {

    let translate;
    // mouse wheel controls zoom
    var scaleFactor = mouse.wheelDelta * -0.1;
    boundsScaleTarget += scaleFactor;
    // limit bounds zoom
    if (boundsScaleTarget > maxScale) {
      boundsScaleTarget = maxScale;
    }
    if (boundsScaleTarget < minScale) {
      boundsScaleTarget = minScale;
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

    // translate = translateView(render, mouse, viewTarget);

    const height = towerHeight(engine);
    const earn = height * height * height;
    const prizes = [imgBirds, imgSun, imgGod];
    game.setEarn(earn);
    if (towerHeightLines.length > 0) {
      const lastLine = towerHeightLines[towerHeightLines.length - 1];
      earnText.x = lastLine[0].x - 10;
      earnText.y = lastLine[0].y;
      earnText.text = "$" + earn + "\ncash out";
      cashOutButton.position
      Matter.Body.setPosition(cashOutButton, { x: earnText.x, y: lastLine[0].y + 4 });

      if (towerHeightLines.length % 3 === 0) {
        const heightImageIndex = Math.floor(towerHeightLines.length / 3 - 1) % prizes.length;
        heightImage = {
          image: prizes[heightImageIndex],
          x: lastLine[0].x - 200,
          y: lastLine[0].y - 64,
        };

        if (draggedToy && draggedToy.name === 'mariobait') {
          heightImage.image = imgFario;
        }
      } else {
        heightImage = undefined;
      }
    }
    bankEl.textContent = "bank: $" + game.getBank();
    // heightEl.textContent = "height: " + height;
    // earnEl.textContent = "earn: $" + earn;
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
  purchased: 'purchased',
}

const unpurchasedStyle = '#666';

function subBodyMap(body: Matter.Body, callback: (subBody: Matter.Body) => void) {
  callback(body);
  body.parts.map(part => {
    callback(part);
  })
}

function styleBody(body: Matter.Body, fillStyle: string) {
  subBodyMap(body, part => {
    part.render.fillStyle = fillStyle;
  });
}

class BaseScene {
  start() { }
  startDrag(_: DragEvent) { }
  endDrag(_: DragEvent) { }
}

function startScene(scene: typeof BaseScene) {
  texts.length = 0;
  texts.push({
    isFixed: false,
    text: "Purchase blocks\nBuild a tower\nTaller towers earn WAY more money\nCash out when your tower is ready\nRepeat until you find god",
    x: -200,
    y: 0,
  })
  activeScene = new scene();
  activeScene.start();
}

class TowerBuildingScene extends BaseScene {

  start() {
    // `Matter.World.clear` also removed the mouse callbacks.
    // so instead, manually remove pre-existing bodies.
    const everything = Matter.Composite.allBodies(engine.world);
    everything.map(item => {
      Matter.World.remove(engine.world, item);
    });
    const toys = game.purchasedToys();
    addItems(engine, toys);
    // hide earnText until lines are visible
    earnText.x = -1000;
    texts.push(earnText);

    cashOutButton = Matter.Bodies.rectangle(-1000, 200, 100, 50, {
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: 'rgba(200, 200, 0, 0.5)',
        strokeStyle: 'dbb40c',
        lineWidth: 3,
      }
    });
    Matter.Composite.add(engine.world, cashOutButton);
  }

  startDrag({ body: body }: DragEvent) {
    // console.log("startdrag", body);
    if (body === cashOutButton) {
      console.log("cash out!", cashOutButton.position.y)
      game.cashOut();
    }
  }
}

function getToyBodies(): Matter.Body[] {
  // toys have a label that is just a number.
  return engine.world.bodies.filter((body) => !isNaN(+body.label));
}

function fillTextMultiLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  var lineHeight = ctx.measureText("M").width * 1.2;
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; ++i) {
    ctx.fillText(lines[i], x, y);
    y += lineHeight;
  }
}

class ShopScene extends BaseScene {
  start() {
    // `Matter.World.clear` also removed the mouse callbacks.
    // so instead, manually remove pre-existing bodies.
    const everything = Matter.Composite.allBodies(engine.world);
    everything.map(item => {
      Matter.World.remove(engine.world, item);
    });
    const items = addItems(engine, allToys);

    // Paint bodies that you don't have grey.
    // Erase bodies that you can't afford.
    items.toyBodies.map(bod => {
      bod.isStatic = true;
      const toyIndex = +bod.label;
      if (game.isPurchased(toyIndex)) {
        return;
      }

      const toy = allToys[toyIndex];
      if (game.getBank() < toy.price) {
        // can't afford it, keep it secret
        Matter.World.remove(engine.world, bod);
      }

      styleBody(bod, unpurchasedStyle);

    });

    getToyBodies().map(body => {
      const toy = allToys[+body.label];
      const textItem: CanvasText = {
        text: toy.name + '\n$' + toy.price,
        x: body.position.x,
        y: body.position.y + 40,
        isFixed: false,
      }
      texts.push(textItem);
    });
  }

  startDrag({ body: body }: DragEvent) {
    // console.log("startdrag", mouse.position, body);
    if (!draggedToy) {
      return;
    }
    styleBody(body, draggedToy.color);
  }

  endDrag({ body: body }: DragEvent) {
    // console.log("enddrag", mouse.position, body);
    const toyIndex = +body.label;
    const toy = allToys[toyIndex];
    if (!toy) {
      return;
    }
    styleBody(body, toy.color);
    if (game.isPurchased(toyIndex)) {
      startScene(TowerBuildingScene);
    } else {
      if (game.getBank() >= toy.price) {
        game.buyToy(toyIndex);
        styleBody(body, toy.color);
        // startScene(TowerBuildingScene);
      } else {
        // can't afford it
        styleBody(body, unpurchasedStyle);
      }
    }
  }
}

const initialBank = 3;

class Game {
  private bankMoney = initialBank;
  private earn = 0;
  private purchased: number[] = [];

  constructor() {
    const storedBank = localStorage.getItem(storageKeys.bank);
    if (storedBank) {
      this.bankMoney = +storedBank;
    }

    const storedPurchased = localStorage.getItem(storageKeys.purchased);
    if (storedPurchased) {
      this.purchased = JSON.parse(storedPurchased);
    }
  }

  setEarn(earn: number) {
    this.earn = earn;
  }

  cashOut() {
    console.log("cashout", towerHeightLines.length, this.earn);
    switch (towerHeightLines.length) {
      case 0:
      case 1:
        playSound('cash0')
        break;
      case 2:
        playSound('cash1')
        break;
      case 3:
      case 4:
        playSound('cash2')
        break;
      case 5:
      case 6:
        playSound('cash3')
        break;
      case 7:
      case 8:
        playSound('cash4')
        break;
      case 9:
      case 10:
      case 11:
      case 12:
        playSound('cash5')
        break;
    }
    this.setBankMoney(this.bankMoney + this.earn);
    moneyImage = {
      image: imgMoney,
      x: 400,
      y: 400,
    }
    setTimeout(() => {
      moneyImage = undefined;
    }, 1500);
    startScene(ShopScene);
  }

  setBankMoney(amount: number) {
    this.bankMoney = amount;
    const serialized = this.bankMoney.toString()
    localStorage.setItem(storageKeys.bank, serialized);
  }

  buyToy(index: number) {
    const toy = allToys[index];
    this.setBankMoney(this.bankMoney - toy.price);
    this.purchased.push(index);
    // dedupe
    this.purchased = [...new Set(this.purchased)];
    const serialized = JSON.stringify(this.purchased);
    localStorage.setItem(storageKeys.purchased, serialized);
  }

  getBank() {
    return this.bankMoney;
  }

  isPurchased(index: number) {
    return this.purchased.indexOf(index) >= 0;
  }

  purchasedToys() {
    return this.purchased.map(index => allToys[index]);
  }

  zoomIn() {
    boundsScaleTarget += 0.1;
  }

  zoomOut() {
    boundsScaleTarget -= 0.1;
  }

  toggleMute() {
    const el = document.getElementById("mute-button") as HTMLElement;
    const isMuteNow = !sound.mute();
    sound.mute(isMuteNow);
    if (isMuteNow) {
      el.innerText = "unmute";
    } else {
      el.innerText = "mute";
    }
  }
}

const soundSprite = {
  music: [0, (1 * 60 + 27) * 1000],
  a: [(0 * 60 + 1.197) * 1000, 1000],
  b: [(0 * 60 + 3.598) * 1000, 1000],
  c: [(0 * 60 + 5.604) * 1000, 1000],
  d: [(0 * 60 + 7.164) * 1000, 1000],
  e: [(0 * 60 + 8.559) * 1000, 1000],
  f: [(0 * 60 + 9.904) * 1000, 1000],
  g: [(0 * 60 + 11.172) * 1000, 1000],
  cash0: [(0 * 60 + 29.721) * 1000, 3000],
  cash1: [(0 * 60 + 35.041) * 1000, 3400],
  cash2: [(0 * 60 + 39.216) * 1000, 4000],
  cash3: [(0 * 60 + 43.939) * 1000, 4000],
  cash4: [(0 * 60 + 48.336) * 1000, 4000],
  cash5: [(0 * 60 + 54.112) * 1000, 8000],
};

type soundNames = keyof typeof soundSprite;
function playSound(name: soundNames) {
  sound.play(name);
}

function soundsSetup() {
  console.log("soundsSetup");
  sound = new Howl({
    src: [piano2mp3Url],
    sprite: soundSprite as any,
  });

  // sound.play('music');

  let isPaused = false;
  setInterval(() => {
    if (document.hidden) {
      // music in background
      isPaused = true;
      sound.pause();
    } else {
      // tab is visible
      isPaused = false;
      if (isPaused) {
        sound.play();
      }
    }
  }, 100);
}

const imgGod = new Image();
imgGod.src = godpngUrl;

const imgSun = new Image();
imgSun.src = sunpngUrl;

const imgBirds = new Image();
imgBirds.src = birdspngUrl;

const imgFario = new Image();
imgFario.src = fariopngUrl;

const imgMoney = new Image();
imgMoney.src = moneypngUrl;

export function setupUI(_engine: Matter.Engine) {
  soundsSetup();

  engine = _engine;
  game = new Game();
  startScene(ShopScene);
  (window as any)._game = game;

  renderSetup(_engine);
}