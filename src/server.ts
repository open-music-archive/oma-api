import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as socketIO from 'socket.io';
import * as fs from 'fs';
import * as store from './store';
import * as featureDb from './feature-db';
import { TextureGenerator } from './textures';
import { RecordSide, Clustering } from './types';
import { addTestRecordSide, transferAllJsonToFeatureDb } from './test';
import { CompositionStream } from './live-stream';

const PORT = process.env.PORT || 8060;

const textures = new TextureGenerator();

const app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:4200 https://open-music-archive.github.io");
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
  //for now, add to feature db
  featureDb.insertClustering(clustering);
});

app.get('/records', (req, res) => {
  res.send(store.getRecords());
});

app.get('/texture', async (req, res) => {
  res.send(await textures.generateOneoffTexture());
});

app.get('/awesome', async (req, res) => {
  res.send(await featureDb.getAwesomeLoop());
});

app.get('/features', async (req, res) => {
  res.send(await featureDb.getAllNormalFeatures());
});

const server = app.listen(PORT, async () => {
  await featureDb.connect();
  console.log('open music archive server started at http://localhost:' + PORT);
  //addTestRecordSide();
  //let obj = (await featureDb.getLoudestSoundObjects(1))[0];
  //console.log(JSON.stringify(await featureDb.getSimilarSoundObjects(obj)));
  //console.log(await featureDb.getShortestSoundObjects(3))
  //console.log(await featureDb.getLoudestSoundObjectsOfDuration(0.25, 3));
  //await transferAllJsonToFeatureDb('/Users/flo/Projects/Code/FAST/open-music-archive/96kHz/');
});

const io = socketIO.listen(server);

const composition = new CompositionStream();

io.on('connection', socket => {
  console.log('client connected', socket.handshake.headers.origin);
  setInterval(async () => socket.emit('live-stream', await composition.getNextTexture()), 5000);
  socket.on('disconnect', socket => console.log('client disconnected', socket.handshake.headers.origin));
});