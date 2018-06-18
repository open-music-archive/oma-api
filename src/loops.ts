import { DymoStore, DymoGenerator, forAll, uris } from 'dymo-core';

export class LoopsGenerator {

  private ONTOLOGIES_PATH = 'https://raw.githubusercontent.com/semantic-player/dymo-core/master/ontologies/';

  async generateLoop() {
    //init
    let store = new DymoStore();
    let dymoGen = new DymoGenerator(store);
    await store.loadOntologies(this.ONTOLOGIES_PATH);
    //find some cool sound objects

    //add files
    dymoGen.addDymo(undefined, 'loop.wav');
    //serialize
    let jsonld = dymoGen.getRenderingJsonld();
  }

}