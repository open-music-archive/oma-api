import * as express from 'express';
import * as store from './store';

const PORT = process.env.PORT || 8060;

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/records', (req, res) => {
  res.send(store.getRecords());
});


app.listen(PORT, () => {
  console.log('open music archive server started at http://localhost:' + PORT);
  store.addRecord('test', [1,2,3])
  //store.addRecord('test2', [1,2,3])
  //store.writeStoreToRdf('dump.ttl');
});