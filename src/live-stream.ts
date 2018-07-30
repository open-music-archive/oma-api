import { TextureGenerator } from './textures';

export class CompositionStream {

  private textures = new TextureGenerator();
  private currentTexture: string;

  constructor() {console.log("STREAM");}

  async getCurrentTexture(): Promise<string> {
    if (!this.currentTexture) {
      this.currentTexture = await this.textures.generateVariation();
    }
    return this.currentTexture;
  }

  async getNextTexture(): Promise<string> {
    return this.textures.generateVariation();
  }

}