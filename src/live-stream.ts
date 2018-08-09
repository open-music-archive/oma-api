import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TextureGenerator } from './textures';

export class CompositionStream {

  private generator = new TextureGenerator();
  private textures: BehaviorSubject<string>;

  constructor() {
    this.textures = new BehaviorSubject("");
    this.start();
  }

  private start() {
    this.updateTexture();
    setInterval(async () => this.updateTexture(), 5000);
  }

  getTextureStream(): Observable<string> {
    return this.textures.asObservable();
  }

  private async updateTexture() {
    this.textures.next(await this.generator.generateVariation());
  }

}