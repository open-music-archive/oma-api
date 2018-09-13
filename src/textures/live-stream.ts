import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Texture, Variation } from './texture';

export class CompositionStream {

  private textures: BehaviorSubject<Texture>;
  private totalGenerated = 0;
  private previousTime: number;

  constructor(private updateInterval?: number,
      private variations?: boolean,
      private defaultTexture?: Texture) {
    this.textures = new BehaviorSubject<Texture>(null);
    this.updateTexture();
  }

  getTextureStream(): Observable<Texture> {
    return this.textures.asObservable();
  }

  private async updateTexture() {
    const previousTexture = this.textures.getValue();
    let newTexture: Texture;
    if (previousTexture && this.variations) {
      newTexture = await new Variation(await previousTexture.getJsonld());
    } else {
      newTexture = await this.defaultTexture.regenerate();
    }
    this.textures.next(newTexture);
    this.totalGenerated++;
    const duration = await newTexture.getDuration();
    const time = Date.now();
    const timeDiff = this.previousTime ? time-this.previousTime : 0;
    console.log("new texture, duration "+ duration+ ", total generated "+ this.totalGenerated
      + ", time taken " + Math.round(timeDiff/1000) + ", " + this.getMemoryUsage());
    const interval = this.updateInterval ? this.updateInterval : duration*1000;
    this.previousTime = time;
    setTimeout(async () => this.updateTexture(), interval);
  }

  private getMemoryUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    return "memory " + (Math.round(used * 100) / 100) + "MB";
  }

}