import { ObjectID } from 'mongodb';
import { FeatureSummary, Clustering, SoundObject } from './types';

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

export interface Cluster {
  index: number,
  clusteringID: ObjectID,
  signals: string[]
}

export interface DbClustering{
  _id: ObjectID,
  features: string[],
  method: string,
  ratio: number,
  size: number,
  centroids: number[][]
}

export interface ClusteringParameters {
  clustering: Clustering,
  clusters: Cluster[]
}
