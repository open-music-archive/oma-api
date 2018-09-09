import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TextureGenerator, Texture } from './textures';

export class CompositionStream {

  private generator = new TextureGenerator();
  private textures: BehaviorSubject<Texture>;
  private totalGenerated = 0;

  constructor() {
    this.textures = new BehaviorSubject<Texture>(null);
    this.updateTexture();
  }

  getTextureStream(): Observable<Texture> {
    return this.textures.asObservable();
  }

  private async updateTexture() {
    const previousTexture = this.textures.getValue();
    let newTexture: Texture;
    if (!previousTexture) {
      newTexture = await this.generator.generateOneoffTexture()//this.generator.generateVariation();
    } else {
      newTexture = await this.generator.generateVariation(previousTexture.jsonld);
    }
    this.textures.next(newTexture);
    this.totalGenerated++;
    console.log("new texture, duration", newTexture.duration, "total", this.totalGenerated);
    setTimeout(async () => this.updateTexture(), newTexture.duration*1000);
  }

}