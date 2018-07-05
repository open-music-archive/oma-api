import { MongoClient, Db, ObjectID } from 'mongodb';
import { URL } from './config';
import { DbSoundObject, DbSoundObjectFeatures } from './db-types';

const FEATURES = "soundObjectFeatures";
const AWESOME_LOOPS = "awesomeLoops";

let db: Db;

console.log("INIT DB")

export function connect() {
  return MongoClient.connect(URL)
    .then(client => db = client.db('openmusicarchive'));
}

export function getAwesomeLoop(): Promise<{}> {
  return db.collection(AWESOME_LOOPS).aggregate(
    [{ $sample: { size: 1 } }]
  ).toArray().then(r => r[0]);
}

export async function insertFeatures(features: DbSoundObjectFeatures): Promise<ObjectID> {
  return (await db.collection(FEATURES).insertOne(features)).insertedId;
}

export async function getAllFeatures(): Promise<DbSoundObjectFeatures[]> {
  return db.collection(FEATURES).find({}).toArray();
}

export async function getLongestSoundObjects(count: number): Promise<DbSoundObject[]> {
  return getSoundObjects([{ $sort: { duration: -1 } }], count);
}

export async function getShortestSoundObjects(count: number): Promise<DbSoundObject[]> {
  return getSoundObjects([{ $sort: { duration: 1 } }], count);
}

async function getSoundObjects(aggregate: Object[], count: number): Promise<DbSoundObject[]> {
  return db.collection(FEATURES)
    .aggregate(aggregate)
    .project({"audioUri": 1, "duration": 1})
    .limit(count)
    .toArray();
}