import * as clusterfck from 'clusterfck';
import { ObjectID } from 'mongodb';
import { ClusteringParameters, Cluster } from './db-types';
import { Clustering } from './types';
import * as featureDb from './feature-db';

export async function classify(params: ClusteringParameters): Promise<Cluster> {
  var clustering = await featureDb.getClustering(params.clusteringID);
  var kmeans = new clusterfck.Kmeans();
  kmeans.centroids = clustering.centroids;
  var index = kmeans.classify(params.soundObject.normalFeatures);
  return (await featureDb.getCluster(params.clusteringID, index));
}
