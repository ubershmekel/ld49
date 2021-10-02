import Matter from 'matter-js';
// @ts-ignore
import decomp from 'poly-decomp';
import { allToys } from './toys';

function partialChecker<T = never>() {
  // https://stackoverflow.com/questions/69415412/a-typescript-interface-with-optional-keys/69417966#69417966
  return <I>(input: I & T) => input as I;
}

interface Point {
  x: number,
  y: number,
}
const lines: [Point, Point][] = [];

const options = partialChecker<Matter.IRendererOptions>()({
  width: 800,
  height: 600,
  hasBounds: true,
  // showAngleIndicator: true,
  wireframes: false,
  background: '#75bbfd',
});

function xyString(text: string) {
  const parts = text.split(/[ ,]+/);
  const out = [];
  for (let i = 0; i < parts.length; i += 2) {
    out.push(Matter.Vector.create(+parts[i], +parts[i + 1]));
  }
  return out;
}

function afterRender(render: Matter.Render) {
  startViewTransform(render);

  const ctx = render.context;
  for (const [rayStart, rayEnd] of lines) {
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

async function renderSetup(engine: Matter.Engine) {
  const render = Matter.Render.create({
    engine,
    // element,
    element: document.getElementById("app") as HTMLElement,
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

  // keep the mouse in sync with rendering
  // render.mouse = mouse;

  // get the centre of the viewport
  var viewportCentre = {
    // x: gameWidth / 2,
    // y: gameHeight / 2,
    x: options.width * 0.5,
    y: options.height * 0.5
  };

  // create limits for the viewport
  var extents = {
    min: { x: -300, y: -300 },
    max: { x: 1100, y: 900 }
  };

  // keep track of current bounds scale (view zoom)
  const minZoom = 0.6;
  const maxZoom = 1.4
  let boundsScaleTarget = maxZoom;
  let boundsScale = {
    x: 1,
    y: 1
  };

  // use a render event to control our view
  const heightEl = document.getElementById('height-label') as HTMLElement;
  Matter.Events.on(render, 'afterRender', () => afterRender(render));

  Matter.Events.on(render, 'beforeRender', function () {
    let translate;


    // mouse wheel controls zoom
    var scaleFactor = mouse.wheelDelta * -0.1;
    if (scaleFactor !== 0) {
      if ((scaleFactor < 0 && boundsScale.x >= minZoom) || (scaleFactor > 0 && boundsScale.x <= maxZoom)) {
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

    // get vector from mouse relative to centre of viewport
    var deltaCentre = Matter.Vector.sub(mouse.absolute, viewportCentre),
      centreDist = Matter.Vector.magnitude(deltaCentre);

    // translate the view if mouse has moved over 50px from the centre of viewport
    if (centreDist > 50) {
      // create a vector to translate the view, allowing the user to control view speed
      var direction = Matter.Vector.normalise(deltaCentre),
        speed = Math.min(10, Math.pow(centreDist - 50, 2) * 0.0002);

      translate = Matter.Vector.mult(direction, speed);

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
    }

    heightEl.textContent = "height: " + towerHeight(engine);

  });

  // create runner
  // WARNING: mouse.wheelDelta will not update if this
  // runner is initiated before the Matter.Render 
  var runner = Matter.Runner.create({
    isFixed: true,
  });
  Matter.Runner.run(runner, engine);
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


function towerHeight(engine: Matter.Engine) {
  const bodies = Matter.Composite.allBodies(engine.world);
  let height = 0;
  const maxHeight = 1000;

  lines.length = 0;
  for (let i = 0; i < maxHeight; i++) {
    const y = options.height - i * 100 - 50;
    const rayStart = { x: 0, y };
    const rayEnd = { x: 800, y };
    lines.push([rayStart, rayEnd]);
    const collisions = Matter.Query.ray(bodies, rayStart, rayEnd);

    let foundSteadyObject = false;
    for (const obj of collisions) {
      // console.log("collisions", );
      const body = obj.bodyA;
      if (body.isStatic) {
        continue;
      }
      // console.log("velocity", body.velocity)
      const maxVelocity = 1;
      if (body.velocity.x < maxVelocity && body.velocity.y < maxVelocity) {
        foundSteadyObject = true;
        break;
      }
    }
    if (foundSteadyObject) {
      height += 1;
    }
  }
  return height;
}

function addItems(engine: Matter.Engine) {
  // Allow concavev objects
  Matter.Common.setDecomp(decomp);

  const toyBodies = [];
  const toysPerRow = 5;
  for (const [index, toy] of allToys.entries()) {
    const verts = xyString(toy.shape);
    // console.log("starVerts", verts);
    const x = 100 + (index % toysPerRow) * 150;
    const y = 80 - 100 * Math.floor(index / toysPerRow);
    const body = Matter.Bodies.fromVertices(x, y, [verts], {
      render: {
        fillStyle: toy.color,
        lineWidth: 0,
      }
    }, true);
    toyBodies.push(body);
  };

  const walls = [
    // Matter.Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
    Matter.Bodies.rectangle(400, 600, 800, 50, {
      // the floor
      isStatic: true,
      render: {
        fillStyle: '#15b01a',
        // sprite: {
        //   texture: '/assets/rubber.png',
        //   xScale: 1,
        //   yScale: 1,
        // }
      }
    }),
    Matter.Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
    Matter.Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
  ];

  Matter.Composite.add(engine.world, [
    ...toyBodies,
    ...walls,
  ]);

  const body = toyBodies[0];
  body.render.fillStyle = 'red';
  body.velocity.x = -500;
  body.velocity.y = -1500;
}

export function views() {
  // create engine
  const engine = Matter.Engine.create();
  addItems(engine);

  Matter.Events.on(engine, 'beforeUpdate', function (event) {
    // var engine = event.source;

    // apply random forces every 5 secs
    if (event.timestamp % 5000 < 50) {
      // console.log('h ', towerHeight(engine));
    }
  });


  // context for MatterTools.Demo
  return {
    engine: engine,
    // runner: runner,
    renderSetup: renderSetup,
    // canvas: render.canvas,
    // stop: function () {
    //   Matter.Render.stop(render);
    //   Matter.Runner.stop(runner);
    // }
  };
};
