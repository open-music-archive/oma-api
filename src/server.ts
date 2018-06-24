import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as store from './store';
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

app.post('/record', (req, res) => {
  res.send(store.addRecordSide(req.body));
});

app.get('/records', (req, res) => {
  res.send(store.getRecords());
});

app.listen(PORT, () => {
  console.log('open music archive server started at http://localhost:' + PORT);
  //store.poop();
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
    soundObjects: []
  })
}