import * as fs from 'fs';
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