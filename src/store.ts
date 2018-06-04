import * as fs from 'fs';
import * as _ from 'lodash';
import * as N3 from 'n3';

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const TYPE = RDF+"type";
const LABEL = "http://www.w3.org/2000/01/rdf-schema#label";

const MO = "http://purl.org/ontology/mo/";
const RECORD = MO+"Record";
const NAME = MO+"name";

const OMA = "http://example.com/oma/vocabulary/";

const store = N3.Store();
readFromRDF('dump.ttl');


export function addRecord(name: string, segmentTimes: number[]) {
  const id = store.createBlankNode();
  store.addTriple(id, TYPE, RECORD);
  store.addTriple(id, NAME, name);
}

export function getRecords(): Promise<string[]> {
  return store.getSubjects(TYPE, RECORD);
}

function readFromRDF(path: string): Promise<null> {
  return new Promise((resolve, reject) => {
    const streamParser = N3.StreamParser();
    const rdfStream = fs.createReadStream(path);
    rdfStream.pipe(streamParser);
    streamParser.on('data', triple => store.addTriple(triple));
    streamParser.on('end', resolve());
  });
}

export function writeToRdf(path: string) {
  const writeStream = fs.createWriteStream(path);
  const writer = N3.Writer(writeStream, { end: false, prefixes: { } });
  store.getTriples().forEach(q => writer.addTriple(q));
  writer.end();
}

