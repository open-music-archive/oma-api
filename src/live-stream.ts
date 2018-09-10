import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TextureGenerator, Texture } from './textures';

export class CompositionStream {

  private generator = new TextureGenerator();
  private textures: BehaviorSubject<Texture>;
  private totalGenerated = 0;

  constructor(private updateInterval?: number,
      private variations?: boolean,
      private textureFunc = 'generateOneoffTexture',
      private textureArgs: any[] = []) {
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
      newTexture = await this.generator.generateVariation(previousTexture.jsonld);
    } else {
      newTexture = await this.generator.generateOneoffTexture(this.textureFunc, this.textureArgs);
    }
    this.textures.next(newTexture);
    this.totalGenerated++;
    console.log("new texture, duration", newTexture.duration, "total", this.totalGenerated);
    const time = this.updateInterval ? this.updateInterval : newTexture.duration*1000;
    setTimeout(async () => this.updateTexture(), time);
  }

}