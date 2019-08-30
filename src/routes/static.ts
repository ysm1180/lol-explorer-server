import { Router } from 'express';
import * as lodash from 'lodash';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import Champion from '../models/static/champion';
import Item from '../models/static/item';
import Spell from '../models/static/spell';

const router = Router();

const stats: { [lang: string]: { [id: string]: string } } = {
  ko_kr: {
    spelldamage: '주문력',
    attackdamage: '공격력',
    bonusattackdamage: '추가 공격력',
    bonusspellblock: '추가 마법 저항력',
    bonusarmor: '추가 방어력',
  },
};

router.get('/champion/all', async function(req, res, next) {
  try {
    const result: { [key: string]: any } = {};
    const champions = await Champion.find();
    const version = await DDragonHelper.getLatestVersion();
    for (let i = 0; i < champions.length; i++) {
      const rawData = await DDragonHelper.getChampionData(
        version,
        champions[i].key,
        champions[i].id
      );
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = Number(clientData.key);
      clientData.iconUrl = DDragonHelper.URL_CHAMPION_ICON(version, rawData.image.full);
      clientData.passive.iconUrl = DDragonHelper.URL_CHAMPION_PASSIVE_ICON(
        version,
        rawData.passive.image.full
      );

      clientData.spells = clientData.spells.map((spell: any) => {
        spell.iconUrl = DDragonHelper.URL_CHAMPION_SPELL_ICON(version, spell.image.full);

        const vars: any = {};
        if (spell.vars) {
          for (const varData of spell.vars) {
            const link: string = varData.link;
            if (stats['ko_kr'][link]) {
              vars[varData.key] = `${varData.coeff * 100}% ${stats['ko_kr'][link]}`;
            } else {
              vars[varData.key] = `${varData.coeff * 100}%`;
            }
          }
        }

        let tooltip: string = spell.tooltip;
        for (let e = 0; e <= 10; e++) {
          tooltip = tooltip.replace(
            new RegExp(`{{\\s*e${e}\\s*}}`, 'g'),
            spell.effectBurn[e] || ''
          );
        }
        for (const key in vars) {
          tooltip = tooltip.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), vars[key] || '');
        }
        if (new RegExp(`{{\\s*[\\w\\d\\S]+\\s*}}`, 'g').test(tooltip)) {
          spell.secret = true;
          tooltip = tooltip.replace(new RegExp(`{{\\s*[\\w\\d\\S]+\\s*}}`, 'g'), '?');
        }
        spell.tooltip = tooltip;

        if (spell.resource) {
          let resource = spell.resource
            .replace(/{{ abilityresourcename }}/, clientData.partype)
            .replace(/{{ cost }}/, spell.costBurn);
          spell.resource = resource;
        }

        delete spell.vars;
        delete spell.datavalues;
        delete spell.description;
        delete spell.leveltip;
        delete spell.image;
        delete spell.effect;
        delete spell.effectBurn;
        delete spell.range;
        delete spell.cost;
        delete spell.cooldown;

        return spell;
      });

      delete clientData.passive.image;
      delete clientData.image;
      delete clientData.recommended;
      delete clientData.skins;
      delete clientData.lore;
      delete clientData.blurb;
      delete clientData.allytips;
      delete clientData.enemytips;
      delete clientData.tags;
      delete clientData.info;
      delete clientData.stats;

      result[rawData.key] = clientData;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/spell/all', async function(req, res, next) {
  try {
    const result: { [key: string]: any } = {};
    const spells = await Spell.find();
    const version = await DDragonHelper.getLatestVersion();
    for (let i = 0; i < spells.length; i++) {
      const rawData = await DDragonHelper.getSummonerSpellData(version, spells[i].id);
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = Number(clientData.key);
      clientData.iconUrl = DDragonHelper.URL_SPELL_ICON(version, rawData.image.full);
      delete clientData.costBurn;
      delete clientData.cost;
      delete clientData.datavalues;
      delete clientData.vars;
      delete clientData.maxammo;
      delete clientData.image;
      delete clientData.effect;
      delete clientData.effectBurn;
      delete clientData.modes;
      delete clientData.maxrank;
      delete clientData.tooltip;
      delete clientData.costType;
      delete clientData.resource;

      result[rawData.key] = clientData;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/item/all', async function(req, res, next) {
  try {
    const result: { [key: string]: any } = {};
    const items = await Item.find();
    const version = await DDragonHelper.getLatestVersion();
    for (let i = 0; i < items.length; i++) {
      const rawData = await DDragonHelper.getItemData(version, items[i].key);
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = items[i].key;
      clientData.iconUrl = DDragonHelper.URL_ITEM_ICON(version, rawData.image.full);
      delete clientData.image;
      delete clientData.effect;
      delete clientData.maps;
      delete clientData.stats;
      delete clientData.tags;
      delete clientData.depth;

      result[items[i].key] = clientData;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/perk/all', function(req, res, next) {
  const baseIconUrl = DDragonHelper.URL_PERK_ICON();

  DDragonHelper.getLatestVersion().then(async (version) => {
    const rawData = await DDragonHelper.getPerkAllData(version);
    const clientData = {} as any;
    for (let i = 0; i < rawData.length; i++) {
      clientData[rawData[i].id] = lodash.cloneDeep(rawData[i]);
      clientData[rawData[i].id].iconUrl = baseIconUrl + clientData[rawData[i].id].icon;
      delete clientData[rawData[i].id].icon;
      for (let j = 0; j < rawData[i].slots.length; j++) {
        clientData[rawData[i].id].slots[j].runes = {};
        for (let k = 0; k < rawData[i].slots[j].runes.length; k++) {
          clientData[rawData[i].id].slots[j].runes[rawData[i].slots[j].runes[k].id] =
            rawData[i].slots[j].runes[k];
          clientData[rawData[i].id].slots[j].runes[rawData[i].slots[j].runes[k].id].iconUrl =
            baseIconUrl +
            clientData[rawData[i].id].slots[j].runes[rawData[i].slots[j].runes[k].id].icon;
          clientData[rawData[i].id].slots[j].runes[rawData[i].slots[j].runes[k].id].sort = k;
        }
      }
    }
    res.json(clientData);
  });
});

export default router;
