import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Texture, Variation } from './texture';

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

  constructor(protected options: CompositionOptions) {
    this.textures = new BehaviorSubject<Texture>(null);
    this.update();
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
    console.log("new texture, duration "+ duration+ ", total generated "+ this.totalGenerated
      + ", time taken " + timeDiff + ", " + this.getMemoryUsage());
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