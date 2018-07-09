

export const EXAMPLESOUNDOBJECTS = [
    {  time: 12.3,
                duration: 0.1,
                audioUri: "so1.wav",
                featureGuid: "feature_doc_guid_001"
              },
    {  time: 22.5,
                duration: 0.12,
                audioUri: "so2.wav",
                featureGuid: "feature_doc_guid_002" },
    {  time: 32.3,
                duration: 0.25,
                audioUri: "so3.wav",
                featureGuid: "feature_doc_guid_003" }
     ]


export const EXAMPLECLUSTERING = {
      features: ["MFCC", "Chroma"],
                  clusters: [{  signals: ["A0", "A1", "A2"],
                                name: "cluster1" ,
                                centroid: "0, 1, 2" },
                             {  signals: ["B0", "B1", "B2"],
                                name: "cluster2",
                                centroid: "0, 1, 2" },],
                  method:   "Method" }



export const EXAMPLERECORDSIDE = {
    title: "The Carnival of Venice",
    composer: "Benedict - arr. James",
    artist: "Harry James and his Orchestra",
    catNo: "R 2848",
    label: "Parlophone",
    side: "A",
    soundObjects: [],
    imageUri: "http://www.example.com/example.jpg",
    time: "2018-05-12T13:20:00",
    eq: "RIAA",
    noEqAudioFile: "audio_01.wav"
  }
