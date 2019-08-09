import Champion from '../static/champion';
import Item from '../static/item';
import Spell from '../static/spell';
import { DDragonHelper } from '../../lib/demacia/data-dragon/ddragon-helper';

export async function registerStaticChamionList(champions: { [id: string]: string }) {
  for (const championId in champions) {
    const name = champions[championId];
    const championModel = await Champion.findOne({ key: Number(championId) }).exec();
    if (!championModel) {
      new Champion({
        key: Number(championId),
        id: name,
      }).save();
    }
  }

  console.log(`[Mongo] Finish champions.`);
}

export async function registerStaticItemList(items: any) {
  for (const key in items) {
    const item = await Item.findOne({ key: Number(key) }).exec();
    if (!item) {
      new Item({
        key: Number(key),
      }).save();
    }
  }

  console.log(`[Mongo] Finish items.`);
}

export async function registerStaticSpellList(spells: any) {
  for (const key in spells) {
    const value = spells[key];
    const spell = await Spell.findOne({ key: Number(value.key) }).exec();
    if (!spell) {
      new Spell({
        key: Number(value.key),
        id: key,
      }).save();
    }
  }

  console.log(`[Mongo] Finish spells.`);
}

export async function getConsumedStaticItemIdList() {
  const items = await Item.find();
  const version = await DDragonHelper.getLatestVersion();
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const rawData = await DDragonHelper.getItemData(version, items[i].key);
    if (rawData.consumed) {
      result.push(items[i].key);
    }
  }
  return result;
}

export async function getCombinedStaticItemIdList() {
  const items = await Item.find();
  const version = await DDragonHelper.getLatestVersion();
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const rawData = await DDragonHelper.getItemData(version, items[i].key);
    if (rawData.from && rawData.from.length > 0) {
      result.push(items[i].key);
    }
  }
  return result;
}

export async function getFinalStaticItemIdList() {
  const items = await Item.find();
  const version = await DDragonHelper.getLatestVersion();
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const rawData = await DDragonHelper.getItemData(version, items[i].key);
    if (rawData.from && rawData.from.length > 0) {
      if (rawData.into && rawData.into.length === 1) {
        const intoRawData = await DDragonHelper.getItemData(version, Number(rawData.into[0]));
        if (intoRawData.requiredAlly) {
          result.push(items[i].key);
        }
      } else if (!rawData.into) {
        result.push(items[i].key);
      }
    }
  }
  return result;
}

export async function getShoesStaticItemIdList() {
  const items = await Item.find();
  const version = await DDragonHelper.getLatestVersion();
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const rawData = await DDragonHelper.getItemData(version, items[i].key);
    if (rawData.from && rawData.from.length > 0) {
      if (rawData.from.includes('1001')) {
        result.push(items[i].key);
      }
    }
  }
  return result;
}

