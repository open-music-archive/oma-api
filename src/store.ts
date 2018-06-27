import * as fs from 'fs';
import * as _ from 'lodash';
import * as N3 from 'n3';
import { RecordSide, SoundObject, Clustering } from './types';
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
const EVENT = 'http://purl.org/NET/c4dm/event.owl#';

const TYPE = RDF+"type";
const LABEL = RDFS+"label";

const DUMP_PATH = 'dump.ttl';
const DUMP_PATH_2 = 'dump_2.ttl';

const n3store = N3.Store();
const n3store2 = N3.Store();

const prefixes = {  dc: 'http://purl.org/dc/elements/1.1/',
                    owl: 'http://www.w3.org/2002/07/owl#' ,
                    xml: 'http://www.w3.org/XML/1998/namespace' ,
                    event: EVENT,
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


function getString(s){
  return (/"(.*?)"/g).exec(s)[1] 
}

function checkExistingSide(recordSide: RecordSide){
  //assumes only one item per release can exist
  let flag = 0;
  const releases = n3store.getSubjects(TYPE, MO+"Release");
  releases.forEach(r => {
    const cat = n3store.getObjects(r, OMA+"catalogue_number")[0];
    if (getString(cat) == recordSide.catNo) {
      const item = n3store.getObjects(r, MO+"item")[0];
      const side = n3store.getObjects(item, OMA+"side_of_record_item")[0];
      const title = n3store.getObjects(side, OMA+"record_side_title")[0];
      const artist = n3store.getObjects(side, OMA+"artist")[0];
      const artistName = n3store.getObjects(artist, FOAF+"name")[0];

      if (getString(artistName) == recordSide.artist && getString(title) == recordSide.title) {
        skipRecording();
        return;
      }
    }
  })
  }
         
function skipRecording(){
  console.log("side/release already exists.");
}
  
function checkExisting(cType, predicate, lString){
  // check if entity exists, e.g. for record label:
  // cType = MO+"Label"
  // lString = recordSide.label
  // predicate = LABEL

  let flag = 0;
  let guri = OMAD+guid();
  var s = n3store.getSubjects(TYPE, cType);
    s.forEach(i => {
      let o = n3store.getObjects(i, predicate)[0];
      if (o == literal(lString, "string")){
        guri = i;
        flag = 1;
        return;
      }
    });
  if (flag == 0){
    n3store.addTriple(guri, TYPE, cType);
    n3store.addTriple(guri, predicate, literal(lString, "string"));
  }
  //console.log(guri);
  return [guri, flag]
  
}

export async function addRecordSide(recordSide: RecordSide) {
  /*
  RecordSide {
  title: string,
  composer: string,
  artist: string,
  catNo: string,
  label: string,
  side: string,
  soundObjects: SoundObject[]}
  */

  await ready;
  
  console.log(n3store.getTriples())

  console.log(n3store.size);
  console.log(n3store2.size);
  //writeStores();
  //return;

  checkExistingSide(recordSide);

  const releaseUriCheck = checkExisting(MO+"Release", OMA+"catalogue_number", recordSide.catNo);
  const releaseUri = releaseUriCheck[0];//checkRelease[0]
  const recordSideUri = OMAD+guid();

  n3store.addTriple(recordSideUri, TYPE, OMA+"RecordSide");
  n3store.addTriple(recordSideUri, LABEL, literal(recordSide.side, "string"));

  const artistUri = checkExisting(MO+"MusicArtist", FOAF+"name", recordSide.artist)[0];
  
  n3store.addTriple(recordSideUri, OMA+"artist", artistUri);
  n3store.addTriple(recordSideUri, OMA+"record_side_title", literal(recordSide.title, "string"));


  let itemUri;
  if (releaseUriCheck[1] == 0){
    itemUri = OMAD+guid();
  }
  else {
    itemUri = n3store.getObjects(releaseUri, MO+"item");
  }
  
  n3store.addTriple(itemUri, TYPE, OMA+"RecordItem");
  n3store.addTriple(recordSideUri, OMA+"side_of_record_item", itemUri);

  n3store.addTriple(releaseUri, MO+"item", itemUri);  

  const recordLabelUri = checkExisting(MO+"Label", LABEL, recordSide.label)[0];
  n3store.addTriple(releaseUri, MO+"record_label", recordLabelUri);

  const recordPlaybackUri = OMAD+guid();
  n3store.addTriple(recordPlaybackUri, TYPE, OMA+"RecordPlayback");
  n3store.addTriple(recordPlaybackUri, OMA+"record_side_played", recordSideUri);

  const timeBnode = bnode();
  n3store.addTriple(recordPlaybackUri, EVENT+"time", timeBnode);
  n3store.addTriple(timeBnode, TL+"atDateTime", literal(recordSide.time, "dateTime"));

  const signal1Uri = OMAD+guid();
  n3store.addTriple(signal1Uri, TYPE, MO+"Signal");
  n3store.addTriple(recordPlaybackUri, MO+"recorded_as", signal1Uri);

  const transformBnode = bnode();
  n3store.addTriple(transformBnode, TYPE, AFX+"Transform");
  n3store.addTriple(transformBnode, AFX+"input_signal", signal1Uri);
  n3store.addTriple(transformBnode, OMA+"equalization_curve", OMA+recordSide.eq);

  const signal2Bnode = bnode();
  n3store.addTriple(signal2Bnode, TYPE, MO+"Signal");
  n3store.addTriple(transformBnode, AFX+"output_signal", signal2Bnode);

  const interval1Bnode = bnode();
  n3store.addTriple(interval1Bnode, TYPE, TL+"Interval");
  n3store.addTriple(signal2Bnode, MO+"time", interval1Bnode);

  const timelineBnode = bnode();
  n3store.addTriple(interval1Bnode, TYPE, TL+"Interval");
  n3store.addTriple(interval1Bnode, TL+"timeline", timelineBnode);

  n3store2.addTriple("http://openmusicarchive.org/audio/noeq/"+recordSide.noEqAudioFile, MO+"encodes", signal1Uri); // hidden graph

  // sound object
  var interval2Uri;
  var soundObjectSignalUri;

  for (let item of exampleSoundObjects()) {
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
  writeStores();
}

function writeStores(){
  writeToRdf(DUMP_PATH, n3store);
  writeToRdf(DUMP_PATH_2, n3store2);
}

export function exampleSoundObjects() {
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

function arraysEqual(_arr1, _arr2) {
  if (!Array.isArray(_arr1) || ! Array.isArray(_arr2) || _arr1.length !== _arr2.length)
    return false;
  var arr1 = _arr1.concat().sort();
  var arr2 = _arr2.concat().sort();
  for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i])
          return false;
  }
  return true;
}

function removeClustering(clustering){
  n3store.getObjects(clustering, OMA+"has_cluster").forEach(c => {
    n3store.removeTriples(n3store.getTriples(c, null, null));
  })
  n3store.removeTriples(n3store.getTriples(clustering, null, null)); 
}

function checkExistingClustering(clustering){
  let features = [];
  n3store.getSubjects(TYPE, OMA+"Clustering").forEach(c => {
    n3store.getObjects(c, OMA+"used_feature").forEach(f => {
      features.push(f.split("/")[f.split("/").length-1])
    });
    if (arraysEqual(features,clustering.features)){
      removeClustering(c);
    }
  })
}

function addClustering(clustering){
  clustering = {  features: ["MFCC", "Chroma"],
                  clusters: [{  signals: ["A0", "A1", "A2"],
                                name: "cluster1" },
                             {  signals: ["B0", "B1", "B2"],
                                name: "cluster2" },],
                  method:   "method" }


  checkExistingClustering(clustering);

  const clusteringBnode = bnode();
  n3store.addTriple(clusteringBnode, TYPE, OMA+"Clustering");
  n3store.addTriple(clusteringBnode, OMA+"method", literal(clustering.method, "string"));

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
  //return n3store.createBlankNode(guid());
  // return guid URI, bnode rewrite bug
  return OMAD+guid();
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

