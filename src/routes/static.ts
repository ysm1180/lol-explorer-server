import { Router } from 'express';
import * as lodash from 'lodash';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import Champion from '../models/static/champion';
import Item from '../models/static/item';
import Spell from '../models/static/spell';

const router = Router();

router.get('/champion/all', async function(req, res, next) {
  try {
    const result = [];
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

        delete spell.image;
        delete spell.effect;
        delete spell.effectBurn;

        return spell;
      });

      delete clientData.passive.image;
      delete clientData.image;
      delete clientData.recommended;

      result.push(clientData);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/spell/all', async function(req, res, next) {
  try {
    const result = [];
    const spells = await Spell.find();
    const version = await DDragonHelper.getLatestVersion();
    for (let i = 0; i < spells.length; i++) {
      const rawData = await DDragonHelper.getSummonerSpellData(version, spells[i].id);
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = Number(clientData.key);
      clientData.iconUrl = DDragonHelper.URL_SPELL_ICON(version, rawData.image.full);
      delete clientData.image;
      delete clientData.effect;
      delete clientData.effectBurn;
      delete clientData.modes;

      result.push(clientData);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/item/all', async function(req, res, next) {
  try {
    const result = [];
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

      result.push(clientData);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/perk/all', function(req, res, next) {
  DDragonHelper.getLatestVersion().then(async (version) => {
    const rawData = await DDragonHelper.getPerkAllData(version);
    const clientData = <any[]>lodash.cloneDeep(rawData);
    for (let i = 0; i < clientData.length; i++) {
      clientData[i].baseIconUrl = DDragonHelper.URL_PERK_ICON(version);
    }
    res.json(clientData);
  });
});

export default router;
