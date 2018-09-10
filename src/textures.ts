import * as _ from 'lodash';
import { DymoGenerator, uris } from 'dymo-core';
import { DbSoundObject } from './db-types';
import * as featureDb from './feature-db';
import { mapSeries } from './util';

export interface TextureOptions {
  loop?: boolean,
  repeat?: number,
  duration?: number,
  objects?: DbSoundObject[]
}

export abstract class Texture {

  protected dymoGen = new DymoGenerator();
  protected uri: Promise<string>;
  protected jsonld: Promise<string>;

  constructor(protected options: TextureOptions) {
    this.regenerate();
  }

  async regenerate() {
    this.uri = this.generate();
    await this.postGenerate();
    this.jsonld = this.dymoGen.getStore().uriToJsonld(await this.uri);
    return this;
  }

  async getUri(): Promise<string> {
    return this.uri;
  }

  async getJsonld(): Promise<string> {
    return this.jsonld;
  }

  //TODO make abstract??
  async getDuration(): Promise<number> {
    return this.dymoGen.getStore().findParameterValue(await this.uri, uris.DURATION);
  }

  /**returns the uri of whatever this texture consists of*/
  protected abstract generate(): Promise<string>;

  private async postGenerate(): Promise<any> {
    if (this.options.loop) {
      await this.dymoGen.setDymoParameter(await this.uri, uris.LOOP, 1);
    }
    if (this.options.repeat) {
      await this.dymoGen.setDymoParameter(await this.uri, uris.REPEAT, this.options.repeat);
    }
  }

  protected async addRandomOnsetDymo(parentUri: string, audioUri: string, maxOnset: number) {
    const dymo = await this.addRandomDymo(parentUri, audioUri, true, true);
    const onset = maxOnset*Math.random();
    await this.dymoGen.setDymoParameter(dymo, uris.ONSET, onset);
    return dymo;
  }

  protected async addRandomDymo(parentUri: string, audioUri: string, panning: boolean, effects: boolean) {
    const dymo = await this.dymoGen.addDymo(parentUri, audioUri);
    if (panning) {
      await this.dymoGen.setDymoParameter(dymo, uris.AMPLITUDE, Math.random());
      await this.dymoGen.setDymoParameter(dymo, uris.PAN, Math.random()-0.5);
      await this.dymoGen.setDymoParameter(dymo, uris.DISTANCE, Math.random()-0.5);
      await this.dymoGen.setDymoParameter(dymo, uris.HEIGHT, Math.random()-0.5);
    }
    if (effects) {
      const reverb = _.random(2) ? 0 : 0.3*Math.random();
      await this.dymoGen.setDymoParameter(dymo, uris.REVERB, reverb);
      const delay = _.random(2) ? 0 : Math.random();
      await this.dymoGen.setDymoParameter(dymo, uris.DELAY, delay);
      //await this.dymoGen.setDymoParameter(dymo, uris.TIME_STRETCH_RATIO, Math.random());
    }
    return dymo;
  }

}

export class Variation extends Texture {

  constructor(private modelJsonld: string) { super({}); }

  protected async generate(): Promise<string> {
    //load the model texture
    await this.dymoGen.getStore().loadData(this.modelJsonld);
    const modelUri = (await this.dymoGen.getStore().findTopDymos())[0];
    //create the variation (replace one audio file)
    const variationUri = await this.dymoGen.addDeepCopy(modelUri);
    const allDymos = await this.dymoGen.getStore().findAllObjectsInHierarchy(variationUri);
    const sources = await Promise.all(allDymos.map(async d => await this.dymoGen.getStore().getSourcePath(d)));
    const dymosWithSources = allDymos.filter((_,i) => sources[i]);
    const randomDymo = _.sample(dymosWithSources);
    const audio = await this.dymoGen.getStore().getSourcePath(randomDymo);
    const similarAudio = await featureDb.getSimilarAudio(audio).catch(e => console.log(e));
    if (similarAudio) {
      await this.dymoGen.getStore().setValue(randomDymo, uris.HAS_SOURCE, similarAudio);
    }
    return variationUri;
  }

}

export class SimilarityLoop extends Texture {

  protected async generate(): Promise<string> {
    const objects = await featureDb.getSimilarSoundObjects((await featureDb.getRandomSoundObjects(1))[0]);
    const audioUris = objects.map(o => o.audioUri);
    const loop = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    await this.dymoGen.setDymoParameter(loop, uris.REPEAT, 3);
    await Promise.all(audioUris.map(a => this.addRandomDymo(loop, a, true, true)));
    return loop;
  }

}

export class RandomConcat extends Texture {

  protected async generate(): Promise<string> {
    const sequence = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    let objects = await featureDb.getLoudestSoundObjectsOfDuration(Math.random()/2+0.125, _.random(25)+1);
    let totalDuration = _.sum(objects.map(o => o.duration));
    await this.dymoGen.setDymoParameter(sequence, uris.DURATION, totalDuration);
    const audioUris = objects.map(o => o.audioUri);
    await Promise.all(audioUris.map(a => this.addRandomDymo(sequence, a, true, true)));
    return sequence;
  }

}

export class RandomOnset extends Texture {

  protected async generate(): Promise<string> {
    //TODO THIS KEEPS THE SAME OBJECTS WHEN REGENERATED. NICE!!!!!! (but should be optional)
    if (!this.options.objects) {
      this.options.objects = await featureDb.getLongAndShortObjects(_.random(25)+1, _.random(25)+1);
    }
    if (!this.options.duration) {
      this.options.duration = 4*Math.random()+2;
    }
    const audioUris = this.options.objects.map(o => o.audioUri);
    const sequence = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    await Promise.all(audioUris.map(a => this.addRandomOnsetDymo(sequence, a, this.options.duration)));
    return sequence;
  }

}

export abstract class ComposedTexture extends Texture {
  constructor(protected subTextures: Texture[], options: TextureOptions) {
    super(options);
  }
}

export abstract class TextureSequence extends ComposedTexture {
  protected async generate() {
    const structure = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    await mapSeries(this.subTextures, async t => {
      return this.dymoGen.getStore().addPart(structure, await t.getUri());
    });
    return structure;
  }
}