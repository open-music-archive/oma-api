export interface Record {
  title: string,
  composer: string,
  artist: string,
  id: string,
  label: string,
  side: string,
  soundObjects: Fragment[]
}

export interface Fragment {
  time: number,
  duration: number,
  vector: number[],
  fileUri: string,
  features: FeatureSummary[]
}

export interface FeatureSummary {
  name: string,
  mean: number | number[],
  var: number | number[]
}

export interface Clustering {
  name: string[], 
  features: string[],
  clusters: Cluster[] 
}

export interface Cluster {
  name: string,
  signals: string[]
}