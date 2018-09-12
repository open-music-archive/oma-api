import { ObjectID } from 'mongodb';
import { SoundObject } from './types';
import { DbSoundObjectFeatures, DbRecording } from './db-types';

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
