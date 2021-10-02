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

    // this.load.aseprite({
    //   key: 'ase',
    //   textureURL: '/assets/cat.ase.sheet.png',
    //   atlasURL: catasesheetjsonUrl,
    // });

    this.startKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S,
    );
    this.startKey.isDown = false;
  }

  create(): void {
    // this.anims.createFromAseprite('ase');
    // this.add.sprite(gameWidth / 2, gameHeight / 2, 'ase')
    //   .play({ key: 'Idle', repeat: -1 }).setScale(6);

    const text = this.add.text(0, 0, 'Press S to restart scene', {
      fontFamily: "Helvetica",
    });
    text.setFontSize(gameWidth * 0.07);

    this.matter.world.setBounds();
    const body1 = this.matter.add.rectangle(0.5 * gameWidth, gameHeight, gameWidth, gameHeight / 10, { isStatic: true });
    this.matter.add.rectangle(0.1 * gameWidth, 0.1 * gameHeight, 0.1 * gameWidth, gameHeight / 10);
    this.matter.add.rectangle(0.2 * gameWidth, 0.1 * gameHeight, 0.2 * gameWidth, gameHeight / 10);
    this.matter.add.rectangle(0.3 * gameWidth, 0.1 * gameHeight, 0.3 * gameWidth, gameHeight / 10);
    const body2 = this.matter.add.circle(0.5 * gameWidth, 0.1 * gameHeight, 16);
    const star = '50 0 63 38 100 38 69 59 82 100 50 75 18 100 31 59 0 38 37 38';
    this.matter.add.fromVertices(0.3 * gameWidth, 0.3 * gameHeight, star, { restitution: 0.5 }, true);

    this.matter.add.mouseSpring();

    // this.add.image(100, 100, fkey.particlepng);

    // for (let i = 0; i < 300; i++) {
    //   const x = Phaser.Math.Between(-64, gameWidth);
    //   const y = Phaser.Math.Between(-64, gameHeight);

    //   const image = this.add.image(x, y, fkey.particlepng);
    //   image.setBlendMode(Phaser.BlendModes.ADD);
    //   this.sprites.push({ s: image, r: 2 + Math.random() * 6 });
    // }
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