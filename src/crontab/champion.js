import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { LOL_URL } from '../constants';
import { getLastVersion } from '../lib/lol';
import Champion from '../models/champion';

export async function updateChampionData() {
  const version = await getLastVersion();
  const dataFolderPath = path.resolve(__dirname, '..', 'data');
  const versionDataPath = path.resolve(dataFolderPath, version);
  const allChampionData = path.resolve(versionDataPath, 'champion_all.json');

  console.log('[Champion] Check static champion data file...');
  if (!fs.existsSync(versionDataPath)) {
    if (!fs.existsSync(dataFolderPath)) {
      fs.mkdirSync(dataFolderPath);
    }
    console.log(`[Champion] Making version ${version} folder...`);
    fs.mkdirSync(versionDataPath);
  }

  if (!fs.existsSync(allChampionData)) {
    const url = util.format(LOL_URL.STATIC_CHAMPION_ALL_DATA, version);
    let response;
    try {
      console.log(`[Champion] Getting ${url} data...`);
      response = await axios.get(url);
    } catch (error) {
      console.log(error);
    }
    fs.writeFileSync(allChampionData, JSON.stringify(response.data));
    console.log(`[Champion] Written all champion json data.`);
  }

  const jsonData = JSON.parse(fs.readFileSync(allChampionData));
  for (const key in jsonData.data) {
    const value = jsonData.data[key];
    const champion = await Champion.findOne({ key: Number(value.key) }).exec();
    if (!champion) {
      new Champion({
        key: Number(value.key),
        id: key,
      }).save();
      console.log(`[Champion] Saved champion data ${value.key} : ${key} to db.`);
    }

    const championDataPath = path.resolve(
      versionDataPath,
      String(value.key) + '.json'
    );
    if (!fs.existsSync(championDataPath)) {
      const url = util.format(LOL_URL.STATIC_CHAMPION_DATA, version, key);
      let response;
      try {
        console.log(`[Champion] Getting ${key} champion data ${url}`);
        response = await axios.get(url);
      } catch (error) {
        console.log(error);
      }
      fs.writeFileSync(championDataPath, JSON.stringify(response.data));
      console.log(`[Champion] Written ${key} champion data.`);
    }
  }
  console.log('[Champion] Fine.')
}
