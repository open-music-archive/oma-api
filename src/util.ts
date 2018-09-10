import { SoundObject } from './types';
import { DbSoundObjectFeatures } from './db-types';

export function toDbFeatures(soundObject: SoundObject): DbSoundObjectFeatures {
  return {
    _id: undefined,
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