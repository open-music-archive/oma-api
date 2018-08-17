import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TextureGenerator, Texture } from './textures';

export class CompositionStream {

  private generator = new TextureGenerator();
  private textures: BehaviorSubject<Texture>;

  constructor() {
    this.textures = new BehaviorSubject({jsonld:"",duration:null});
    this.updateTexture();
  }

  getTextureStream(): Observable<Texture> {
    return this.textures.asObservable();
  }

  private async updateTexture() {
    const newTexture = await this.generator.generateVariation();
    this.textures.next(newTexture);
    console.log("new texture, duration", newTexture.duration);
    setTimeout(async () => this.updateTexture(), newTexture.duration*1000);
  }

}