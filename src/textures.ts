import * as _ from 'lodash';
import { DymoGenerator, forAll, uris } from 'dymo-core';
import { DbSoundObject } from './db-types';
import * as featureDb from './feature-db';

export interface Texture {
  jsonld: string,
  duration: number
}

export class TextureGenerator {

  private dymoGen = new DymoGenerator();
  private latestTexture: string;

  async generateOneoffTexture(duration?: number): Promise<Texture> {
    //return generateRandomOnsetLoop(objects);
    //return generateRandomConcatLoop();
    //return generateSimilarityLoop();
    //return generateVaryingLoop();
    //this.latestTexture = this.generateSequenceOfLoops();
    this.latestTexture = await this.addRandomConcatSequence();
    //await this.addRandomOnsetSequence(await featureDb.getLongAndShortObjects(10,0), 5);
    return this.getLatestTextureObject();
  }

  async generateVariation(duration?: number): Promise<Texture> {
    if (!this.latestTexture) { //create a new texture
      return this.generateOneoffTexture(duration);
    }
    //vary the existing texture (replace one audio file)
    this.latestTexture = await this.dymoGen.addDeepCopy(this.latestTexture);
    const allDymos = await this.dymoGen.getStore().findAllObjectsInHierarchy(this.latestTexture);
    const sources = await Promise.all(allDymos.map(async d => await this.dymoGen.getStore().getSourcePath(d)));
    const dymosWithSources = allDymos.filter((_,i) => sources[i]);
    const randomDymo = _.sample(dymosWithSources);
    const audio = await this.dymoGen.getStore().getSourcePath(randomDymo);
    const similarAudio = await featureDb.getSimilarAudio(audio).catch(e => console.log(e));
    if (similarAudio) {
      await this.dymoGen.getStore().setValue(randomDymo, uris.HAS_SOURCE, similarAudio);
    }
    return this.getLatestTextureObject();
  }

  private async getLatestTextureObject() {
    const duration = await this.dymoGen.getStore()
      .findParameterValue(this.latestTexture, uris.DURATION);
    return {jsonld: await this.getJsonld(this.latestTexture), duration: duration};
  }

  private async generateSequenceOfLoops(): Promise<any> {
    const structure = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    await this.dymoGen.getStore().addPart(structure, await this.generateSimilarityLoop());
    await this.dymoGen.getStore().addPart(structure, await this.generateSimilarityLoop());
    await this.dymoGen.getStore().addPart(structure, await this.generateSimilarityLoop());
  }

  private async generateSimilarityLoop(parentUri?: string): Promise<string> {
    const objects = await featureDb.getSimilarSoundObjects((await featureDb.getRandomSoundObjects(1))[0]);
    const audioUris = objects.map(o => o.audioUri);
    const loop = await this.dymoGen.addDymo(parentUri, null, uris.SEQUENCE);
    await this.dymoGen.setDymoParameter(loop, uris.REPEAT, 3);
    await Promise.all(audioUris.map(a => this.addRandomDymo(loop, a, true, true)));
    return loop;
  }

  private async addRandomConcatLoop(): Promise<any> {
    const loop = await this.addRandomConcatSequence();
    await this.dymoGen.setDymoParameter(loop, uris.LOOP, 1);
    return loop;
  }

  private async addRandomOnsetLoop(objects?: DbSoundObject[], duration?: number): Promise<string> {
    const loop = await this.addRandomOnsetSequence(objects, duration);
    await this.dymoGen.setDymoParameter(loop, uris.LOOP, 1);
    return loop;
  }

  private async addRhythmicalSequence(duration?: number): Promise<any> {

  }

  private async addRandomConcatSequence(): Promise<any> {
    const concat = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    let objects = await featureDb.getLoudestSoundObjectsOfDuration(Math.random()/2+0.125, _.random(25));
    let totalDuration = _.sum(objects.map(o => o.duration));
    await this.dymoGen.setDymoParameter(concat, uris.DURATION, totalDuration);
    const audioUris = objects.map(o => o.audioUri);
    await Promise.all(audioUris.map(a => this.addRandomDymo(concat, a, true, true)));
  }

  private async addRandomOnsetSequence(objects?: DbSoundObject[], duration?: number): Promise<string> {
    objects = objects ? objects : await featureDb.getLongAndShortObjects(_.random(25), _.random(25));
    const audioUris = objects.map(o => o.audioUri);
    const sequence = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    const loopDuration = duration ? duration : 4*Math.random()+2;
    await Promise.all(audioUris.map(a => this.addRandomOnsetDymo(sequence, a, loopDuration)));
    return sequence;
  }

  //// DYMO GENERATING FUNTIONS

  private async addRandomOnsetDymo(parentUri: string, audioUri: string, maxOnset: number) {
    const dymo = await this.addRandomDymo(parentUri, audioUri, true, true);
    const onset = maxOnset*Math.random();
    await this.dymoGen.setDymoParameter(dymo, uris.ONSET, onset);
    return dymo;
  }

  private async addRandomDymo(parentUri: string, audioUri: string, panning: boolean, effects: boolean) {
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
    }
    return dymo;
  }

  private getJsonldAndReset(): Promise<string> {
    const jsonld = this.getJsonld();
    this.dymoGen = new DymoGenerator();
    return jsonld;
  }

  private getJsonld(dymoUri?: string): Promise<string> {
    if (dymoUri) {
      return this.dymoGen.getStore().uriToJsonld(dymoUri);
    }
    return this.dymoGen.getTopDymoJsonld();
  }

}