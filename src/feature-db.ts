import { MongoClient, Db, ObjectID } from 'mongodb';
import { URL } from './config';
import { DbSoundObjectFeatures } from './types';

const FEATURES = "soundObjectFeatures";

let db: Db;

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