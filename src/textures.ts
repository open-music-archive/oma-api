import * as _ from 'lodash';
import { DymoManager, DymoGenerator, forAll, uris } from 'dymo-core';
import { RecordSide } from './types';
import { DbSoundObject } from './db-types';
import * as featureDb from './feature-db';

const ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';
//const AUDIO = 'http://www.openmusicarchive.org/playitagain/7f0988fd-9c26-4823-a9f6-5820c0b36043/2c5570ba-03c9-4b0b-9cb3-8148d802976d.wav';

let dymoGen = new DymoGenerator(new DymoManager().getStore());

export async function generateTexture(): Promise<string> {
  const objects = Math.random() > 0.5 ?
    _.sampleSize(await featureDb.getLongestSoundObjects(20), 5) :
    _.sampleSize(await featureDb.getShortestSoundObjects(40), 10);
  return generateRandomLoop(objects);
}

async function generateRandomLoop(objects: DbSoundObject[]): Promise<string> {
  const audioUris = objects.map(o => o.audioUri);
  const loop = await dymoGen.addDymo();
  await dymoGen.setDymoParameter(loop, uris.LOOP, 1);
  audioUris.forEach(a => addRandomOnsetDymo(loop, a, 4));
  return getJsonldAndReset();
}

async function addRandomOnsetDymo(parentUri: string, audioUri: string, maxOnset: number) {
  const dymo = await dymoGen.addDymo(parentUri, audioUri);
  await dymoGen.setDymoParameter(dymo, uris.ONSET, maxOnset*Math.random());
  await dymoGen.setDymoParameter(dymo, uris.REVERB, Math.random());
  await dymoGen.setDymoParameter(dymo, uris.DELAY, Math.random());
  await dymoGen.setDymoParameter(dymo, uris.PAN, Math.random());
}

function getJsonldAndReset(): Promise<string> {
  const jsonld = dymoGen.getTopDymoJsonld();
  dymoGen = new DymoGenerator(new DymoManager().getStore());
  return jsonld;
}