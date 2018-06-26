import { SoundObject, DbSoundObjectFeatures } from './types';

export function toDbFeatures(soundObject: SoundObject): DbSoundObjectFeatures {
  return {
    _id: undefined,
    audioUri: soundObject.audioUri,
    duration: soundObject.duration,
    normalFeatures: soundObject.normalFeatures,
    features: soundObject.features
  }
}