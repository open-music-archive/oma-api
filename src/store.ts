import * as fs from 'fs';
import * as _ from 'lodash';
import * as N3 from 'n3';
import { Record, Fragment } from './types';
import * as uuidv4 from 'uuid/v4';


const OMA = "http://openmusicarchive.org/vocabulary/";
const MO = "http://purl.org/ontology/mo/";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#"
const XSD = "http://www.w3.org/2001/XMLSchema#";
const OMAD = "http://openmusicarchive.org/data/";
const TL = "http://purl.org/NET/c4dm/timeline.owl#";
const AFX = "https://w3id.org/aufx/ontology/2.0/";

const TYPE = RDF+"type";
const LABEL = RDFS+"label";
const NAME = MO+"name";

const DUMP_PATH = 'dump.ttl';
const DUMP_PATH_2 = 'dump_2.ttl';

const n3store = N3.Store();
const n3store2 = N3.Store();

const prefixes = {  dc: 'http://purl.org/dc/elements/1.1/',
                    mo: 'http://purl.org/ontology/mo/' ,
                    tl: 'http://purl.org/NET/c4dm/timeline.owl#' ,
                    owl: 'http://www.w3.org/2002/07/owl#' ,
                    oma: 'http://openmusicarchive.org/vocabulary/' ,
                    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' ,
                    rdfs: 'http://www.w3.org/2000/01/rdf-schema#' ,
                    xml: 'http://www.w3.org/XML/1998/namespace' ,
                    xsd: 'http://www.w3.org/2001/XMLSchema#' ,
                    foaf: 'http://xmlns.com/foaf/0.1/', 
                    omad: 'http://openmusicarchive.org/data/',
                    afx: 'https://w3id.org/aufx/ontology/2.0/' 
                  }


//readFromRDF(DUMP_PATH);

// guids for blank nodes, shuffle before serialising
export function addRecordSide(record: Record) {
  

  const recordSide_uri = OMAD+guid();
  n3store.addTriple(recordSide_uri, TYPE, OMA+"RecordSide");
  n3store.addTriple(recordSide_uri, NAME, literal("A", "string"));

  const recordPlayback_uri = OMAD+guid();
  n3store.addTriple(recordPlayback_uri, TYPE, OMA+"RecordPlayback");
  n3store.addTriple(recordPlayback_uri, OMA+"record_side_played", recordSide_uri);

  const signal_1_uri = OMAD+guid();
  n3store.addTriple(signal_1_uri, TYPE, MO+"Signal");
  n3store.addTriple(recordPlayback_uri, MO+"recorded_as", signal_1_uri);

  const transform_bnode = bNode();
  n3store.addTriple(transform_bnode, TYPE, AFX+"Transform");
  n3store.addTriple(transform_bnode, AFX+"input_signal", signal_1_uri);

  const signal_2_bnode = bNode();
  n3store.addTriple(signal_2_bnode, TYPE, MO+"Signal");
  n3store.addTriple(transform_bnode, AFX+"output_signal", signal_2_bnode);

  const interval_1_bnode = bNode();
  n3store.addTriple(interval_1_bnode, TYPE, TL+"Interval");
  n3store.addTriple(signal_2_bnode, MO+"time", interval_1_bnode);

  const timeline_bnode = bNode();
  n3store.addTriple(interval_1_bnode, TYPE, TL+"Interval");
  n3store.addTriple(interval_1_bnode, TL+"timeline", timeline_bnode);

  n3store2.addTriple("audio_no_eq.wav", MO+"encodes", signal_1_uri); // hidden graph

  // sound object
  var interval_2_uri;
  var soundObjectSignal_uri;

  for (let item of exampleFragments()) {
    interval_2_uri = OMAD+guid();
    n3store.addTriple(interval_2_uri, TYPE, TL+"Interval");
    n3store.addTriple(interval_2_uri, TL+"timeline", timeline_bnode);
    n3store.addTriple(interval_2_uri, TL+"duration", literal(`PT${item.duration}S`, "duration"));
    soundObjectSignal_uri = OMAD+guid();
    n3store.addTriple(soundObjectSignal_uri, TYPE, OMA+"SoundObjectSignal");
    n3store.addTriple(soundObjectSignal_uri, MO+"time", interval_2_uri);
    n3store.addTriple(soundObjectSignal_uri, OMA+"feature_document_guid", literal(item.feature_guid, "string"));
    n3store.addTriple(item.fileUri, MO+"encodes", soundObjectSignal_uri);
    n3store.addTriple(soundObjectSignal_uri, OMA+"record_side", recordSide_uri);

    n3store2.addTriple(interval_2_uri, TL+"beginsAtDuration", literal(`PT${item.time}S`, "duration")); // hidden graph

  addClustering(null)
  

  }
  writeToRdf(DUMP_PATH, n3store);
  writeToRdf(DUMP_PATH_2, n3store2);
}

export function exampleFragments() {
  let f1 = {  time: 12.3,
              duration: 0.1,
              fileUri: "so1.wav",
              feature_guid: "feature_doc_guid_001"
            };
  let f2 = {  time: 22.5,
              duration: 0.12,
              fileUri: "so2.wav",
              feature_guid: "feature_doc_guid_002" };
  let f3 = {  time: 32.3,
              duration: 0.25,
              fileUri: "so3.wav",
              feature_guid: "feature_doc_guid_003" };
  return [f1, f2, f3]

}


export function addClustering(clustering){
  // get all instances of SoundObjectSignal
  // make clustering
  // query for Clustering with :used_feature as in featureTypes
  // delete Clustering and Cluster instances

  clustering = {  features: ["MFCC", "Chroma"],
                  clusters: [{  signals: ["A0", "A1", "A2"],
                                name: "cluster1" },
                             {  signals: ["A0", "A1", "A2"],
                                name: "cluster1" }]

  }

  // this is not yet working
  const clustering_bnode = bNode();
  n3store.addTriple(clustering_bnode, TYPE, OMA+"Clustering");

  for (let item of clustering.features) { 
    n3store.addTriple(clustering_bnode, OMA+"used_feature", OMA+item);
  }

  for (let cluster of clustering.clusters) {
    const cluster_bnode = bNode();
    n3store.addTriple(cluster_bnode, TYPE, OMA+"Cluster");

    for (let signal of cluster.signals) {
      n3store.addTriple(cluster_bnode, OMA+"has_signal", OMAD+signal);
    }

  }



}

export function getRecords(): Promise<string[]> {
  return n3store.getSubjects(TYPE, OMA+"RecordSide");
}

function bNode(){
  return n3store.createBlankNode(guid());
}

function literal(s, t){
  return N3.Util.createLiteral(s, XSD+t)
}

function guid(){
  let g = uuidv4();
  while (!g.charAt(0).match(/[a-z]/i)){
    g = uuidv4();
  }
  return g.replace(/\-/gi,"");
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

export function writeToRdf(path: string, store) {
  const writeStream = fs.createWriteStream(path);
  const writer = N3.Writer(writeStream, { end: false, prefixes: prefixes });
  store.getTriples().forEach(q => writer.addTriple(q));
  writer.end();
}

