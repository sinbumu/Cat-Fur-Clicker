import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // Preload assets here if needed
  }

  create() {
    const { width, height } = this.scale;

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

    // Group them? Or just use the main circle for interaction.
    // Let's keep it simple. The main circle captures the click.

    circle.on('pointerdown', () => {
      console.log('Dust bunny clicked!');
      // Visual feedback
      this.tweens.add({
        targets: [circle, fluff],
        scale: 0.9,
        duration: 50,
        yoyo: true,
      });
    });

    // Add text to indicate it's clickable
    this.add.text(width / 2, height / 2 + 80, 'Click the Furball', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}
