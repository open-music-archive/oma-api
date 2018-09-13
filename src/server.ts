import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as socketIO from 'socket.io';
import * as store from './store';
import * as featureDb from './feature-db';
import * as clusterer from './clusterer';
import { RecordSide } from './types';
import { DbClustering } from './db-types';
import * as test from './test';
import { CompositionStream } from './textures/live-stream';
import { Changing } from './textures/texture';
import * as textures from './textures/textures';
import * as streams from './textures/streams';

const PORT = process.env.PORT || 8060;

let composition: CompositionStream;

const app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");//"http://localhost:4200 https://open-music-archive.github.io http://evil.com/");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', async (req, res) => {
  res.send("this is the oma api");
});

app.post('/record', async (req, res) => {
  const side = <RecordSide>req.body;
  await featureDb.insertRecordSide(side);
  await store.addRecordSide(side);
  res.send();
});

app.post('/clustering', async (req, res) => {
  featureDb.insertClustering(<DbClustering>req.body);
  res.send();
});

app.post('/classify', async (req, res) => {
  res.send(clusterer.classify(req.body));
});

app.get('/records', (req, res) => {
  res.send(store.getRecords());
});

app.get('/texture', async (req, res) => {
  res.send(await textures.getSimilarityLoop());
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
  // await initStreamAndSockets();
  //console.log((await featureDb.getSoundObjectsNewerThan(new Date(Date.now()-(4.1*60*60*1000)))).length);

  //addTestRecordSide();
  //let obj = (await featureDb.getLoudestSoundObjects(1))[0];
  //console.log(JSON.stringify(await featureDb.getSimilarSoundObjects(obj)));
  //console.log(await featureDb.getShortestSoundObjects(3))
  //console.log(await featureDb.getLoudestSoundObjectsOfDuration(0.25, 3));
  //await transferAllJsonToFeatureDb('/Users/flo/Projects/Code/FAST/open-music-archive/96kHz/');
  //await test.saveRandomSoundObjectsToDisk(100, '../100/')
  //console.log(await featureDb.removeNonClusteredIds())
  //composition.getTextureStream().subscribe(t => console.log(t));

});

async function initStreamAndSockets() {
  //nice and experimental:
  //composition = new CompositionStream(10000, false, textures.getSlowAndLow());
  //composition = streams.getFun();
  composition = new CompositionStream(10000, false, textures.getCracklingLoop());
  //composition = new CompositionStream(10000, false, );
  //const loop = textures.getSimilarityLoop();
  //console.log(await loop.getUri())

  const io = socketIO.listen(server);
  //io.origins(['http://localhost:4200', 'https://open-music-archive.github.io/', 'https://www.playitagainuseittogether.com']);

  io.on('connection', async socket => {
    console.log('client connected, now', (<any>io.engine).clientsCount);
    //socket.emit('live-stream', "TEXT")
    composition.getTextureStream()
      .subscribe(async t => socket.emit('live-stream', await t.getJsonld()));
    socket.on('disconnect', () =>
      console.log('client disconnected, now', (<any>io.engine).clientsCount));
  });
}
