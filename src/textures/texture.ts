import * as _ from 'lodash';
import { DymoGenerator, uris, forAll } from 'dymo-core';
import { DbSoundObject } from '../db-types';
import * as featureDb from '../feature-db';
import { mapSeries } from '../util';

export enum SoundMaterial {
  Random,
  Similars,
  Loudest,
  LongAndShort,
  Crackling
}

export interface Param {
  type: string,
  range?: [number, number]
}

export interface TextureOptions {
  loop?: boolean,
  repeat?: number,
  duration?: number,
  objects?: DbSoundObject[],
  soundMaterialType?: SoundMaterial,
  maxSoundMaterialSize?: number,
  prioritizeRecent?: boolean,
  regenerateSoundMaterial?: boolean,
  panning?: boolean,
  effects?: boolean,
  params?: Param[]
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
    this.dymoGen = new DymoGenerator();
    return this;
    /*this.uri = this.initSoundMaterial().then(this.generate);
    this.jsonld = this.uri.then(() =>
      this.postGenerate().then(async () =>
        this.dymoGen.getStore().uriToJsonld(await this.uri)));
    return this;*/
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
    const MAX_TRIES = 5;
    if (!this.options.objects || this.options.regenerateSoundMaterial) {
      const size = _.random(this.options.maxSoundMaterialSize || 25) + 1;
      let material: DbSoundObject[] = [];
      await mapSeries(_.range(MAX_TRIES), async t => {
        if (material.length < size && t < MAX_TRIES) {
          const fromDate = this.options.prioritizeRecent ? this.getDate(t) : undefined;
          const part = this.options.prioritizeRecent && (t < MAX_TRIES-1) ?
            _.floor((size-material.length)/2) : size-material.length;
          const newMaterial = await this.getSoundMaterial(part, fromDate);
          material = material.concat(newMaterial);
        }
      });
      this.options.objects = material;
    }
  }

  private getDate(recency: number) {
    let decrement: number;
    if (recency == 0) { decrement = 10*60*1000 } //ten minutes
    else if (recency == 1) { decrement = 60*60*1000 } //one hour
    else if (recency == 2) { decrement = 24*60*60*1000 } //one day
    else if (recency == 3) { decrement = 7*24*60*60*1000 } //one week
    else if (recency == 4) { decrement = 30*7*24*60*60*1000 } //one month
    return new Date(Date.now() - decrement);
  }

  private async getSoundMaterial(size: number, fromDate?: Date): Promise<DbSoundObject[]> {
    if (this.options.soundMaterialType == SoundMaterial.Similars) {
      const randomObject = (await featureDb.getRandomSoundObjects(1, fromDate))[0];
      return featureDb.getSimilarSoundObjects(randomObject, fromDate);
    } else if (this.options.soundMaterialType == SoundMaterial.Random) {
      return featureDb.getRandomSoundObjects(size, fromDate);
    } else if (this.options.soundMaterialType == SoundMaterial.Loudest) {
      const duration = Math.random()/2+0.125;
      return featureDb.getLoudestSoundObjectsOfDuration(duration, size, fromDate);
    } else if (this.options.soundMaterialType == SoundMaterial.Crackling) {
      const crackles = await featureDb.getCracklingSoundObjects(fromDate);
      return _.sampleSize(crackles, size);
    } else {
      const half = _.round(size/2);
      return featureDb.getLongAndShortObjects(half, half, fromDate);
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
    if (this.options.params) {
      await mapSeries(this.options.params, p => this.setRandomParam(dymo, p.type, p.range));
    }
    if (this.options.panning) {
      await this.setRandomParam(dymo, uris.AMPLITUDE);
      await this.setRandomParam(dymo, uris.PAN, [-0.5, 0.5]);
      await this.setRandomParam(dymo, uris.DISTANCE, [-0.5, 0.5]);
      await this.setRandomParam(dymo, uris.HEIGHT, [-0.5, 0.5]);
    }
    if (this.options.effects) {
      await this.setRandomParam(dymo, uris.REVERB, [0, 0.3], 0.5);
      await this.setRandomParam(dymo, uris.DELAY, [0, 0.3], 0.3);
    }
    return dymo;
  }

  protected async setRandomParam(dymoUri: string, paramUri: string,
      range: [number,number] = [0,1], probability = 1) {
    const p = Math.random() < probability;
    const value = p ? Math.random()*(range[1]-range[0])+range[0] : 0;
    return this.dymoGen.setDymoParameter(dymoUri, paramUri, value);
  }

}

//PREVIOUS SimilarityLoop:
//new RandomConcat({soundMaterialType:SoundMaterial.Similars, repeat:3});

//PREVIOUS RandomConcat:
//new RandomConcat({soundMaterialType:SoundMaterial.Loudest});

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
    await Promise.all(this.options.objects.map(async o =>
      await this.addRandomOnsetDymo(sequence, o.audioUri, this.options.duration)));
    return sequence;
  }

}

export class Changing extends Texture {

  protected async generate(): Promise<string> {
    const music = await this.dymoGen.addDymo(null, null, uris.CONJUNCTION);
    //await this.dymoGen.setDymoParameter(music, uris.LOOP, 1);
    await Promise.all(this.options.objects.map(async o => {
      const d = await this.dymoGen.addDymo(music, o.audioUri);
      await this.dymoGen.setDymoParameter(d, uris.LOOP, 1);
      //await this.dymoGen.setDymoParameter(d, uris.HEIGHT, 0.1);
      //await this.addSlider(d, "Pan", n+"", "(c-0.5)*2");
      await this.map(music, uris.BROWNIAN, d, "Amplitude", "c/4", 300);
      await this.map(music, uris.BROWNIAN, d, "Pan", "(c-0.5)/2", 300);
      await this.map(music, uris.RANDOM, d, "DurationRatio", "c+0.5", 800);
      await this.map(music, uris.BROWNIAN, d, "PlaybackRate", "c+0.5", 500);
      //await this.map(uris.RANDOM, d, "Reverb", "(c<0.2?0.1-(c-0.1):0)", 300); //"c/4", 300);
    }));
    /*const d = await this.dymoGen.addDymo(music, "assets/dymos/flo/808 Bass Lex.wav");
    await this.dymoGen.setDymoParameter(d, uris.LOOP, 1);
    await this.dymoGen.setDymoParameter(d, uris.DURATION_RATIO, Math.random()/5+0.1);
    await this.dymoGen.setDymoParameter(d, uris.AMPLITUDE, 0.5);*/
    return music;
  }

  private async map(owner: string, controlType: string, dymo: string, param: string, formula: string = "c", freq?: number) {
    await this.constrain(owner, controlType, dymo, param, "=="+formula, freq);
  }

  private async constrain(owner: string, controlType: string, dymo: string, param: string, formula: string, freq = 200, controlName?: string) {
    const control = await this.dymoGen.addControl(controlName, controlType);
    await this.dymoGen.getStore().setControlParam(control, uris.AUTO_CONTROL_FREQUENCY, freq);
    await this.dymoGen.getStore().addConstraint(owner,
      forAll("d").in(dymo).forAll("c").in(control).assert(param+"(d)"+formula));
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