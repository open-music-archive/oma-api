import * as clusterfck from 'clusterfck';
import { DbClustering } from './db-types';
import { SoundObject } from './types';

export class Clusterer {

  private kmeans;

  constructor(clustering: DbClustering) {
    this.kmeans = new clusterfck.Kmeans();
    this.kmeans.centroids = clustering.centroids;
  }

  classify(soundObjects: SoundObject[]): number[] {
    return soundObjects.map(o => this.kmeans.classify(o.normalFeatures));
  }

}
