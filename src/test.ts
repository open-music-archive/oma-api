import * as fs from 'fs';
import * as store from './store';
import * as db from './feature-db';

export async function addTestRecordSide() {
  await store.addRecordSide(loadJson('test-data/long-record-side.json'));
  //await store.addRecordSide(loadJson('test-data/record-side.json'));
}

export async function transferAllJsonToFeatureDb(dir: string) {
  return mapSeries(getAllJsonFiles(dir), async f => {
    console.log("started", f);
    const side = loadJson(dir+f);
    await db.insertRecordSide(side);
    writeJson(dir+f, side);
    console.log("done with", f);
  });
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