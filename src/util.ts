import { ObjectID } from 'mongodb';
import { SoundObject } from './types';
import { DbSoundObjectFeatures } from './db-types';

export function toDbFeatures(soundObject: SoundObject, recId: ObjectID): DbSoundObjectFeatures {
  return {
    _id: undefined,
    recordingID: recId,
    audioUri: soundObject.audioUri,
    duration: soundObject.duration,
    normalFeatures: soundObject.normalFeatures,
    features: soundObject.features
  }
}

export async function mapSeries<T,S>(array: T[], func: (arg: T, i: number) => Promise<S>): Promise<S[]> {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(await func(array[i], i));
  }
  return result;
}

export function objectIdWithTimestamp(timestamp: string | Date): ObjectID {
  // Convert string date to Date object (otherwise assume timestamp is a date)
  if (typeof(timestamp) == 'string') {
    timestamp = new Date(timestamp);
  }
  // Convert date object to hex seconds since Unix epoch
  var hexSeconds = Math.floor(<any>timestamp/1000).toString(16);
  // Create an ObjectId with that hex timestamp
  return new ObjectID(hexSeconds + "0000000000000000");
}
