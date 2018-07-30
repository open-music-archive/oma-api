import * as _ from 'lodash';
import { DymoGenerator, forAll, uris } from 'dymo-core';
import { RecordSide } from './types';
import { DbSoundObject } from './db-types';
import * as featureDb from './feature-db';

export interface Texture {
  jsonld: string,
  duration: number
}

const ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';

export class TextureGenerator {

  private dymoGen = new DymoGenerator();
  private variedTexture;

  async generateOneoffTexture(): Promise<string> {
    //return generateRandomOnsetLoop(objects);
    //return generateRandomConcatLoop();
    //return generateSimilarityLoop();
    //return generateVaryingLoop();
    this.generateSequenceOfLoops();
    return this.getJsonldAndReset();
  }

  async initVaryingTexture(): Promise<any> {
    this.variedTexture = this.addRandomOnsetSequence(await featureDb.getLongAndShortObjects(3,3), 5);
  }

  async generateVariation(): Promise<string> {
    if (!this.variedTexture) { //create a new texture
      this.initVaryingTexture();
    } else { //vary the existing texture
      //now just assuming all parts have sources...
      const dymosWithSources = await this.dymoGen.getStore().findParts(this.variedTexture);//.findSubjects(uris.HAS_SOURCE, null);
      const randomDymo = _.sample(dymosWithSources);
      const audio = await this.dymoGen.getStore().getSourcePath(randomDymo);
      const similarAudio = await featureDb.getSimilarAudio(audio);
      await this.dymoGen.getStore().setValue(randomDymo, uris.HAS_SOURCE, similarAudio);
    }
    return this.getJsonld();
  }

  private async generateSequenceOfLoops(): Promise<any> {
    const structure = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    await this.dymoGen.getStore().addPart(structure, await this.generateSimilarityLoop());
    await this.dymoGen.getStore().addPart(structure, await this.generateSimilarityLoop());
    await this.dymoGen.getStore().addPart(structure, await this.generateSimilarityLoop());
  }

  private async generateSimilarityLoop(parentUri?: string): Promise<string> {
    const objects = await featureDb.getSimilarSoundObjects(await featureDb.getRandomSoundObject());
    const audioUris = objects.map(o => o.audioUri);
    const loop = await this.dymoGen.addDymo(parentUri, null, uris.SEQUENCE);
    await this.dymoGen.setDymoParameter(loop, uris.REPEAT, 3);
    await Promise.all(audioUris.map(a => this.addRandomDymo(loop, a, true, true)));
    return loop;
  }

  private async addRandomConcatLoop(): Promise<any> {
    const objects = await featureDb.getLoudestSoundObjectsOfDuration(Math.random()/2+0.125, _.random(25));
    const audioUris = objects.map(o => o.audioUri);
    const loop = await this.dymoGen.addDymo(null, null, uris.SEQUENCE);
    await this.dymoGen.setDymoParameter(loop, uris.LOOP, 1);
    await Promise.all(audioUris.map(a => this.addRandomDymo(loop, a, true, true)));
  }

  private async addRandomOnsetLoop(objects?: DbSoundObject[], duration?: number): Promise<string> {
    const loop = await this.addRandomOnsetSequence(objects, duration);
    await this.dymoGen.setDymoParameter(loop, uris.LOOP, 1);
    return loop;
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

  private getJsonld(): Promise<string> {
    return this.dymoGen.getTopDymoJsonld();
  }

}