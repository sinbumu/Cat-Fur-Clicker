import Phaser from 'phaser';
import { GameState } from '../GameState';

export class SettingsUI {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private modalContainer!: Phaser.GameObjects.Container;
    private isModalOpen: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;
        this.container = scene.add.container(x, y);

        // Settings Gear Icon (Placeholder: Circle with 'S')
        const bg = scene.add.circle(0, 0, 20, 0x444444);
        bg.setStrokeStyle(2, 0xffffff);
        bg.setInteractive({ useHandCursor: true });

        const text = scene.add.text(0, 0, '⚙️', {
            fontSize: '24px'
        }).setOrigin(0.5);

        this.container.add([bg, text]);

        bg.on('pointerdown', () => {
            this.toggleModal();
        });

        this.createModal();
    }

    private createModal() {
        const { width, height } = this.scene.scale;

        this.modalContainer = this.scene.add.container(width / 2, height / 2);
        this.modalContainer.setVisible(false);
        this.modalContainer.setDepth(1000); // Always on top

        // Modal Background (Blocker)
        const blocker = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        blocker.setInteractive(); // Blocks clicks below
        // Note: blocker is centered at modalContainer (width/2, height/2), so local 0,0 is correct for fullscreen rect if origin is 0.5
        // But rectangle default origin is 0.5. So 0,0 is center of screen. Correct.

        // Modal Window
        const windowBg = this.scene.add.rectangle(0, 0, 300, 250, 0x222222);
        windowBg.setStrokeStyle(2, 0xffffff);

        const title = this.scene.add.text(0, -100, 'SETTINGS', {
            fontFamily: '"Noto Sans KR", Arial',
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Close Button
        const closeBtn = this.scene.add.text(130, -105, 'X', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ff0000'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.toggleModal());

        // Sound Toggle
        const soundLabel = this.scene.add.text(-80, -20, 'Sound', {
             fontSize: '20px', color: '#ffffff'
        }).setOrigin(0, 0.5);

        const soundToggleBtn = this.scene.add.rectangle(80, -20, 20, 20, 0xffffff);
        soundToggleBtn.setInteractive({ useHandCursor: true });
        const soundStatusText = this.scene.add.text(80, -20, '', {
            fontSize: '16px', color: '#000000'
        }).setOrigin(0.5);

        const updateSoundBtn = () => {
            const enabled = GameState.getInstance().data.soundEnabled;
            soundToggleBtn.setFillStyle(enabled ? 0x00ff00 : 0xff0000);
            soundStatusText.setText(enabled ? 'ON' : 'OFF');
        };
        updateSoundBtn();

        soundToggleBtn.on('pointerdown', () => {
            GameState.getInstance().toggleSound();
            updateSoundBtn();
        });

        // Reset Save Button
        const resetBtn = this.scene.add.rectangle(0, 60, 200, 40, 0xaa0000);
        resetBtn.setInteractive({ useHandCursor: true });
        const resetText = this.scene.add.text(0, 60, 'RESET SAVE', {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        resetBtn.on('pointerdown', () => {
            this.showConfirmation();
        });

        this.modalContainer.add([blocker, windowBg, title, closeBtn, soundLabel, soundToggleBtn, soundStatusText, resetBtn, resetText]);
    }

    private toggleModal() {
        this.isModalOpen = !this.isModalOpen;
        this.modalContainer.setVisible(this.isModalOpen);
    }

    private showConfirmation() {
        // Simple confirmation overlay on top of settings
        const confirmContainer = this.scene.add.container(0, 0); // Relative to modal is tricky, let's just make it relative to modalContainer or a new top level one.
        // Easier to just add to modalContainer but cover everything

        const bg = this.scene.add.rectangle(0, 0, 300, 250, 0x000000, 0.9);
        const text = this.scene.add.text(0, -40, 'Are you sure?\nThis will wipe all progress.', {
            fontSize: '18px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        const yesBtn = this.scene.add.rectangle(-60, 40, 80, 40, 0xff0000).setInteractive({ useHandCursor: true });
        const yesText = this.scene.add.text(-60, 40, 'YES', { fontSize: '18px' }).setOrigin(0.5);

        const noBtn = this.scene.add.rectangle(60, 40, 80, 40, 0x444444).setInteractive({ useHandCursor: true });
        const noText = this.scene.add.text(60, 40, 'NO', { fontSize: '18px' }).setOrigin(0.5);

        confirmContainer.add([bg, text, yesBtn, yesText, noBtn, noText]);

        this.modalContainer.add(confirmContainer);

        yesBtn.on('pointerdown', () => {
            GameState.getInstance().resetSave();
        });

        noBtn.on('pointerdown', () => {
            confirmContainer.destroy();
        });
    }
}
