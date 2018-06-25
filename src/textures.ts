import { DymoManager, DymoGenerator, forAll, uris } from 'dymo-core';
import { RecordSide } from './types';

const ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';

export async function generateLoop(): Promise<string> {
  //console.log(record.soundObjects[0]);
  const manager = new DymoManager();
  const dymoGen = new DymoGenerator(manager.getStore());
  //TODO: find some cool sound objects
  const audio = 'http://www.openmusicarchive.org/playitagain/7f0988fd-9c26-4823-a9f6-5820c0b36043/2c5570ba-03c9-4b0b-9cb3-8148d802976d.wav';
  //add files
  await dymoGen.addDymo(undefined, audio);
  //serialize
  return dymoGen.getTopDymoJsonld();
  //console.log(jsonld);
}