import * as _ from 'lodash';
import { DymoManager, DymoGenerator, forAll, uris } from 'dymo-core';
import { RecordSide } from './types';
import { DbSoundObject } from './db-types';
import * as featureDb from './feature-db';

const ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';
//const AUDIO = 'http://www.openmusicarchive.org/playitagain/7f0988fd-9c26-4823-a9f6-5820c0b36043/2c5570ba-03c9-4b0b-9cb3-8148d802976d.wav';

let dymoGen = new DymoGenerator(new DymoManager().getStore());

export async function generateTexture(): Promise<string> {
  const longs = _.sampleSize(await featureDb.getLongestSoundObjects(50), _.random(25));
  const shorts = _.sampleSize(await featureDb.getShortestSoundObjects(50), _.random(25));
  return generateRandomLoop(longs.concat(shorts));
}

async function generateRandomLoop(objects: DbSoundObject[]): Promise<string> {
  const audioUris = objects.map(o => o.audioUri);
  const loop = await dymoGen.addDymo(null, null, uris.SEQUENCE);
  await dymoGen.setDymoParameter(loop, uris.LOOP, 1);
  const loopDuration = (4*Math.random()+2);
  await Promise.all(audioUris.map(a => addRandomOnsetDymo(loop, a, loopDuration)));
  return getJsonldAndReset();
}

async function addRandomOnsetDymo(parentUri: string, audioUri: string, maxOnset: number) {
  const dymo = await dymoGen.addDymo(parentUri, audioUri);
  const onset = maxOnset*Math.random();
  await dymoGen.setDymoParameter(dymo, uris.ONSET, maxOnset*Math.random());
  await dymoGen.setDymoParameter(dymo, uris.AMPLITUDE, Math.random());
  const reverb = _.random(2) ? 0 : 0.3*Math.random();
  await dymoGen.setDymoParameter(dymo, uris.REVERB, reverb);
  const delay = _.random(2) ? 0 : Math.random();
  await dymoGen.setDymoParameter(dymo, uris.DELAY, delay);
  //await dymoGen.setDymoParameter(dymo, uris.PAN, Math.random()*4);
  return dymo;
  //const params = await dymoGen.getStore().findAllObjects(dymo, uris.HAS_PARAMETER);
  //params.forEach(async p => console.log(await dymoGen.getStore().findObjectValue(p, uris.VALUE)))
}

function getJsonldAndReset(): Promise<string> {
  const jsonld = dymoGen.getTopDymoJsonld();
  dymoGen = new DymoGenerator(new DymoManager().getStore());
  return jsonld;
}