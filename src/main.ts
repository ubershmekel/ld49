import './style.css'

import { getEngine } from './engine'
import { setupUI } from './ui';

window.addEventListener('load', () => {
  // Expose `_game` to allow debugging, mute button and fullscreen button
  // (window as any)._game = new Phaser.Game(GameConfig);
  const engine = getEngine();
  setupUI(engine);
});
