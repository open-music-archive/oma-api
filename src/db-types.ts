import { ObjectID } from 'mongodb';
import { FeatureSummary } from './types';

export interface DbSoundObject {
  _id: ObjectID,
  recordingID: ObjectID,
  duration: number,
  audioUri: string
}

export interface DbSoundObjectFeatures extends DbSoundObject {
  normalFeatures: number[],
  features: FeatureSummary[]
}
