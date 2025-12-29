import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import './style.css';
import WebFont from 'webfontloader';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  backgroundColor: '#2d2d2d',
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

WebFont.load({
  google: {
    families: ['Noto Sans KR']
  },
  active: () => {
    new Phaser.Game(config);
  },
  inactive: () => {
    // Fallback if font fails to load, still start the game
    console.warn('Font loading failed, starting game anyway');
    new Phaser.Game(config);
  }
});
