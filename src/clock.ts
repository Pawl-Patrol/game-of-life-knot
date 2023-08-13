class Cooldown {
  private lastTime = 0;

  constructor(private cooldown: number) {}

  ready(now: number) {
    if (now - this.lastTime > this.cooldown) {
      this.lastTime = now;
      return true;
    }
    return false;
  }
}

export class Clock {
  private startTime = 0;
  private lastTime = 0;
  public deltaTime = 0;
  public elapsed = 0;

  private cooldowns = new Map<string, Cooldown>();

  start(now: number) {
    this.startTime = now;
    this.lastTime = now;
  }

  tick(now: number) {
    this.deltaTime = now - this.lastTime;
    this.elapsed = now - this.startTime;
    this.lastTime = now;
  }

  addCooldown(name: string, ms: number) {
    this.cooldowns.set(name, new Cooldown(ms));
  }

  ready(name: string) {
    const cooldown = this.cooldowns.get(name);
    if (!cooldown) throw new Error(`Cooldown ${name} not found`);
    return cooldown.ready(performance.now());
  }
}
