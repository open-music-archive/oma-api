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

const DUMP_PATH = 'dump.ttl';
const DUMP_PATH_2 = 'dump_2.ttl';

const n3store = N3.Store();
const n3store2 = N3.Store();

const prefixes = {  dc: 'http://purl.org/dc/elements/1.1/',
                    owl: 'http://www.w3.org/2002/07/owl#' ,
                    xml: 'http://www.w3.org/XML/1998/namespace' ,
                    mo: MO ,
                    tl: TL ,
                    oma: OMA ,
                    rdf: RDF ,
                    rdfs: RDFS ,
                    xsd: XSD ,
                    foaf: FOAF, 
                    omad: OMAD,
                    afx: AFX 
                  }

const ready = Promise.all([readFromRDF(DUMP_PATH, n3store), readFromRDF(DUMP_PATH_2, n3store2)]);


function checkExisting(cType, lString, predicate){
  // check if entity exists, e.g. for record label:
  // cType = MO+"Label"
  // lString = recordSide.label
  // predicate = LABEL

  let flag = 0;
  let guri = OMAD+guid();
  var t1 = n3store.getSubjects(null, TYPE, cType) // not working!
  if (t1){
    t1.forEach(function(t) {
      let t2 = n3store.getObjects(t, predicate, null)[0];
      if (t2 == literal(lString, "string")){
        guri = t;
        flag = 1;
        return;
      }
    });

  if (flag == 0){
    n3store.addTriple(guri, TYPE, cType);
    n3store.addTriple(guri, predicate, literal(lString, "string"));
  }


  
}}
                  
// guids for blank nodes, shuffle before serialising
export async function addRecordSide(recordSide: RecordSide) {
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

  await ready;
  console.log(n3store.size);
  console.log(n3store2.size);


  checkExisting(MO+"Label", recordSide.label, LABEL)

  return;
  
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

  // check if record label with rdfs:label already exists

  checkExisting(MO+"Label", recordSide.label, LABEL)

  let labelFlag = 0;
  let recordLabelUri = OMAD+guid();
  var t1 = n3store.getObjects(null, MO+"record_label", null);
  //var t1 = n3store.getSubjects(null, TYPE, MO+"Label");
  if (t1){
    t1.forEach(function(t) {
      t2 = n3store.getObjects(t, LABEL, null)[0];
      if (t2 == literal(recordSide.label, "string")){
        recordLabelUri = t;
        labelFlag = 1;
        return;
      }
    });
  };
  if (labelFlag == 0){
    n3store.addTriple(recordLabelUri, TYPE, MO+"Label");
    n3store.addTriple(recordLabelUri, LABEL, literal(recordSide.label, "string"));
  }

  //console.log(recordLabelUri);
  n3store.addTriple(releaseUri, MO+"record_label", recordLabelUri);


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
                  clusters: [{  signalsAdd: ["A0", "A1", "A2"],
                                name: "cluster1" },
                             {  signalsAdd: ["B0", "B1", "B2"],
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

    for (let signal of cluster.signalsAdd) {
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

function readFromRDF(path: string, store): Promise<null> {
  return new Promise((resolve, reject) => {
    const streamParser = N3.StreamParser();
    const rdfStream = fs.createReadStream(path);
    rdfStream.pipe(streamParser);
    streamParser.on('data', triple => { store.addTriple(triple); });
    streamParser.on('end', resolve);
  });
}

export function writeToRdf(path: string, store) {
  const writeStream = fs.createWriteStream(path);
  const writer = N3.Writer(writeStream, { end: false, prefixes: prefixes });
  store.getTriples().forEach(q => writer.addTriple(q));
  writer.end();
}

