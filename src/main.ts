import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import './style.css'; // Assuming style.css exists from scaffolding, or I should verify/create it.

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app', // Matches the ID in index.html (usually 'app' for Vite templates)
  backgroundColor: '#2d2d2d',
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
