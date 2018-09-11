import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Texture, Variation } from './texture';

export class CompositionStream {

  private textures: BehaviorSubject<Texture>;
  private totalGenerated = 0;

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
    console.log("new texture, duration", duration, "total", this.totalGenerated);
    const time = this.updateInterval ? this.updateInterval : duration*1000;
    setTimeout(async () => this.updateTexture(), time);
  }

}