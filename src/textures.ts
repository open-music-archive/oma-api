import * as _ from 'lodash';
import { DymoGenerator, uris } from 'dymo-core';
import { DbSoundObject } from './db-types';
import * as featureDb from './feature-db';
import { mapSeries } from './util';

export enum SoundMaterial {
  Random,
  Similars,
  Loudest,
  LongAndShort
}

export interface TextureOptions {
  loop?: boolean,
  repeat?: number,
  duration?: number,
  objects?: DbSoundObject[],
  materialType?: SoundMaterial,
  maxMaterialSize?: number,
  regenerateSoundMaterial?: boolean,
  panning?: boolean,
  effects?: boolean
}

export abstract class Texture {

  protected dymoGen = new DymoGenerator();
  protected uri: Promise<string>;
  protected jsonld: Promise<string>;

  constructor(protected options: TextureOptions) {
    this.regenerate();
  }

  async regenerate() {
    await this.initSoundMaterial();
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

  private async initSoundMaterial(): Promise<void> {
    if (!this.options.objects || this.options.regenerateSoundMaterial) {
      const maxSize = this.options.maxMaterialSize || 25;
      if (this.options.materialType == SoundMaterial.Similars) {
        const randomObject = (await featureDb.getRandomSoundObjects(1))[0];
        this.options.objects = await featureDb.getSimilarSoundObjects(randomObject);
      } else if (this.options.materialType == SoundMaterial.Random) {
        this.options.objects = await featureDb
          .getRandomSoundObjects(_.random(maxSize)+1);
      } else if (this.options.materialType == SoundMaterial.Loudest) {
        const duration = Math.random()/2+0.125;
        this.options.objects = await featureDb
          .getLoudestSoundObjectsOfDuration(duration, _.random(maxSize)+1);
      } else {
        this.options.objects = await featureDb
          .getLongAndShortObjects(_.random(maxSize/2)+1, _.random(maxSize/2)+1);
      }
    }
  }

  private async postGenerate(): Promise<void> {
    if (this.options.loop) {
      await this.dymoGen.setDymoParameter(await this.uri, uris.LOOP, 1);
    }
    if (this.options.repeat) {
      await this.dymoGen.setDymoParameter(await this.uri, uris.REPEAT, this.options.repeat);
    }
  }

  protected async addRandomOnsetDymo(parentUri: string, audioUri: string, maxOnset: number) {
    const dymo = await this.addRandomDymo(parentUri, audioUri);
    const onset = maxOnset*Math.random();
    await this.dymoGen.setDymoParameter(dymo, uris.ONSET, onset);
    return dymo;
  }

  protected async addRandomDymo(parentUri: string, audioUri: string) {
    const dymo = await this.dymoGen.addDymo(parentUri, audioUri);
    if (this.options.panning) {
      await this.dymoGen.setDymoParameter(dymo, uris.AMPLITUDE, Math.random());
      await this.dymoGen.setDymoParameter(dymo, uris.PAN, Math.random()-0.5);
      await this.dymoGen.setDymoParameter(dymo, uris.DISTANCE, Math.random()-0.5);
      await this.dymoGen.setDymoParameter(dymo, uris.HEIGHT, Math.random()-0.5);
    }
    if (this.options.effects) {
      const reverb = _.random(2) ? 0 : 0.3*Math.random();
      await this.dymoGen.setDymoParameter(dymo, uris.REVERB, reverb);
      const delay = _.random(2) ? 0 : Math.random();
      await this.dymoGen.setDymoParameter(dymo, uris.DELAY, delay);
      //await this.dymoGen.setDymoParameter(dymo, uris.TIME_STRETCH_RATIO, Math.random());
    }
    return dymo;
  }

}

//PREVIOUS SimilarityLoop:
//new RandomConcat({materialType:SoundMaterial.Similars, repeat:3});

//PREVIOUS RandomConcat:
//new RandomConcat({materialType:SoundMaterial.Loudest});

export class RandomConcat extends Texture {

  protected async generate(): Promise<string> {
    const sequence = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const totalDuration = _.sum(this.options.objects.map(o => o.duration));
    await this.dymoGen.setDymoParameter(sequence, uris.DURATION, totalDuration);
    await Promise.all(this.options.objects.map(o =>
      this.addRandomDymo(sequence, o.audioUri)));
    return sequence;
  }

}

export class RandomOnset extends Texture {

  protected async generate(): Promise<string> {
    if (!this.options.duration) {
      this.options.duration = 4*Math.random()+2;
    }
    const sequence = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    //only approximate...
    await this.dymoGen.setDymoParameter(sequence, uris.DURATION, this.options.duration);
    await Promise.all(this.options.objects.map(o =>
      this.addRandomOnsetDymo(sequence, o.audioUri, this.options.duration)));
    return sequence;
  }

}

export abstract class CompositeTexture extends Texture {
  constructor(protected subTextures: Texture[], options: TextureOptions) {
    super(options);
  }
}

export abstract class TextureSequence extends CompositeTexture {
  protected async generate() {
    const structure = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    await mapSeries(this.subTextures, async t => {
      return this.dymoGen.getStore().addPart(structure, await t.getUri());
    });
    return structure;
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