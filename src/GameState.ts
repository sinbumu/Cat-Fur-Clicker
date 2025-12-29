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
}

export class GameState {
  private static instance: GameState;

  public data: GameStateData;
  public balance: BalanceData;
  private listeners: Function[] = [];

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
      upgrades: {}
    };

    // Initialize upgrade levels to 0
    this.balance.upgrades.forEach(u => {
      this.data.upgrades[u.id] = 0;
    });

    this.recalculateStats();
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
  }

  public handleAutoProduction(deltaTimeSeconds: number) {
    // Recalculate stats first? No, stats only change on upgrade.
    // However, fps might depend on something dynamic? No, it's level based.

    if (this.data.fps > 0) {
      const gain = this.data.fps * deltaTimeSeconds * this.data.globalMult;
      this.data.fur += gain;
      this.data.totalFurEarned += gain;
      this.notifyListeners();
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

    // Unlocks might happen due to totalFurEarned increase
    // We can check strictly on UI or check here.
    // But since UI needs to know about unlock status, maybe we don't store "isUnlocked" in state,
    // but derive it from totalFurEarned in the UI or a helper.

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

  private recalculateStats() {
    // Reset to defaults
    // Note: If base values are not 0, we need to be careful.
    // The prompt says:
    // A: fpc = 1 + level(A)*1
    // B: fps = level(B)*0.2
    // C: globalMult = 1 + level(C)*0.02
    // D: critChance = 0.05 + level(D)*0.005

    // Let's implement generic logic based on JSON effect types where possible,
    // but fallback to prompt formulas if JSON is ambiguous or as per instruction "JSON 우선".

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
                 // JSON: perLevel: 1. Prompt: 1 + level*1.
                 // So we add level * perLevel to base.
                 fpc += level * (effect.perLevel || 0);
             } else if (effect.stat === 'FPS') {
                 fps += level * (effect.perLevel || 0);
             } else if (effect.stat === 'critChance') {
                 // JSON has "base": 0.05.
                 // We should probably start with that base if it's the only source?
                 // But wait, we initialized defaults above.
                 // Let's treat "base" in effect as "starting value override" or just ignore if we hardcoded defaults.
                 // Prompt says: critChance = 0.05 + level * 0.005
                 critChance += level * (effect.perLevel || 0);
             }
        } else if (effect.type === 'add_multiplier') {
            if (effect.stat === 'globalMult') {
                // Prompt: 1 + level * 0.02
                globalMult += level * (effect.perLevel || 0);
            }
        }

        // Special case for 'D' which defines critMult in the root of the upgrade object?
        if (u.id === 'D' && u.critMult) {
             // The prompt says "critMult=10" default.
             // Does leveling D change critMult?
             // JSON has "critMult": 10 at top level of upgrade D.
             // It doesn't seem to scale with level in the prompt description, just part of the upgrade definition.
             // Maybe it overrides the default? It matches the default.
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
