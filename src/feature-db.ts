import { MongoClient, Db, ObjectID } from 'mongodb';
import * as _ from 'lodash';
import { URL } from './config';
import { RecordSide } from './types';
import { DbSoundObject, DbSoundObjectFeatures } from './db-types';
import { toDbFeatures } from './util';

const FEATURES = "soundObjectFeatures";
const AWESOME_LOOPS = "awesomeLoops";
const AMP_FEATURE = 2;

let db: Db;
let NUM_OBJECTS : number;

export async function connect() {
  let client = await MongoClient.connect(URL, { useNewUrlParser: true });
  db = client.db('openmusicarchive');
  NUM_OBJECTS = await db.collection(FEATURES).countDocuments();
}

export function getAwesomeLoop(): Promise<{}> {
  return db.collection(AWESOME_LOOPS).aggregate(
    [{ $sample: { size: 1 } }]
  ).toArray().then(r => r[0]);
}

//posts the side to the feature db and updates the featureGuids
export async function insertRecordSide(side: RecordSide) {
  const docIds = await Promise.all(side.soundObjects
    .map(o => insertFeatures(toDbFeatures(o))));
  side.soundObjects.forEach((o,i) => o.featureGuid = docIds[i].toHexString());
}

async function insertFeatures(features: DbSoundObjectFeatures): Promise<ObjectID> {
  return (await db.collection(FEATURES).insertOne(features)).insertedId;
}

export async function getAllNormalFeatures(): Promise<DbSoundObjectFeatures[]> {
  return db.collection(FEATURES).find({}).project({"normalFeatures": 1}).toArray();
}

export async function getLongAndShortObjects(long: number, short: number): Promise<DbSoundObject[]> {
  const longs = _.sampleSize(await getLongestSoundObjects(NUM_OBJECTS/100), long);
  const shorts = _.sampleSize(await getShortestSoundObjects(NUM_OBJECTS/100), short);
  return longs.concat(shorts);
}

export async function getLoudestSoundObjectsOfDuration(duration: number, count: number): Promise<DbSoundObject[]> {
  let aggregate = getClosest("duration", duration, count*10)
    .concat(getMaxFeature(AMP_FEATURE, count));
  return getSoundObjects(aggregate);
}

export async function getLoudestObjects(count: number): Promise<DbSoundObject[]> {
  return getSoundObjects(getMaxFeature(AMP_FEATURE, count));
}

export async function getSoundObjectsOfDuration(duration: number, count: number): Promise<DbSoundObject[]> {
  return getSoundObjects(getClosest("duration", duration, count));
}

export async function getLongestSoundObjects(count: number): Promise<DbSoundObject[]> {
  return getSoundObjects(getMax("duration", count));
}

export async function getShortestSoundObjects(count: number): Promise<DbSoundObject[]> {
  return getSoundObjects(getMin("duration", count));
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
  const sort = {};
  sort[field] = -1;
  return [
    { $sort: sort },
    { $limit: count }
  ];
}

function getClosest(field: string, value: number, count: number): Object[] {
  return [
    { $addFields: { delta: { $abs: { $subtract: [ "$"+field, value ] } } } },
    { $sort: { delta: 1 } },
    { $limit: count }
  ];
}

async function getSoundObjects(aggregate: Object[]): Promise<DbSoundObject[]> {
  return db.collection(FEATURES)
    .aggregate(aggregate)
    .project({"audioUri": 1, "duration": 1})
    .toArray();
}