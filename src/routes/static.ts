import { Router } from 'express';
import * as lodash from 'lodash';
import { format } from 'util';
import { LOL_URL } from '../constants';
import championStorage from '../lib/demacia/data-dragon/storage/champion-storage';
import spellStorage from '../lib/demacia/data-dragon/storage/spell-storage';
import { getLastVersion } from '../lib/lol';
import Champion from '../models/static/champion';
import Spell from '../models/static/spell';
import Item from '../models/static/item';
import itemStorage from '../lib/demacia/data-dragon/storage/item-storage';
import perkStorage from '../lib/demacia/data-dragon/storage/perk-storage';

const router = Router();

router.get('/champion/all', function(req, res, next) {
  Champion.find().then(async (champions) => {
    const version = await getLastVersion();
    const result = champions.map((champion) => {
      const fileData = championStorage.get(version, champion.key);
      const rawData = fileData.data[champion.id];
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = Number(clientData.key);
      clientData.iconUrl = format(LOL_URL.CHAMPION_ICON, version, rawData.image.full);
      clientData.passive.iconUrl = format(
        LOL_URL.CHAMPION_PASSIVE_ICON,
        version,
        rawData.passive.image.full
      );
      clientData.spells = clientData.spells.map((spell: any) => {
        spell.iconUrl = format(LOL_URL.CHAMPION_SPELL_ICON, version, spell.image.full);

        delete spell.image;
        delete spell.effect;
        delete spell.effectBurn;

        return spell;
      });

      delete clientData.passive.image;
      delete clientData.image;
      delete clientData.recommended;

      return clientData;
    });
    res.json(result);
  });
});

router.get('/spell/all', function(req, res, next) {
  Spell.find().then(async (spells) => {
    const version = await getLastVersion();
    const result = spells.map((spell) => {
      const rawData = spellStorage.get(version, spell.id);
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = Number(clientData.key);
      clientData.iconUrl = format(LOL_URL.SPELL_ICON, version, rawData.image.full);
      delete clientData.image;
      delete clientData.effect;
      delete clientData.effectBurn;
      delete clientData.modes;

      return clientData;
    });
    res.json(result);
  });
});

router.get('/item/all', function(req, res, next) {
  Item.find().then(async (items) => {
    const version = await getLastVersion();
    const result = items.map((item) => {
      const rawData = itemStorage.get(version, item.key);
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = item.key;
      clientData.iconUrl = format(LOL_URL.ITEM_ICON, version, rawData.image.full);
      delete clientData.image;
      delete clientData.effect;
      delete clientData.maps;
      delete clientData.stats;
      delete clientData.tags;
      delete clientData.depth;

      return clientData;
    });
    res.json(result);
  });
});

router.get('/item/all', function(req, res, next) {
  Item.find().then(async (items) => {
    const version = await getLastVersion();
    const result = items.map((item) => {
      const rawData = itemStorage.get(version, item.key);
      const clientData = <any>lodash.cloneDeep(rawData);

      clientData.key = item.key;
      clientData.iconUrl = format(LOL_URL.ITEM_ICON, version, rawData.image.full);
      delete clientData.image;
      delete clientData.effect;
      delete clientData.maps;
      delete clientData.stats;
      delete clientData.tags;
      delete clientData.depth;

      return clientData;
    });
    res.json(result);
  });
});

router.get('/perk/all', function(req, res, next) {
  getLastVersion().then((version) => {
    const rawData = perkStorage.get(version);
    const clientData = <any[]>lodash.cloneDeep(rawData);
    for (let i = 0; i < clientData.length; i++) {
      clientData[i].baseIconUrl = LOL_URL.BASE_PERK_ICON_URL;
    }
    res.json(clientData);
  });
});

export default router;
