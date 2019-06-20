import axios from 'axios';
import * as console from 'console';
import * as fs from 'fs';
import * as path from 'path';
import { getLastVersion } from '../lib/lol';
import Champion from '../models/static/champion';
import Spell from '../models/static/spell';
import Item from '../models/static/item';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';

export async function updateChampionData() {
  const version = await getLastVersion();
  const championDataFolderPath = path.resolve(__dirname, 'data', 'champion');
  const versionDataPath = path.resolve(championDataFolderPath, version);
  const allChampionData = path.resolve(versionDataPath, 'champion_all.json');

  console.log('[Champion] Check static champion data file...');
  if (!fs.existsSync(versionDataPath)) {
    if (!fs.existsSync(championDataFolderPath)) {
      fs.mkdirSync(championDataFolderPath);
    }
    console.log(`[Champion] Making version ${version} folder...`);
    fs.mkdirSync(versionDataPath);
  }

  if (!fs.existsSync(allChampionData)) {
    const url = DDragonHelper.URL_STATIC_CHAMPIONS_DATA(version);
    try {
      console.log(`[Champion] Getting ${url} data...`);
      const response = await axios.get(url);
      fs.writeFileSync(allChampionData, JSON.stringify(response.data));
      console.log('[Champion] Written all champion json data.');
    } catch (error) {
      console.log(error);
    }
  }

  const jsonData = JSON.parse(fs.readFileSync(allChampionData, { encoding: 'utf8' }));
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

    const championDataPath = path.resolve(versionDataPath, String(value.key) + '.json');
    if (!fs.existsSync(championDataPath)) {
      const url = DDragonHelper.URL_STATIC_CHAMPION_DATA(version, key);
      try {
        console.log(`[Champion] Getting ${key} champion data ${url}`);
        const response = await axios.get(url);
        fs.writeFileSync(championDataPath, JSON.stringify(response.data));
      } catch (error) {
        console.log(error);
      }
      console.log(`[Champion] Written ${key} champion data.`);
    }
  }
  console.log('[Champion] Fine.');
}

export async function updateSpellData() {
  const version = await getLastVersion();
  const spellDataFolderPath = path.resolve(__dirname, 'data', 'spell');
  const versionDataPath = path.resolve(spellDataFolderPath, version);
  const allSpellData = path.resolve(versionDataPath, 'spell_all.json');

  console.log('[Spell] Check static spell data file...');
  if (!fs.existsSync(versionDataPath)) {
    if (!fs.existsSync(spellDataFolderPath)) {
      fs.mkdirSync(spellDataFolderPath);
    }
    console.log(`[Spell] Making version ${version} folder...`);
    fs.mkdirSync(versionDataPath);
  }

  if (!fs.existsSync(allSpellData)) {
    const url = DDragonHelper.URL_STATIC_SPELLS_DATA(version);
    try {
      console.log(`[Spell] Getting ${url} data...`);
      const response = await axios.get(url);
      fs.writeFileSync(allSpellData, JSON.stringify(response.data));
    } catch (error) {
      console.log(error);
    }
    console.log('[Spell] Written all spell json data.');
  }

  const jsonData = JSON.parse(fs.readFileSync(allSpellData, { encoding: 'utf8' }));
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

export async function updateItemData() {
  const version = await getLastVersion();
  const itemDataFolderPath = path.resolve(__dirname, 'data', 'item');
  const versionDataPath = path.resolve(itemDataFolderPath, version);
  const allItemData = path.resolve(versionDataPath, 'item_all.json');

  console.log('[Item] Check static item data file...');
  if (!fs.existsSync(versionDataPath)) {
    if (!fs.existsSync(itemDataFolderPath)) {
      fs.mkdirSync(itemDataFolderPath);
    }
    console.log(`[Item] Making version ${version} folder...`);
    fs.mkdirSync(versionDataPath);
  }

  if (!fs.existsSync(allItemData)) {
    const url = DDragonHelper.URL_STATIC_ITEMS_DATA(version);
    try {
      console.log(`[Item] Getting ${url} data...`);
      const response = await axios.get(url);
      fs.writeFileSync(allItemData, JSON.stringify(response.data));
    } catch (error) {
      console.log(error);
    }
    console.log('[Item] Written all item json data.');
  }

  const jsonData = JSON.parse(fs.readFileSync(allItemData, { encoding: 'utf8' }));
  for (const key in jsonData.data) {
    const value = jsonData.data[key];
    const item = await Item.findOne({ key: Number(key) }).exec();
    if (!item) {
      new Item({
        key: Number(key),
      }).save();
      console.log(`[Item] Saved item data ${value.key} : ${key} to db.`);
    }
  }
  console.log('[Item] Fine.');
}

export async function updatePerkData() {
  const version = await getLastVersion();
  const perkDataFolderPath = path.resolve(__dirname, 'data', 'perk');
  const versionDataPath = path.resolve(perkDataFolderPath, version);
  const allPerkData = path.resolve(versionDataPath, 'perk_all.json');

  console.log('[Perk] Check static perk data file...');
  if (!fs.existsSync(versionDataPath)) {
    if (!fs.existsSync(perkDataFolderPath)) {
      fs.mkdirSync(perkDataFolderPath);
    }
    console.log(`[Perk] Making version ${version} folder...`);
    fs.mkdirSync(versionDataPath);
  }

  if (!fs.existsSync(allPerkData)) {
    const url = DDragonHelper.URL_STATIC_PERKS_DATA(version);
    try {
      console.log(`[Perk] Getting ${url} data...`);
      const response = await axios.get(url);
      fs.writeFileSync(allPerkData, JSON.stringify(response.data));
    } catch (error) {
      console.log(error);
    }
    console.log('[Perk] Written all perk json data.');
  }

  console.log('[Perk] Fine.');
}

export function updateAllStaticData() {
  updateChampionData();
  updateSpellData();
  updateItemData();
  updatePerkData();
}
