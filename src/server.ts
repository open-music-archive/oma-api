import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as store from './store';
import * as featureDb from './feature-db';
import * as textures from './textures';
import { RecordSide, Clustering } from './types';
import { addTestRecordSide, transferAllJsonToFeatureDb } from './test';

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
  await featureDb.insertRecordSide(side);
  await store.addRecordSide(side);
  res.send();
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
  //addTestRecordSide();
  //console.log(await featureDb.getLoudestSoundObjectsOfDuration(0.25, 3));
  //await transferAllJsonToFeatureDb('/Users/flo/Projects/Code/FAST/open-music-archive/96kHz/');
});