import Phaser from 'phaser';
import { GameState } from '../GameState';
import { ShopUI } from '../ui/ShopUI';

export default class MainScene extends Phaser.Scene {
  private furText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;

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

    // Shop UI
    // Place shop on the right side
    // Card width 280. Center at 0,0 relative to container.
    // So container at width - 150 gives margin.
    new ShopUI(this, width - 150, 100);

    // Update UI immediately
    this.updateUI();

    // Subscribe to state changes
    gameState.addListener(() => {
        // We can update UI here or in update loop.
        // Updating here ensures it reflects immediate changes like clicks.
        this.updateUI();
    });

    const radius = 50;
    const color = 0xcccccc; // Light gray

    // Using a Circle Game Object might be simpler for "placeholder" clickability
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

      // Visual feedback
      this.tweens.add({
        targets: [circle, fluff],
        scale: 0.9,
        duration: 50,
        yoyo: true,
      });

      // Floating text for gain
      this.showFloatingText(width / 2, height / 2 - 60, `+${Math.floor(gain)}` + (isCrit ? ' CRIT!' : ''), isCrit ? '#ff0000' : '#ffffff');
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

  showFloatingText(x: number, y: number, message: string, color: string) {
    const text = this.add.text(x, y, message, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }
}
