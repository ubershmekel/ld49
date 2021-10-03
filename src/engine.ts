import Matter from 'matter-js';
// @ts-ignore
import decomp from 'poly-decomp';
import { options } from './config';
import { allToys } from './toys';

interface Point {
  x: number,
  y: number,
}

export const towerHeightLines: [Point, Point][] = [];

function xyString(text: string) {
  const parts = text.split(/[ ,]+/);
  const out = [];
  for (let i = 0; i < parts.length; i += 2) {
    out.push(Matter.Vector.create(+parts[i], +parts[i + 1]));
  }
  return out;
}

export function towerHeight(engine: Matter.Engine) {
  const bodies = Matter.Composite.allBodies(engine.world);
  let height = 0;
  const maxHeight = 1000;

  towerHeightLines.length = 0;
  for (let i = 0; i < maxHeight; i++) {
    const y = options.height - i * 100 - 100;
    const rayStart = { x: 0, y };
    const rayEnd = { x: 800, y };
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
      towerHeightLines.push([rayStart, rayEnd]);
      height += 1;
    } else {
      break;
    }
  }
  return height;
}

export function addItems(engine: Matter.Engine) {
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
    Matter.Bodies.rectangle(0, 600, 2600, 50, {
      // the floor/ground
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
    Matter.Bodies.rectangle(800, 600, 50, 150, { isStatic: true }),
    Matter.Bodies.rectangle(0, 600, 50, 150, { isStatic: true }),
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

export function getEngine() {
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
  return engine;
  // {
  //   engine: engine,
  //   // runner: runner,
  //   renderSetup: renderSetup,
  //   // canvas: render.canvas,
  //   // stop: function () {
  //   //   Matter.Render.stop(render);
  //   //   Matter.Runner.stop(runner);
  //   // }
  // };
};
