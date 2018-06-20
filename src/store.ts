import * as fs from 'fs';
import * as _ from 'lodash';
import * as N3 from 'n3';
import { Record } from './types';
import * as uuidv4 from 'uuid/v4';


const OMA = "http://openmusicarchive.org/vocabulary/";
const MO = "http://purl.org/ontology/mo/";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#"
const XSD = "http://www.w3.org/2001/XMLSchema#";


const TYPE = RDF+"type";
const LABEL = RDFS+"label";
const RECORDSIDE = OMA+"RecordSide";
const NAME = MO+"name";


const DUMP_PATH = 'dump.ttl';
const DUMP_PATH_2 = 'dump_2.ttl';

const n3store = N3.Store();
const n3store2 = N3.Store();

const prefixes = {  dc: 'http://purl.org/dc/elements/1.1/',
                    mo: 'http://purl.org/ontology/mo/' ,
                    owl: 'http://www.w3.org/2002/07/owl#' ,
                    oma: 'http://openmusicarchive.org/vocabulary/' ,
                    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' ,
                    rdfs: 'http://www.w3.org/2000/01/rdf-schema#' ,
                    xml: 'http://www.w3.org/XML/1998/namespace' ,
                    xsd: 'http://www.w3.org/2001/XMLSchema#' ,
                    foaf: 'http://xmlns.com/foaf/0.1/', 
                    omadb: 'http://openmusicarchive.org/database/' ,
                  }


readFromRDF(DUMP_PATH);




// guids for blank nodes, shuffle before serialising
export function addRecordSide(record: Record) {
  
  const recordside_bnode = bNode();
  n3store.addTriple(recordside_bnode, TYPE, RECORDSIDE);
  n3store.addTriple(recordside_bnode, NAME, N3.Util.createLiteral("4", XSD+"string"));


  writeToRdf(DUMP_PATH);
}

export function getRecords(): Promise<string[]> {
  return n3store.getSubjects(TYPE, RECORDSIDE);
}

function bNode(){
  return n3store.createBlankNode(guid());
}

function guid(){
  return uuidv4().replace(/\-/gi,"");
}

function readFromRDF(path: string): Promise<null> {
  return new Promise((resolve, reject) => {
    const streamParser = N3.StreamParser();
    const rdfStream = fs.createReadStream(path);
    rdfStream.pipe(streamParser);
    streamParser.on('data', triple => n3store.addTriple(triple));
    streamParser.on('end', resolve());
  });
}

export function writeToRdf(path: string) {
  const writeStream = fs.createWriteStream(path);
  const writer = N3.Writer(writeStream, { end: false, prefixes: prefixes });
  n3store.getTriples().forEach(q => writer.addTriple(q));
  writer.end();
}

