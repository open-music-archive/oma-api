import { MongoClient, Db, ObjectID } from 'mongodb';
import { URL } from './config';
import { DbSoundObjectFeatures } from './db-types';

const FEATURES = "soundObjectFeatures";

let db: Db;

console.log("INIT DB")

export function connect() {
  return MongoClient.connect(URL)
    .then(client => db = client.db('openmusicarchive'));
}

export async function insertFeatures(features: DbSoundObjectFeatures): Promise<ObjectID> {
  return (await db.collection(FEATURES).insertOne(features)).insertedId;
}

export async function getAllFeatures(): Promise<DbSoundObjectFeatures[]> {
  return db.collection(FEATURES).find({}).toArray();
}

export async function getLongestSoundObjects(count: number): Promise<DbSoundObjectFeatures[]> {
  return db.collection(FEATURES)
    .aggregate([{ $sort: { duration: -1 } }])
    .project({"audioUri": 1, "duration": 1})
    .limit(count)
    .toArray();
}