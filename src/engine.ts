import Matter from 'matter-js';

function partialChecker<T = never>() {
  // https://stackoverflow.com/questions/69415412/a-typescript-interface-with-optional-keys/69417966#69417966
  return <I>(input: I & T) => input as I;
}

const options = partialChecker<Matter.IRendererOptions>()({
  width: 800,
  height: 600,
  hasBounds: true,
  // showAngleIndicator: true,
  wireframes: false,
});

function renderSetup(engine: Matter.Engine) {
  // create renderer
  // let element = undefined;
  // if (typeof document !== 'undefined') {
  //   element = (document as any).body;
  // }

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
  var boundsScaleTarget = 1,
    boundsScale = {
      x: 1,
      y: 1
    };

  // use a render event to control our view
  Matter.Events.on(render, 'beforeRender', function () {
    let translate;

    // mouse wheel controls zoom
    var scaleFactor = mouse.wheelDelta * -0.1;
    if (scaleFactor !== 0) {
      if ((scaleFactor < 0 && boundsScale.x >= 0.6) || (scaleFactor > 0 && boundsScale.x <= 1.4)) {
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
  });

  // create runner
  // WARNING: mouse.wheelDelta will not update if this
  // runner is initiated before the Matter.Render 
  var runner = Matter.Runner.create({
    isFixed: true,
  });
  Matter.Runner.run(runner, engine);
}

export function views() {
  var Engine = Matter.Engine,
    Composite = Matter.Composite,
    Bodies = Matter.Bodies;

  // create engine
  const engine = Engine.create();

  // add bodies
  // var stack = Composites.stack(20, 20, 10, 4, 0, 0, function (x: number, y: number) {
  //   switch (Math.round(Common.random(0, 1))) {

  //     case 0:
  //       if (Common.random() < 0.8) {
  //         return Bodies.rectangle(x, y, Common.random(20, 50), Common.random(20, 50));
  //       } else {
  //         return Bodies.rectangle(x, y, Common.random(80, 120), Common.random(20, 30));
  //       }
  //     case 1:
  //       var sides = Math.round(Common.random(1, 8));
  //       sides = (sides === 3) ? 4 : sides;
  //       return Bodies.polygon(x, y, sides, Common.random(20, 50));
  //   }
  //   return null;
  // });
  const items = [
    Bodies.rectangle(100, 0, 30, 40),
    Bodies.rectangle(100, 100, 190, 25),
    Bodies.rectangle(100, 200, 90, 25),
    Bodies.polygon(200, 200, 3, 45),
  ]

  Composite.add(engine.world, [
    ...items,
    // stack,
    // walls
    Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
    Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
    Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
    Bodies.rectangle(0, 300, 50, 600, { isStatic: true })
  ]);

  const body = items[0];
  body.render.fillStyle = 'red';
  body.velocity.x = 5;
  body.velocity.y = 5;
  Matter.Events.on(engine, 'beforeUpdate', function (event) {
    // var engine = event.source;

    // apply random forces every 5 secs
    if (event.timestamp % 5000 < 50) {
      // console.log('x', body.position);
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
