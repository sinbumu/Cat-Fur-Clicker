import Phaser from 'phaser';
import { GameState } from '../GameState';

export class ShopUI extends Phaser.GameObjects.Container {
  private cards: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.createCards();
    this.scene.add.existing(this);

    // Subscribe to updates to refresh UI
    GameState.getInstance().addListener(() => {
        this.updateCards();
    });
  }

  private createCards() {
    const gameState = GameState.getInstance();
    const upgrades = gameState.balance.upgrades;
    const spacing = 160; // vertical spacing

    upgrades.forEach((u, index) => {
      const card = this.createCard(0, index * spacing, u.id);
      this.add(card);
      this.cards.push(card);
    });

    this.updateCards();
  }

  private createCard(x: number, y: number, id: string): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Background
    const bg = this.scene.add.rectangle(0, 0, 280, 140, 0x444444);
    bg.setStrokeStyle(2, 0x000000);
    container.add(bg);

    // Name
    const nameText = this.scene.add.text(-130, -60, 'Loading...', {
      fontFamily: '"Noto Sans KR", Arial', fontSize: '18px', color: '#ffffff', wordWrap: { width: 260 }
    });
    container.add(nameText);

    // Effect
    const effectText = this.scene.add.text(-130, -30, 'Effect...', {
      fontFamily: '"Noto Sans KR", Arial', fontSize: '14px', color: '#aaaaaa', wordWrap: { width: 260 }
    });
    container.add(effectText);

    // Level
    const levelText = this.scene.add.text(130, -60, 'Lv.0', {
      fontFamily: '"Noto Sans KR", Arial', fontSize: '18px', color: '#ffff00'
    }).setOrigin(1, 0);
    container.add(levelText);

    // Buy Button
    const btnBg = this.scene.add.rectangle(0, 40, 260, 40, 0x00aa00);
    container.add(btnBg);
    const btnText = this.scene.add.text(0, 40, 'Buy', {
      fontFamily: '"Noto Sans KR", Arial', fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5);
    container.add(btnText);

    // Lock Overlay (initially hidden)
    const lockOverlay = this.scene.add.rectangle(0, 0, 280, 140, 0x000000, 0.8);
    const lockText = this.scene.add.text(0, 0, 'LOCKED', {
        fontFamily: '"Noto Sans KR", Arial', fontSize: '24px', color: '#ff0000'
    }).setOrigin(0.5);
    const lockConditionText = this.scene.add.text(0, 30, '', {
        fontFamily: '"Noto Sans KR", Arial', fontSize: '14px', color: '#cccccc'
    }).setOrigin(0.5);

    container.add([lockOverlay, lockText, lockConditionText]);

    // Assign data to container for easy access in update
    container.setData('elements', {
        bg, nameText, effectText, levelText, btnBg, btnText, lockOverlay, lockText, lockConditionText
    });
    container.setData('id', id);

    // Interaction
    btnBg.setInteractive({ useHandCursor: true })
         .on('pointerdown', () => {
             GameState.getInstance().buyUpgrade(id);
         });

    return container;
  }

  private updateCards() {
    const gameState = GameState.getInstance();

    this.cards.forEach(card => {
        const id = card.getData('id');
        const config = gameState.balance.upgrades.find(u => u.id === id);
        if (!config) return;

        const level = gameState.data.upgrades[id];
        const isUnlocked = gameState.isUnlocked(id);
        const canAfford = gameState.canAfford(id);
        const maxLevel = config.costs.length;
        const isMaxed = level >= maxLevel;
        const nextCost = isMaxed ? 'MAX' : config.costs[level];

        const els = card.getData('elements');

        // Update texts
        els.nameText.setText(config.name);
        els.levelText.setText(`Lv.${level}`);

        let effectDesc = '';
        if (config.effect.stat === 'FPC') effectDesc = `+${config.effect.perLevel} per Click`;
        else if (config.effect.stat === 'FPS') effectDesc = `+${config.effect.perLevel} / sec`;
        else if (config.effect.stat === 'globalMult') effectDesc = `+${(config.effect.perLevel! * 100)}% Multiplier`;
        else if (config.effect.stat === 'critChance') effectDesc = `+${(config.effect.perLevel! * 100)}% Crit Chance`;

        els.effectText.setText(effectDesc);

        // Update Button
        els.btnText.setText(typeof nextCost === 'number' ? `Cost: ${nextCost}` : 'MAXED');

        if (isMaxed) {
             els.btnBg.setFillStyle(0x555555);
             els.btnBg.disableInteractive();
        } else if (canAfford) {
             els.btnBg.setFillStyle(0x00aa00);
             els.btnBg.setInteractive();
        } else {
             els.btnBg.setFillStyle(0xaa0000);
             els.btnBg.setInteractive(); // Keep interactive? Maybe just visual feedback.
             // Usually disabled or red.
        }

        // Lock State
        if (isUnlocked) {
            els.lockOverlay.setVisible(false);
            els.lockText.setVisible(false);
            els.lockConditionText.setVisible(false);
            if (!isMaxed) els.btnBg.setInteractive();
        } else {
            els.lockOverlay.setVisible(true);
            els.lockText.setVisible(true);
            els.lockConditionText.setVisible(true);
            els.btnBg.disableInteractive();

            if (config.unlock?.type === 'totalFurEarned') {
                els.lockConditionText.setText(`Req: ${config.unlock.min} Total Fur`);
            }
        }
    });
  }
}
