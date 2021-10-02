import 'phaser';
import { gameHeight, gameWidth } from './config';
import { catasesheetjsonUrl, fkey, preloadAll } from './assets-generated';

export class MenuScene extends Phaser.Scene {
  private startKey!: Phaser.Input.Keyboard.Key;
  private sprites: { s: Phaser.GameObjects.Image, r: number }[] = [];

  constructor() {
    super({
      key: 'MenuScene'
    });
  }

  preload(): void {
    preloadAll(this);

    this.load.aseprite({
      key: 'ase',
      textureURL: '/assets/cat.ase.sheet.png',
      atlasURL: catasesheetjsonUrl,
    });
    // this.load.image('ase', '/assets/cat.ase.sheet.png');
    // this.load.json('ase', catasesheetjsonUrl);


    this.startKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S,
    );
    this.startKey.isDown = false;
  }

  create(): void {
    //const tags = 
    this.anims.createFromAseprite('ase');
    //const sprite = 
    this.add.sprite(gameWidth / 2, gameHeight / 2, 'ase')
      .play({ key: 'Idle', repeat: -1 }).setScale(6);

    const text = this.add.text(0, 0, 'Press S to restart scene', {
      fontFamily: "Helvetica",
    });
    text.setFontSize(gameWidth * 0.07);

    this.add.image(100, 100, fkey.particlepng);

    for (let i = 0; i < 300; i++) {
      const x = Phaser.Math.Between(-64, gameWidth);
      const y = Phaser.Math.Between(-64, gameHeight);

      const image = this.add.image(x, y, fkey.particlepng);
      image.setBlendMode(Phaser.BlendModes.ADD);
      this.sprites.push({ s: image, r: 2 + Math.random() * 6 });
    }
  }

  update(): void {
    if (this.startKey.isDown) {
      this.sound.play(fkey.gaspmp3);
      this.scene.start(this);
    }

    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites[i].s;

      sprite.y -= this.sprites[i].r;

      if (sprite.y < -256) {
        sprite.y = gameHeight;
      }
    }

  }
}