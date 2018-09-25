import * as https from 'https';
import * as readline from 'readline';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as store from './store';
import * as db from './feature-db';
import { RecordSide } from './types';

export async function addTestRecordSide() {
  await store.addRecordSide(loadJson('test-data/long-record-side.json'));
  //await store.addRecordSide(loadJson('test-data/record-side.json'));
}

export async function transferAllJsonToFeatureDb(dir: string) {
  const sides: RecordSide[] = getAllJsonFiles(dir).map(f => loadJson(dir+f));
  //sort and dedupe
  sides.sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const dupeTitles = _(sides).groupBy(s => s.title).pickBy(x => x.length > 1).keys().value();
  const dupes = dupeTitles.map(d => sides.filter(s => s.title == d));
  //always keep last record of same ones
  const deduped = dupes.map(ds => ds.filter((d,i) => ds.length<=i+1 || !sameRecordSide(d, ds[i+1])));
  const nonDupes = sides.filter(s => _.flatten(dupes).indexOf(s) < 0);
  const uniqueSides = nonDupes.concat(_.flatten(deduped));
  uniqueSides.sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  console.log(sides.length, uniqueSides.length);
  //add
  await mapSeries(uniqueSides, async s => {
    console.log("adding", s.artist, "-", s.title);
    await db.insertRecordSide(s);
  });
  console.log("done");
}

function sameRecordSide(a: RecordSide, b: RecordSide) {
  const deltaTime = Math.abs(new Date(a.time).getTime()-new Date(b.time).getTime());
  const deltaLength = Math.abs(a.soundObjects.length - b.soundObjects.length);
  return _.lowerCase(a.title) == _.lowerCase(b.title)
    && deltaTime < 1000*60*60*24 //same if redegidised within 24 hours
    && _.lowerCase(a.catNo) == _.lowerCase(b.catNo)
    //&& deltaLength < 3;
}

export async function saveRandomSoundObjectsToDisk(count: number, dir: string) {
  //const objects = await db.getRandomSoundObjects(count);
  let objects = await db.getSoundObjectsOfDuration(0.5, count*10);
  objects = _.sampleSize(objects, count);
  writeJson(dir+"objects.json", objects);
  mapSeries(objects, (o,i) => new Promise(resolve => {
    var file = fs.createWriteStream(dir+i+".wav");
    https.get(o.audioUri, response => {
      resolve();
      response.pipe(file);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(i+"");
    });
  }));
}

function getAllJsonFiles(path: string) {
  return fs.readdirSync(path).filter(f => f.indexOf('.json') >= 0);
}

function loadJson(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeJson(path: string, json: {}) {
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
}

async function mapSeries<T,S>(array: T[], func: (arg: T, i: number) => Promise<S>): Promise<S[]> {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(await func(array[i], i));
  }
  return result;
}