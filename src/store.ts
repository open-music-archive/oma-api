import * as fs from 'fs';
import * as _ from 'lodash';
import * as N3 from 'n3';
import { RecordSide, Fragment, Clustering } from './types';
import * as uuidv4 from 'uuid/v4';


const OMA = "http://openmusicarchive.org/vocabulary/";
const MO = "http://purl.org/ontology/mo/";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#"
const XSD = "http://www.w3.org/2001/XMLSchema#";
const OMAD = "http://openmusicarchive.org/data/";
const TL = "http://purl.org/NET/c4dm/timeline.owl#";
const AFX = "https://w3id.org/aufx/ontology/2.0/";
const FOAF = 'http://xmlns.com/foaf/0.1/';

const TYPE = RDF+"type";
const LABEL = RDFS+"label";
//const NAME = MO+"name";

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




export function poop(){
  return null;

  
  
}



// guids for blank nodes, shuffle before serialising
export function addRecordSide(recordSide: RecordSide) {
  /*
  RecordSide {
  title: string,
  composer: string,
  artist: string,
  catNo: string,
  label: string,
  side: string,
  soundObjects: Fragment[]}
  */

  readFromRDF(DUMP_PATH);

  
  return 0;



  const recordSideUri = OMAD+guid();

  n3store.addTriple(recordSideUri, TYPE, OMA+"RecordSide");
  n3store.addTriple(recordSideUri, LABEL, literal(recordSide.side, "string"));

  const artistUri = OMAD+guid();
  n3store.addTriple(artistUri, TYPE, MO+"MusicArtist");
  n3store.addTriple(recordSideUri, OMA+"artist", artistUri);
  n3store.addTriple(artistUri, FOAF+"name", literal(recordSide.artist, "string"));

  const itemUri = OMAD+guid();
  n3store.addTriple(itemUri, TYPE, OMA+"RecordItem");
  n3store.addTriple(recordSideUri, OMA+"side_of", itemUri);

  const releaseUri = OMAD+guid();
  n3store.addTriple(releaseUri, TYPE, MO+"Release");
  n3store.addTriple(releaseUri, MO+"item", itemUri);

  n3store.addTriple(releaseUri, OMA+"catalogue_number", literal(recordSide.catNo, "string"));

  


  const labelUri = OMAD+guid();
  n3store.addTriple(labelUri, TYPE, MO+"Label");
  n3store.addTriple(releaseUri, MO+"record_label", labelUri);
  n3store.addTriple(labelUri, LABEL, literal(recordSide.label, "string"));


  var label;
  var t1 = n3store.getTriples(null, MO+"record_label", null)[0];
  if (t1){
    var t2 = n3store.getTriples(t1.object, LABEL, null)[0];
    label = t2.object;
  }
  console.log(label);



  const recordPlaybackUri = OMAD+guid();
  n3store.addTriple(recordPlaybackUri, TYPE, OMA+"RecordPlayback");
  n3store.addTriple(recordPlaybackUri, OMA+"record_side_played", recordSideUri);

  const signal1Uri = OMAD+guid();
  n3store.addTriple(signal1Uri, TYPE, MO+"Signal");
  n3store.addTriple(recordPlaybackUri, MO+"recorded_as", signal1Uri);

  const transformBnode = bnode();
  n3store.addTriple(transformBnode, TYPE, AFX+"Transform");
  n3store.addTriple(transformBnode, AFX+"input_signal", signal1Uri);
  n3store.addTriple(transformBnode, OMA+"equalization_curve", OMA+"RIAA");

  const signal2Bnode = bnode();
  n3store.addTriple(signal2Bnode, TYPE, MO+"Signal");
  n3store.addTriple(transformBnode, AFX+"output_signal", signal2Bnode);

  const interval1Bnode = bnode();
  n3store.addTriple(interval1Bnode, TYPE, TL+"Interval");
  n3store.addTriple(signal2Bnode, MO+"time", interval1Bnode);

  const timelineBnode = bnode();
  n3store.addTriple(interval1Bnode, TYPE, TL+"Interval");
  n3store.addTriple(interval1Bnode, TL+"timeline", timelineBnode);

  n3store2.addTriple("audio_no_eq.wav", MO+"encodes", signal1Uri); // hidden graph

  // sound object
  var interval2Uri;
  var soundObjectSignalUri;

  for (let item of exampleFragments()) {
    interval2Uri = OMAD+guid();
    n3store.addTriple(interval2Uri, TYPE, TL+"Interval");
    n3store.addTriple(interval2Uri, TL+"timeline", timelineBnode);
    n3store.addTriple(interval2Uri, TL+"duration", literal(`PT${item.duration}S`, "duration"));
    soundObjectSignalUri = OMAD+guid();
    n3store.addTriple(soundObjectSignalUri, TYPE, OMA+"SoundObjectSignal");
    n3store.addTriple(soundObjectSignalUri, MO+"time", interval2Uri);
    n3store.addTriple(soundObjectSignalUri, OMA+"feature_document_guid", literal(item.featureGuid, "string"));
    n3store.addTriple(item.fileUri, MO+"encodes", soundObjectSignalUri);
    n3store.addTriple(soundObjectSignalUri, OMA+"record_side", recordSideUri);

    n3store2.addTriple(interval2Uri, TL+"beginsAtDuration", literal(`PT${item.time}S`, "duration")); // hidden graph
  
    
  }

  addClustering(null)

  var label;
  var t1 = n3store.getTriples(null, MO+"record_label", null)[0];
  if (t1){
    var t2 = n3store.getTriples(t1.object, LABEL, null)[0];
    label = t2.object;
  }
  


  writeToRdf(DUMP_PATH, n3store);
  writeToRdf(DUMP_PATH_2, n3store2);
}

export function exampleFragments() {
  let f1 = {  time: 12.3,
              duration: 0.1,
              fileUri: "so1.wav",
              featureGuid: "feature_doc_guid_001"
            };
  let f2 = {  time: 22.5,
              duration: 0.12,
              fileUri: "so2.wav",
              featureGuid: "feature_doc_guid_002" };
  let f3 = {  time: 32.3,
              duration: 0.25,
              fileUri: "so3.wav",
              featureGuid: "feature_doc_guid_003" };
  return [f1, f2, f3]
}


function addClustering(clustering){


  clustering = {  features: ["MFCC", "Chroma"],
                  clusters: [{  signals: ["A0", "A1", "A2"],
                                name: "cluster1" },
                             {  signals: ["B0", "B1", "B2"],
                                name: "cluster2" }]

  }

  const clusteringBnode = bnode();

  n3store.addTriple(clusteringBnode, TYPE, OMA+"Clustering");

  for (let item of clustering.features) { 
    n3store.addTriple(clusteringBnode, OMA+"used_feature", OMA+item);
  }

  for (let cluster of clustering.clusters) {
    const clusterBnode = bnode();
    n3store.addTriple(clusterBnode, TYPE, OMA+"Cluster");
    n3store.addTriple(clusterBnode, LABEL, literal(cluster.name, "string"));

    n3store.addTriple(clusteringBnode, OMA+"has_cluster", clusterBnode);

    for (let signal of cluster.signals) {
      n3store.addTriple(clusterBnode, OMA+"has_signal", OMAD+signal);
    }
  }
}

export function getRecords(): Promise<string[]> {
  return n3store.getSubjects(TYPE, OMA+"RecordSide");
}

function bnode(){
  return n3store.createBlankNode(guid());
}

function literal(s, t){
  return N3.Util.createLiteral(s, XSD+t)
}

function guid(){
  let g = uuidv4();
  return g.replace(/\-/gi,"").replace(g.charAt(0), String.fromCharCode(97+Math.floor(Math.random() * 6)));
}

function readFromRDF(path: string): Promise<null> {
  return new Promise((resolve, reject) => {
    const streamParser = N3.StreamParser();
    const rdfStream = fs.createReadStream(path);
    rdfStream.pipe(streamParser);
    streamParser.on('data', triple => n3store.addTriple(triple));
    streamParser.on('data', triple => console.log(triple));
    streamParser.on('end', resolve());
  });
}

export function writeToRdf(path: string, store) {
  const writeStream = fs.createWriteStream(path);
  const writer = N3.Writer(writeStream, { end: false, prefixes: prefixes });
  store.getTriples().forEach(q => writer.addTriple(q));
  writer.end();
}

