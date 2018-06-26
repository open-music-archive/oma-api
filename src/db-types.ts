import { ObjectID } from 'mongodb';
import { FeatureSummary } from './types';

export interface DbSoundObjectFeatures {
  _id: ObjectID,
  duration: number,
  normalFeatures: number[],
  audioUri: string,
  features: FeatureSummary[]
}