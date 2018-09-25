import { MongoClient, Db, ObjectID } from 'mongodb';
import * as _ from 'lodash';
import { URL } from './config';
import { RecordSide, Clustering } from './types';
import { DbSoundObject, DbSoundObjectFeatures, DbClustering, Cluster } from './db-types';
import { toDbFeatures, objectIdWithTimestamp } from './util';

const RECORDINGS = "recordings";
const FEATURES = "soundObjectFeatures";
const AWESOME_LOOPS = "awesomeLoops";
const CLUSTERINGS = "clusterings";
const CLUSTERS = "clusters";
const AMP_FEATURE = 2;

let db: Db;
let NUM_OBJECTS : number;

export async function connect() {
  let client = await MongoClient.connect(URL, { useNewUrlParser: true });
  const dbname = URL.split("/").pop();
  db = client.db(dbname);
  NUM_OBJECTS = await db.collection(FEATURES).countDocuments();
}

// INSERT FUNCTIONS

//posts the side to the feature db and updates the featureGuids
export async function insertRecordSide(side: RecordSide) {
  const recId = await insertRecording(side);
  const docIds = await Promise.all(side.soundObjects
    .map(o => insertFeatures(toDbFeatures(o, recId))));
  const updated = await updateRecording(recId, docIds);
  console.log(recId, updated);
  side.soundObjects.forEach((o,i) => o.featureGuid = docIds[i].toHexString());
}

async function updateRecording(recId: ObjectID, objIds: ObjectID[]): Promise<number> {
  var query = { _id: recId };
  var update = { $set: { soundObjects: objIds } };
  var result = await db.collection(RECORDINGS).updateOne(query, update);
  return result.modifiedCount;
}

async function insertRecording(side: RecordSide): Promise<ObjectID> {
  return (await db.collection(RECORDINGS).insertOne(side)).insertedId;
}

async function insertFeatures(features: DbSoundObjectFeatures): Promise<ObjectID> {
  return (await db.collection(FEATURES).insertOne(features)).insertedId;
}

export async function insertClustering(c: DbClustering): Promise<number> {
  const clusteringId = (await db.collection(CLUSTERINGS).insertOne(c.clustering)).insertedId;
  c.clusters.forEach(cluster => { cluster.clusteringID = clusteringId });
  return (await db.collection(CLUSTERS).insertMany(c.clusters)).result.n;
}

export async function getClustering(clusteringID: string): Promise<Clustering> {
  var clusterings = (await db.collection(CLUSTERINGS).find({'_id': new ObjectID(clusteringID) })
    .toArray());
  // console.log(clusterings);
  return <Clustering>clusterings[0];
}

export async function getCluster(clusteringID: string, index: number): Promise<Cluster> {
  var clusters = (await db.collection(CLUSTERS).find({
    'clusterinID': new ObjectID(clusteringID),
    'index': index
  }).toArray());
  // console.log(clusters);
  return <Cluster>clusters[0];
}

// QUERY FUNCTIONS

export async function getRecordings(): Promise<{}> {
  return (await db.collection(RECORDINGS).find({}).project({"soundObjects": 0})).toArray();
}

export function getAwesomeLoop(): Promise<{}> {
  return db.collection(AWESOME_LOOPS).aggregate(
    [{ $sample: { size: 1 } }]
  ).toArray().then(r => r[0]);
}

export async function getAllNormalFeatures(): Promise<DbSoundObjectFeatures[]> {
  return db.collection(FEATURES).find({}).project({"normalFeatures": 1}).toArray();
}

export async function getRandomSoundObjects(count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects([{ $sample: { size: count } }], fromDate);
}

export async function getSimilarAudio(audioUri: string): Promise<string> {
  const soundObject = (await findSoundObjects({ audioUri: audioUri }))[0];
  return _.sample(await getSimilarSoundObjects(soundObject)).audioUri;
}

export async function removeNonClusteredIds() {
  const idsInClusters: string[] = (await db.collection(CLUSTERINGS).aggregate([
    { $unwind: "$clusters" },
    { $replaceRoot: { newRoot: "$clusters" } },
    { $unwind: "$signals" },
    { $group : { _id : null, ids: { $push: "$signals" } } }
  ]).toArray())[0].ids;
  const oidsInClusters = _.uniq(idsInClusters).map(i => new ObjectID(i));
  return db.collection(FEATURES)
    .remove({_id: {$nin: oidsInClusters}});
}

export async function getCracklingSoundObjects(fromDate?: Date): Promise<DbSoundObject[]> {
  const crackle = await findSoundObjects({"audioUri": {
    "$regex": "0b8dc245-93ba-4a84-a6bd-5ba2cf00dfb7.wav"
  }});
  return getSimilarSoundObjects(crackle[0], fromDate);
}

export async function getSimilarSoundObjects(object: DbSoundObject, fromDate?: Date): Promise<DbSoundObject[]> {
  const aggregate = addFromDateToAggregate([
    { $project: { clusters: {
      $filter: { input: "$clusters", as: "c", cond: {
        $in: [ object._id.toHexString(), "$$c.signals" ]
      } }
    } } },
    { $unwind: "$clusters" },
    { $replaceRoot: { newRoot: "$clusters" } },
    { $project: { signals: 1 } }
  ], fromDate);
  const cluster: Cluster = (await db.collection(CLUSTERINGS).aggregate(aggregate).toArray())[1]; //switch clustering here!
  if (cluster) {
    const ids = cluster.signals.map(s => new ObjectID(s));
    return findSoundObjects({ _id: { $in: ids } });
  }
  return [];
}

export async function getLongAndShortObjects(long: number, short: number, fromDate?: Date): Promise<DbSoundObject[]> {
  const longs = _.sampleSize(await getLongestSoundObjects(NUM_OBJECTS/50, fromDate), long);
  const shorts = _.sampleSize(await getShortestSoundObjects(NUM_OBJECTS/50, fromDate), short);
  return longs.concat(shorts);
}

export async function getQuieterObjects(count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return _.sampleSize(await getQuietestSoundObjects(NUM_OBJECTS/4, fromDate), count);
}

export async function getLouderObjects(count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return _.sampleSize(await getLoudestSoundObjects(NUM_OBJECTS/4, fromDate), count);
}

export async function getQuietestSoundObjectsOfDuration(duration: number, count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects(getClosest("duration", duration, count*10)
    .concat(getMinFeature(AMP_FEATURE, count)), fromDate);
}

export async function getLoudestSoundObjectsOfDuration(duration: number, count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects(getClosest("duration", duration, count*10)
    .concat(getMaxFeature(AMP_FEATURE, count)), fromDate);
}

export async function getQuietestSoundObjects(count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects(getMinFeature(AMP_FEATURE, count), fromDate);
}

export async function getLoudestSoundObjects(count: number,fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects(getMaxFeature(AMP_FEATURE, count), fromDate);
}

export async function getSoundObjectsOfDuration(duration: number, count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects(getClosest("duration", duration, count), fromDate);
}

export async function getLongestSoundObjects(count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects(getMax("duration", count), fromDate);
}

export async function getShortestSoundObjects(count: number, fromDate?: Date): Promise<DbSoundObject[]> {
  return aggregateSoundObjects(getMin("duration", count), fromDate);
}

function getMinFeature(featureIndex: number, count: number): Object[] {
  return addFeatureMean(featureIndex).concat(getMin("mean", count));
}

function getMaxFeature(featureIndex: number, count: number): Object[] {
  return addFeatureMean(featureIndex).concat(getMax("mean", count));
}

//adds a field "mean" to the top object for the feature at the given index
function addFeatureMean(index: number): Object[] {
  return [
    { $addFields: { feature: { $arrayElemAt: [ "$features", index ] }}},
    { $addFields: { mean: "$feature.mean" }}
  ]
}

function getMin(field: string, count: number): Object[] {
  return getSorted(field, 1, count);
}

function getMax(field: string, count: number): Object[] {
  return getSorted(field, -1, count);
}

function getSorted(field: string, direction: number, count: number): Object[] {
  count = count <= 0 ? 1: count;
  const sort = {};
  sort[field] = direction;
  return [
    { $sort: sort },
    { $limit: count }
  ];
}

function getClosest(field: string, value: number, count: number): Object[] {
  count = count <= 0 ? 1: count;
  return [
    { $addFields: { delta: { $abs: { $subtract: [ "$"+field, value ] } } } },
    { $sort: { delta: 1 } },
    { $limit: count }
  ];
}

async function aggregateSoundObjects(aggregate: Object[], fromDate?: Date): Promise<DbSoundObject[]> {
  aggregate = addFromDateToAggregate(aggregate, fromDate);
  return db.collection(FEATURES)
    .aggregate(aggregate)
    .project({"audioUri": 1, "duration": 1})
    .toArray();
}

function addFromDateToAggregate(aggregate: Object[], fromDate?: Date) {
  return fromDate ? getFromDate(fromDate).concat(aggregate) : aggregate;
}

function getFromDate(date: Date): Object[] {
  return [{ $match: { _id: { $gt: objectIdWithTimestamp(date) } } }];
}

async function findSoundObjects(query: Object): Promise<DbSoundObject[]> {
  return db.collection(FEATURES)
    .find(query)
    .project({"audioUri": 1, "duration": 1})
    .toArray();
}
