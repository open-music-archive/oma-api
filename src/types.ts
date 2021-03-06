export interface RecordSide {
  title: string,
  composer: string,
  artist: string,
  catNo: string,
  label: string,
  side: string,
  soundObjects: SoundObject[],
  imageUri: string,
  originalImage: string,
  time: string,
  eq: string,
  noEqAudioFile: string,
  recordingGuid: string
}

export interface SoundObject {
  time: number,
  duration: number,
  normalFeatures: number[],
  audioUri: string,
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
  ratio: number,
  size: number,
  centroids: number[][]
}
