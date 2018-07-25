import * as _ from 'lodash';
import { DymoGenerator, forAll, uris } from 'dymo-core';
import { RecordSide } from './types';
import { DbSoundObject } from './db-types';
import * as featureDb from './feature-db';

const ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';

let dymoGen = new DymoGenerator();

export async function generateTexture(): Promise<string> {
  const objects = await featureDb.getLongAndShortObjects(_.random(25), _.random(25));
  return generateRandomConcatLoop(objects);
}

async function generateRandomConcatLoop(objects: DbSoundObject[]): Promise<string> {
  const audioUris = objects.map(o => o.audioUri);
  const loop = await dymoGen.addDymo(null, null, uris.SEQUENCE);
  await dymoGen.setDymoParameter(loop, uris.LOOP, 1);
  await Promise.all(audioUris.map(a => addRandomDymo(loop, a, false, false)));
  return getJsonldAndReset();
}

async function generateRandomOnsetLoop(objects: DbSoundObject[]): Promise<string> {
  const audioUris = objects.map(o => o.audioUri);
  const loop = await dymoGen.addDymo(null, null, uris.SEQUENCE);
  await dymoGen.setDymoParameter(loop, uris.LOOP, 1);
  const loopDuration = (4*Math.random()+2);
  await Promise.all(audioUris.map(a => addRandomOnsetDymo(loop, a, loopDuration)));
  return getJsonldAndReset();
}

async function addRandomOnsetDymo(parentUri: string, audioUri: string, maxOnset: number) {
  const dymo = await addRandomDymo(parentUri, audioUri, true, true);
  const onset = maxOnset*Math.random();
  await dymoGen.setDymoParameter(dymo, uris.ONSET, maxOnset*Math.random());
  return dymo;
}

async function addRandomDymo(parentUri: string, audioUri: string, panning: boolean, effects: boolean) {
  const dymo = await dymoGen.addDymo(parentUri, audioUri);
  if (panning) {
    await dymoGen.setDymoParameter(dymo, uris.AMPLITUDE, Math.random());
    await dymoGen.setDymoParameter(dymo, uris.PAN, Math.random()-0.5);
    await dymoGen.setDymoParameter(dymo, uris.DISTANCE, Math.random()-0.5);
    await dymoGen.setDymoParameter(dymo, uris.HEIGHT, Math.random()-0.5);
  }
  if (effects) {
    const reverb = _.random(2) ? 0 : 0.3*Math.random();
    await dymoGen.setDymoParameter(dymo, uris.REVERB, reverb);
    const delay = _.random(2) ? 0 : Math.random();
    await dymoGen.setDymoParameter(dymo, uris.DELAY, delay);
  }
  return dymo;
}

function getJsonldAndReset(): Promise<string> {
  const jsonld = dymoGen.getTopDymoJsonld();
  dymoGen = new DymoGenerator();
  return jsonld;
}