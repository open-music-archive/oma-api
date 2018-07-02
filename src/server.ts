import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as store from './store';
import * as featureDb from './feature-db';
import { toDbFeatures } from './util';
import * as textures from './textures';
import { RecordSide } from './types';

const PORT = process.env.PORT || 8060;

const app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/record', async (req, res) => {
  const side = <RecordSide>req.body;
  const docIds = await Promise.all(side.soundObjects
    .map(o => featureDb.insertFeatures(toDbFeatures(o))));
  side.soundObjects.forEach((o,i) => o.featureGuid = docIds[i].toHexString());
  res.send(store.addRecordSide(side));
});

app.get('/records', (req, res) => {
  res.send(store.getRecords());
});

app.get('/texture', async (req, res) => {
  res.send(await textures.generateLoop());
});

app.listen(PORT, async () => {
  //await featureDb.connect();
  //console.log('open music archive server started at http://localhost:' + PORT);
  //await addTestFeature();
  //console.log(JSON.stringify(await featureDb.getAllFeatures(), null, 2));
  addTestRecordSide();
  //const testRecord = JSON.parse(fs.readFileSync('./test/chunks.json', 'utf8'));
  //textures.generateLoop(testRecord);
});

function addTestRecordSide() {
  store.addRecordSide({
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
  })
}

async function addTestFeature() {
  const docId = await featureDb.insertFeatures({
    _id: undefined,
    duration: Math.random(),
    normalFeatures: [Math.random()],
    audioUri: Math.random()+".wav",
    features: [{name: "amp", mean: Math.random(), var: Math.random()}]
  });
}