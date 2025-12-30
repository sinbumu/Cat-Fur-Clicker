import Phaser from 'phaser';
import { GameState } from '../GameState';
import { ShopUI } from '../ui/ShopUI';
import { SettingsUI } from '../ui/SettingsUI';

export default class MainScene extends Phaser.Scene {
  private furText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private clickParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('MainScene');
  }

  preload() {
    // Preload assets here if needed
  }

  create() {
    const { width, height } = this.scale;
    const gameState = GameState.getInstance();

    // UI Texts
    this.furText = this.add.text(20, 20, '', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff'
    });

    this.statsText = this.add.text(20, 70, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#aaaaaa'
    });

    // Settings UI
    new SettingsUI(this, 30, height - 30);

    // Shop UI
    // Place shop on the right side
    // Card width 280. Center at 0,0 relative to container.
    // So container at width - 150 gives margin.
    new ShopUI(this, width - 150, 100);

    // Update UI immediately
    this.updateUI();

    // Check for offline earnings
    if (gameState.offlineEarnings > 0) {
        this.showToast(`Welcome back!\nYou earned ${Math.floor(gameState.offlineEarnings)} Fur while offline.`);
        // Reset so we don't show it again on scene restart if any
        gameState.offlineEarnings = 0;
    }

    // Subscribe to state changes
    gameState.addListener(() => {
        // We can update UI here or in update loop.
        // Updating here ensures it reflects immediate changes like clicks.
        this.updateUI();
    });

    const radius = 50;
    const color = 0xcccccc; // Light gray

    // Particle Emitter for burst
    this.clickParticles = this.add.particles(0, 0, 'dummy', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        gravityY: 200,
        emitting: false
    });

    // Create a texture for particles on the fly if needed,
    // but Phaser particles can run without texture (renders square) or we create a small circle texture
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('particle', 10, 10);
    this.clickParticles.setTexture('particle');

    // Main Furball
    const circle = this.add.circle(width / 2, height / 2, radius, color);
    circle.setInteractive();

    // Visual flair to make it look like a furball (simple graphics on top)
    const fluff = this.add.graphics();
    fluff.fillStyle(color, 1);
    // Draw some random circles around the center to simulate fluff
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 10 + radius - 10;
        const r = Math.random() * 10 + 5;
        fluff.fillCircle(width / 2 + Math.cos(angle) * dist, height / 2 + Math.sin(angle) * dist, r);
    }

    circle.on('pointerdown', () => {
      const { gain, isCrit } = gameState.handleClick();

      // 1. Squish tween (enhanced)
      // Stop previous tween to avoid conflict
      this.tweens.killTweensOf([circle, fluff]);
      // Reset scale
      circle.setScale(1);
      fluff.setScale(1);

      this.tweens.add({
        targets: [circle, fluff],
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeInOut'
      });

      // 2. Particle Burst
      this.clickParticles.emitParticleAt(width / 2, height / 2, 10);

      // 3. Floating text
      this.showFloatingText(
          width / 2,
          height / 2 - 60,
          isCrit ? `+${Math.floor(gain)}\nCRIT!` : `+${Math.floor(gain)}`,
          isCrit
      );

      // 4. Sound Placeholder
      if (gameState.data.soundEnabled) {
          // console.log("Play Sound");
      }

      // 5. Screen Shake on Crit
      if (isCrit) {
          this.cameras.main.shake(100, 0.005);
      }
    });

    // Add text to indicate it's clickable
    this.add.text(width / 2, height / 2 + 80, 'Click the Furball', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number) {
    // Delta is in ms, convert to seconds
    GameState.getInstance().handleAutoProduction(delta / 1000);
    // Update UI every frame for smooth numbers (optional, listener might be enough but auto-prod needs freq updates)
    this.updateUI();
  }

  updateUI() {
    const data = GameState.getInstance().data;
    this.furText.setText(`Fur: ${Math.floor(data.fur)}`);
    this.statsText.setText(
        `FPC: ${data.fpc} | FPS: ${data.fps} | Mult: x${data.globalMult}\nCrit: ${Math.round(data.critChance * 100)}% (x${data.critMult})`
    );
  }

  showFloatingText(x: number, y: number, message: string, isCrit: boolean) {
    const text = this.add.text(x, y, message, {
      fontFamily: '"Noto Sans KR", Arial',
      fontSize: isCrit ? '32px' : '24px',
      color: isCrit ? '#ff0000' : '#ffffff',
      stroke: '#000000',
      strokeThickness: isCrit ? 4 : 2,
      align: 'center',
      fontStyle: isCrit ? 'bold' : 'normal'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - (isCrit ? 100 : 50),
      alpha: 0,
      scale: isCrit ? 1.5 : 1,
      duration: isCrit ? 1000 : 800,
      ease: 'Back.out',
      onComplete: () => text.destroy()
    });
  }

  showToast(message: string) {
    const { width, height } = this.scale;

    const container = this.add.container(width / 2, height - 100);

    const bg = this.add.rectangle(0, 0, 400, 80, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0xffffff);

    const text = this.add.text(0, 0, message, {
      fontFamily: '"Noto Sans KR", Arial',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    container.add([bg, text]);

    this.tweens.add({
      targets: container,
      alpha: 0,
      delay: 4000,
      duration: 1000,
      onComplete: () => container.destroy()
    });
  }
}
