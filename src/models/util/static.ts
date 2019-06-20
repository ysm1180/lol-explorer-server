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
