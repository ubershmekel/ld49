//////////////////////////////////////////////////////
// GENERATED FILE - DO NOT EDIT
// GENERATED FILE - DO NOT EDIT
// GENERATED FILE - DO NOT EDIT
// See "assets-builder.ts" for more information.
//////////////////////////////////////////////////////

import 'phaser';
import catasesheetjsonUrl from '../assets/cat.ase.sheet.json?url';
export { catasesheetjsonUrl };

// Url imports
import catasesheetpngUrl from '../assets/cat.ase.sheet.png';
import gaspmp3Url from '../assets/gasp.mp3';
import particlepngUrl from '../assets/particle.png';

export const fkey = {
  catasesheetpng: 'catasesheetpng',
  gaspmp3: 'gaspmp3',
  particlepng: 'particlepng',
}

export function preloadAll(scene: Phaser.Scene) {
  scene.load.image(fkey.catasesheetpng, catasesheetpngUrl);
  scene.load.audio(fkey.gaspmp3, gaspmp3Url);
  scene.load.image(fkey.particlepng, particlepngUrl);
}