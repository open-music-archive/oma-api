import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Texture, Variation, SoundMaterial } from './texture';
import * as textures from './textures';

export interface CompositionOptions {
  updateInterval?: number,
  updateIntervalRange?: [number, number],
  variations?: boolean,
  defaultTexture?: Texture
}

export abstract class CompositionStream {

  protected textures: BehaviorSubject<Texture>;
  protected totalGenerated = 0;
  protected previousTime: number;
  protected previousInterval: number;
  protected loaded: Promise<any>;

  constructor(protected options: CompositionOptions) {
    this.textures = new BehaviorSubject<Texture>(null);
    this.loaded = this.update();
  }

  getTextureStream(): Observable<Texture> {
    return this.textures.asObservable();
  }

  protected abstract getNextTexture(): Promise<Texture>;

  protected getNewUpdateInterval(duration: number) {
    if (this.options.updateIntervalRange) {
      const r = this.options.updateIntervalRange
      return _.random(r[1]-r[0])+r[0];
    } else if (this.options.updateInterval) {
      return this.options.updateInterval;
    }
    return duration*1000;
  }

  protected async update() {
    const newTexture = await this.getNextTexture();
    this.textures.next(newTexture);
    this.totalGenerated++;
    const duration = await newTexture.getDuration();
    const time = Date.now();
    const timeDiff = this.previousTime ? Math.round((time-this.previousTime-this.previousInterval))/1000 : 0;
    console.log("new texture, duration "+ duration
      + ", after interval "+ this.previousInterval
      + ", total generated "+ this.totalGenerated
      + ", time taken " + timeDiff
      + ", " + this.getMemoryUsage());
    this.previousTime = time;
    this.previousInterval = this.getNewUpdateInterval(duration);
    setTimeout(async () => this.update(), this.previousInterval);
  }

  protected getMemoryUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    return "memory " + (Math.round(used * 100) / 100) + "MB";
  }

}

export class SimpleComposition extends CompositionStream {
  protected async getNextTexture() {
    const previousTexture = this.textures.getValue();
    if (previousTexture && this.options.variations) {
      return new Variation(await previousTexture.getJsonld());
    } else {
      return this.options.defaultTexture.regenerate();
    }
  }
}

export class GrowingComposition extends CompositionStream {

  private MAX_LEVEL = 3;
  private activityLevel: number;
  private crackling = textures.getCracklingLoop();
  private low = textures.getDenseRecentMaterialLoop(SoundMaterial.Quieter);
  private mid = textures.getDenseRecentMaterialLoop(SoundMaterial.Longer);
  private high = textures.getDenseRecentMaterialLoop(SoundMaterial.LoudestAndLong);

  protected async getNextTexture() {
    await this.loaded;
    this.updateActivityLevel();
    console.log("activity level", this.activityLevel);
    if (this.activityLevel == 0) {
      return this.crackling.regenerate();
    } else if (this.activityLevel == 1) {
      return this.low.regenerate();
    } else if (this.activityLevel == 2) {
      return this.mid.regenerate();
    } else if (this.activityLevel == 3) {
      return this.high.regenerate();
    }
  }

  private updateActivityLevel() {

    if (this.activityLevel == undefined) {
      this.activityLevel = 0;
    } else {
      const delta = Math.random() < 0.5 ? 1 : -1;
      const newLevel = this.activityLevel+delta;
      this.activityLevel = Math.min(Math.max(newLevel, 0), this.MAX_LEVEL);
    }
  }

}