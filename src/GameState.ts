// import balanceData from './config/balance.demo_10min_v1.json';

export interface GameStateData {
  fur: number;
  totalFurEarned: number;
  fpc: number;
  fps: number;
  globalMult: number;
  critChance: number;
  critMult: number;
}

export class GameState {
  private static instance: GameState;

  public data: GameStateData;
  private listeners: Function[] = [];

  private constructor() {
    this.data = {
      fur: 0,
      totalFurEarned: 0,
      fpc: 1,
      fps: 0,
      globalMult: 1,
      // Initialize based on prompt defaults, could also infer from config if needed.
      // The prompt explicitly said: critChance=0.05, critMult=10
      critChance: 0.05,
      critMult: 10
    };

    // In a real scenario, we might override defaults from balanceData here
    // e.g. this.data.critChance = balanceData.upgrades.find(u => u.id === 'D')?.effect.base || 0.05;
    // For now, sticking to the explicit instruction values.
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
    this.notifyListeners();

    return { gain, isCrit };
  }
}
