import balanceDataRaw from './config/balance.demo_10min_v1.json';

// Define types based on the JSON structure
interface EffectConfig {
  type: string;
  stat: string;
  perLevel?: number;
  base?: number;
  interpretation?: string;
}

interface UnlockConfig {
  type: string;
  min: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  effect: EffectConfig;
  costs: number[];
  unlock?: UnlockConfig;
  critMult?: number; // For the 'D' upgrade special case or generic if needed
}

interface BalanceData {
  meta: any;
  upgrades: UpgradeConfig[];
}

const balanceData = balanceDataRaw as BalanceData;

export interface GameStateData {
  fur: number;
  totalFurEarned: number;
  fpc: number;
  fps: number;
  globalMult: number;
  critChance: number;
  critMult: number;
  upgrades: { [id: string]: number }; // id -> level
  lastSaveTime?: number;
  soundEnabled: boolean;
}

interface SavedData {
  fur: number;
  totalFurEarned: number;
  upgrades: { [id: string]: number };
  lastSaveTime: number;
  soundEnabled?: boolean;
}

const SAVE_KEY = 'dust_bunny_save_v1';

export class GameState {
  private static instance: GameState;

  public data: GameStateData;
  public balance: BalanceData;
  private listeners: Function[] = [];

  public offlineEarnings: number = 0;
  private saveTimeout: any;

  private constructor() {
    this.balance = balanceData;
    this.data = {
      fur: 0,
      totalFurEarned: 0,
      fpc: 1,
      fps: 0,
      globalMult: 1,
      critChance: 0.05,
      critMult: 10,
      upgrades: {},
      soundEnabled: true
    };

    // Initialize upgrade levels to 0
    this.balance.upgrades.forEach(u => {
      this.data.upgrades[u.id] = 0;
    });

    this.load();
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public addListener(callback: Function) {
    this.listeners.push(callback);
  }

  public notifyListeners() {
    this.listeners.forEach(cb => cb(this.data));
    this.triggerSave();
  }

  public toggleSound() {
    this.data.soundEnabled = !this.data.soundEnabled;
    this.notifyListeners();
  }

  public resetSave() {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }

  public handleAutoProduction(deltaTimeSeconds: number) {
    if (this.data.fps > 0) {
      const gain = this.data.fps * deltaTimeSeconds * this.data.globalMult;
      this.data.fur += gain;
      this.data.totalFurEarned += gain;
      this.notifyListeners(); // Will trigger save debounce
    }
  }

  public handleClick(): { gain: number; isCrit: boolean } {
    let gain = this.data.fpc * this.data.globalMult;
    const isCrit = Math.random() < this.data.critChance;

    if (isCrit) {
      gain *= this.data.critMult;
    }

    this.data.fur += gain;
    this.data.totalFurEarned += gain;
    this.notifyListeners();

    return { gain, isCrit };
  }

  public canAfford(upgradeId: string): boolean {
    const level = this.data.upgrades[upgradeId];
    const config = this.balance.upgrades.find(u => u.id === upgradeId);
    if (!config || level >= config.costs.length) return false;

    const cost = config.costs[level];
    return this.data.fur >= cost;
  }

  public isUnlocked(upgradeId: string): boolean {
    const config = this.balance.upgrades.find(u => u.id === upgradeId);
    if (!config) return false;
    if (!config.unlock) return true; // No unlock condition = unlocked

    if (config.unlock.type === 'totalFurEarned') {
        return this.data.totalFurEarned >= config.unlock.min;
    }
    return true;
  }

  public buyUpgrade(upgradeId: string) {
    if (!this.canAfford(upgradeId)) return;
    if (!this.isUnlocked(upgradeId)) return;

    const config = this.balance.upgrades.find(u => u.id === upgradeId);
    if (!config) return;

    const level = this.data.upgrades[upgradeId];
    const cost = config.costs[level];

    this.data.fur -= cost;
    this.data.upgrades[upgradeId]++;

    this.recalculateStats();
    this.notifyListeners();
  }

  private triggerSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
        this.save();
        this.saveTimeout = null;
    }, 2000); // 2 seconds debounce
  }

  private save() {
    const saveData: SavedData = {
        fur: this.data.fur,
        totalFurEarned: this.data.totalFurEarned,
        upgrades: this.data.upgrades,
        lastSaveTime: Date.now(),
        soundEnabled: this.data.soundEnabled
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.error('Failed to save game', e);
    }
  }

  private load() {
    try {
        const json = localStorage.getItem(SAVE_KEY);
        if (json) {
            const saved: SavedData = JSON.parse(json);

            // Restore basic stats
            this.data.fur = saved.fur || 0;
            this.data.totalFurEarned = saved.totalFurEarned || 0;
            this.data.soundEnabled = saved.soundEnabled !== undefined ? saved.soundEnabled : true;

            // Restore upgrades
            // Merge with current balance structure in case new upgrades were added
            this.balance.upgrades.forEach(u => {
                if (saved.upgrades && saved.upgrades[u.id] !== undefined) {
                    this.data.upgrades[u.id] = saved.upgrades[u.id];
                }
            });

            this.recalculateStats();

            // Calculate offline earnings
            if (saved.lastSaveTime) {
                const now = Date.now();
                const diffSeconds = (now - saved.lastSaveTime) / 1000;

                // Cap at 1 hour (3600 seconds)
                const offlineSeconds = Math.min(diffSeconds, 3600);

                if (offlineSeconds > 0 && this.data.fps > 0) {
                    const gain = this.data.fps * offlineSeconds * this.data.globalMult;
                    this.offlineEarnings = gain;
                    this.data.fur += gain;
                    this.data.totalFurEarned += gain;
                }
            }
        } else {
            // First run, recalculate default stats
            this.recalculateStats();
        }
    } catch (e) {
        console.error('Failed to load game', e);
        this.recalculateStats();
    }
  }

  private recalculateStats() {
    let fpc = 1;
    let fps = 0;
    let globalMult = 1;
    let critChance = 0.05;
    let critMult = 10; // Default

    this.balance.upgrades.forEach(u => {
        const level = this.data.upgrades[u.id];
        const effect = u.effect;

        if (effect.type === 'add') {
             if (effect.stat === 'FPC') {
                 fpc += level * (effect.perLevel || 0);
             } else if (effect.stat === 'FPS') {
                 fps += level * (effect.perLevel || 0);
             } else if (effect.stat === 'critChance') {
                 critChance += level * (effect.perLevel || 0);
             }
        } else if (effect.type === 'add_multiplier') {
            if (effect.stat === 'globalMult') {
                globalMult += level * (effect.perLevel || 0);
            }
        }

        if (u.id === 'D' && u.critMult) {
             critMult = u.critMult;
        }
    });

    this.data.fpc = fpc;
    this.data.fps = fps;
    this.data.globalMult = globalMult;
    this.data.critChance = critChance;
    this.data.critMult = critMult;
  }
}
