import './style.css'

import 'phaser';
import { MenuScene } from './menu-scene';
import { gameHeight, gameWidth } from './config';

import { views } from './engine'

export const GameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Tower of Babel',
  url: 'https://github.com/ubershmekel/vite-phaser-scroller-shooter',
  version: '2.0',
  width: gameWidth,
  height: gameHeight,
  type: Phaser.AUTO,
  parent: 'app',
  scene: [MenuScene],
  input: {
    keyboard: true
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: {
        // x: 0.05,
        y: 0.1
      },
      // plugins: {
      //   wrap: true
      // },
      debug: true
    }
  },

  backgroundColor: '#300000',
  render: { pixelArt: false, antialias: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // `fullscreenTarget` must be defined for phones to not have
    // a small margin during fullscreen.
    fullscreenTarget: 'app',
    expandParent: false,
  },
};


// export class Game extends Phaser.Game {
//   constructor(config: Phaser.Types.Core.GameConfig) {
//     super(config);
//   }
// }

window.addEventListener('load', () => {
  // Expose `_game` to allow debugging, mute button and fullscreen button
  // (window as any)._game = new Phaser.Game(GameConfig);
  const eng = views();
  eng.renderSetup(eng.engine);
});
