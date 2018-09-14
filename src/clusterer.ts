import * as clusterfck from 'clusterfck';
import { ObjectID } from 'mongodb';
import { ClusteringParameters, Cluster } from './db-types';
import * as featureDb from '../feature-db';

function classify(params: ClusteringParameters): Cluster {
  var clustering = featureDb.getClustering(params.clusteringID);
  var kmeans = new clusterfck.Kmeans();
  kmeans.centroids = clustering.centroids;
  var index = kmeans.classify(params.soundObject.normalFeatures);
  var cluster = featureDb.getCluster(params.clusteringID, index);
  return cluster;
}
