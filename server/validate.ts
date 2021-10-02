import { JSDOM } from 'jsdom';
import Matter from 'matter-js';

// import { GameConfig } from '../src/main';
import { views } from '../src/engine'

(async function () {
  global.dom = await JSDOM.fromFile('index.html', {
    // To run the scripts in the html file
    runScripts: "dangerously",
    // Also load supported external resources
    resources: "usable",
    // So requestAnimatinFrame events fire
    pretendToBeVisual: true
  });

  // GameConfig.type = Phaser.HEADLESS;
  // const game = new Phaser.Game(GameConfig);
  const mat = views();
  // console.log('mat', mat);

  var runner = Matter.Runner.create({
    isFixed: true,
  });
  Matter.Runner.run(runner, mat.engine);

  // setInterval(function () {
  //   Matter.Engine.update(mat.engine, 1000 / 60);
  // }, 1000 / 60);
})();
