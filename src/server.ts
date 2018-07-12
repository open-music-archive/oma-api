import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as store from './store';
import * as featureDb from './feature-db';
import { toDbFeatures } from './util';
import * as textures from './textures';
import { RecordSide, Clustering } from './types';
import { EXAMPLERECORDSIDE, LONGEXAMPLERECORDSIDE } from './test';

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
  res.send(await store.addRecordSide(side));
});

app.post('/clustering', async (req, res) => {
  const clustering = <Clustering>req.body;
  //TODO THOMAS
  //res.send(await store.addClustering(clustering));
});

app.get('/records', (req, res) => {
  res.send(store.getRecords());
});

app.get('/texture', async (req, res) => {
  res.send(await textures.generateTexture());
});

app.get('/awesome', async (req, res) => {
  res.send(await featureDb.getAwesomeLoop());
});

app.get('/features', async (req, res) => {
  res.send(await featureDb.getAllNormalFeatures());
});

app.listen(PORT, async () => {
  await featureDb.connect();
  console.log('open music archive server started at http://localhost:' + PORT);
  //console.log(await featureDb.getAwesomeLoop())
  //test();
});

async function test() {
  addTestRecordSide();
  //await addTestFeature();
  //console.log(JSON.stringify(await featureDb.getLongestSoundObjects(3), null, 2));
  //textures.generateLoop();
}

function addTestRecordSide() {
  store.addRecordSide(LONGEXAMPLERECORDSIDE)
  //store.addRecordSide(EXAMPLERECORDSIDE)
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