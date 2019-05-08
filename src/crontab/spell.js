import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { LOL_URL } from '../constants';
import { getLastVersion } from '../lib/lol';
import Spell from '../models/spell';

export async function updateSpellData() {
  const version = await getLastVersion();
  const dataFolderPath = path.resolve(__dirname, '..', 'data');
  const versionDataPath = path.resolve(dataFolderPath, version);
  const allSpellData = path.resolve(versionDataPath, 'spell_all.json');

  console.log('[Spell] Check static spell data file...');
  if (!fs.existsSync(versionDataPath)) {
    if (!fs.existsSync(dataFolderPath)) {
      fs.mkdirSync(dataFolderPath);
    }
    console.log(`[Spell] Making version ${version} folder...`);
    fs.mkdirSync(versionDataPath);
  }

  if (!fs.existsSync(allSpellData)) {
    const url = util.format(LOL_URL.STATIC_SPELL_ALL_DATA, version);
    let response;
    try {
      console.log(`[Spell] Getting ${url} data...`);
      response = await axios.get(url);
    } catch (error) {
      console.log(error);
    }
    fs.writeFileSync(allSpellData, JSON.stringify(response.data));
    console.log(`[Spell] Written all spell json data.`);
  }

  const jsonData = JSON.parse(fs.readFileSync(allSpellData));
  for (const key in jsonData.data) {
    const value = jsonData.data[key];
    const spell = await Spell.findOne({ key: Number(value.key) }).exec();
    if (!spell) {
      new Spell({
        key: Number(value.key),
        id: key,
      }).save();
      console.log(`[Spell] Saved spell data ${value.key} : ${key} to db.`);
    }
  }
  console.log('[Spell] Fine.');
}
