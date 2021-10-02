//////////////////////////////////////////////////////
// GENERATED FILE - DO NOT EDIT
// GENERATED FILE - DO NOT EDIT
// GENERATED FILE - DO NOT EDIT
// See "assets-builder.ts" for more information.
//////////////////////////////////////////////////////

import 'phaser';
import catasesheetjsonUrl from '../assets/cat.ase.sheet.json?url';
export { catasesheetjsonUrl };
import enemyasesheetjsonUrl from '../assets/enemy.ase.sheet.json?url';
export { enemyasesheetjsonUrl };
import mapjsonUrl from '../assets/map.json?url';
export { mapjsonUrl };
import tilesetasesheetjsonUrl from '../assets/tileset.ase.sheet.json?url';
export { tilesetasesheetjsonUrl };

// Url imports
import catasesheetpngUrl from '../assets/cat.ase.sheet.png';
import enemyasesheetpngUrl from '../assets/enemy.ase.sheet.png';
import gaspmp3Url from '../assets/gasp.mp3';
import particlepngUrl from '../assets/particle.png';
import tilesetasesheetpngUrl from '../assets/tileset.ase.sheet.png';

export const fkey = {
  catasesheetpng: 'catasesheetpng',
  enemyasesheetpng: 'enemyasesheetpng',
  gaspmp3: 'gaspmp3',
  particlepng: 'particlepng',
  tilesetasesheetpng: 'tilesetasesheetpng',
}

export function preloadAll(scene: Phaser.Scene) {
  scene.load.image(fkey.catasesheetpng, catasesheetpngUrl);
  scene.load.image(fkey.enemyasesheetpng, enemyasesheetpngUrl);
  scene.load.audio(fkey.gaspmp3, gaspmp3Url);
  scene.load.image(fkey.particlepng, particlepngUrl);
  scene.load.image(fkey.tilesetasesheetpng, tilesetasesheetpngUrl);
}