export interface RecordSide {
  title: string,
  composer: string,
  artist: string,
  catNo: string,
  label: string,
  side: string,
  soundObjects: Fragment[]
}

export interface Fragment {
  time: number,
  duration: number,
  normalFeatures: number[],
  fileUri: string,
  features: FeatureSummary[],
  featureGuid: string
}

export interface FeatureSummary {
  name: string,
  mean: number | number[],
  var: number | number[]
}

export interface Clustering {
  features: string[],
  method: string,
  clusters: Cluster[] 
}

export interface Cluster {
  name: string,
  signalsAdd: string[],
  signalsDelete: string[],
  centroid: number[]
}