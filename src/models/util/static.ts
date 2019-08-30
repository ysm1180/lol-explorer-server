import { DDragonHelper } from '../../lib/demacia/data-dragon/ddragon-helper';
import Champion from '../static/champion';
import Item from '../static/item';
import Spell from '../static/spell';

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

export async function getConsumedItemIdList() {
  const items = await Item.find();
  const version = await DDragonHelper.getLatestVersion();
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const rawData = await DDragonHelper.getItemData(version, items[i].key);
    if (items[i].key === 2033 || items[i].key === 2031 || rawData.consumed) {
      result.push(items[i].key);
    }
  }
  return result;
}

export async function getIntermediateItems() {
  const version = await DDragonHelper.getLatestVersion();
  const combinedItemsByFinalItem = await getCombinedItemsByFinalItem();
  const result: { [id: string]: { itemId: number; into: number[] } } = {};
  for (const key in combinedItemsByFinalItem) {
    for (const id of combinedItemsByFinalItem[key]) {
      if (!combinedItemsByFinalItem[id]) {
        if (!result[id]) {
          const rawData = await DDragonHelper.getItemData(version, Number(id));
          result[id] = {
            itemId: Number(id),
            into: rawData.into ? rawData.into.map((id) => Number(id)) : [],
          };
        }
      }
    }
  }
  return result;
}

export async function getCombinedItemsByFinalItem() {
  const items = await Item.find();
  const version = await DDragonHelper.getLatestVersion();
  const result: { [id: string]: string[] } = {};
  for (let i = 0; i < items.length; i++) {
    const rawData = await DDragonHelper.getItemData(version, items[i].key);
    if (rawData.from && rawData.from.length > 0) {
      if (rawData.into && rawData.into.length === 1) {
        const intoRawData = await DDragonHelper.getItemData(version, Number(rawData.into[0]));
        if (intoRawData.requiredAlly) {
          result[items[i].key] = rawData.from;
        }
      } else if (!rawData.into) {
        if (!rawData.requiredAlly) {
          result[items[i].key] = rawData.from;
        }
      }
    }
  }
  return result;
}

export async function getShoesItemIdList() {
  const items = await Item.find();
  const version = await DDragonHelper.getLatestVersion();
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const rawData = await DDragonHelper.getItemData(version, items[i].key);
    if (
      items[i].key === 1001 ||
      (rawData.from && rawData.from.length > 0 && rawData.from.includes('1001'))
    ) {
      result.push(items[i].key);
    }
  }
  return result;
}
