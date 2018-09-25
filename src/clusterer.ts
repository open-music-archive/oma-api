import * as clusterfck from 'clusterfck';
import { DbClustering } from './db-types';
import { SoundObject } from './types';

export function classify(clustering: DbClustering, soundObject: SoundObject): number {
  var kmeans = new clusterfck.Kmeans();
  kmeans.centroids = clustering.centroids;
  var index = kmeans.classify(soundObject.normalFeatures);
  return index;
}
