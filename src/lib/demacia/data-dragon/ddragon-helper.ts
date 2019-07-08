import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import redis from '../../../db/redis';
import { CacheStorage } from './storage';
import { IChampionDataDragon, IChampionRawData } from './types/champion';
import { IItemDataDragon } from './types/item';
import { IPerkDataDragon } from './types/perk';
import { ISpellDataDragon } from './types/spell';

const DDRAGON_URL = {
  VERSION: 'https://ddragon.leagueoflegends.com/api/versions.json',
  PROFILE_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/profileicon/%s.png',
  STATIC_CHAMPION_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/champion.json',
  STATIC_CHAMPION_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/champion/%s.json',
  CHAMPION_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/champion/%s',
  CHAMPION_PASSIVE_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/passive/%s',
  CHAMPION_SPELL_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/spell/%s',
  STATIC_SPELL_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/summoner.json',
  SPELL_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/spell/%s',
  STATIC_ITEM_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/item.json',
  ITEM_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/item/%s',
  PATCH: 'https://raw.githubusercontent.com/CommunityDragon/Data/master/patches.json',
  STATIC_PERK_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/runesReforged.json',
  BASE_PERK_ICON_URL: 'https://ddragon.leagueoflegends.com/cdn/img/%s/',
};

let storageRoot = path.join(__dirname, 'data');
export class DDragonHelper {
  private static staticChampionDataCache = new CacheStorage<IChampionRawData>();
  private static staticItemDataCache = new CacheStorage<IItemDataDragon>();
  private static staticSpellDataCache = new CacheStorage<ISpellDataDragon>();
  private static staticPerkDataCache = new CacheStorage<IPerkDataDragon[]>();

  static get storageRoot() {
    return storageRoot;
  }

  static set storageRoot(pathString: string) {
    storageRoot = path.resolve(pathString);
  }

  static buildStoragePath(version: string): string {
    return path.resolve(DDragonHelper.storageRoot, version);
  }

  static URL_VERSION(): string {
    return DDRAGON_URL.VERSION;
  }

  static URL_PROFILE_ICON(version: string, icon: number): string {
    return util.format(DDRAGON_URL.PROFILE_ICON, version, icon.toString());
  }

  static URL_CHAMPION_ICON(version: string, champion: string): string {
    return util.format(DDRAGON_URL.CHAMPION_ICON, version, champion);
  }

  static URL_CHAMPION_PASSIVE_ICON(version: string, passiveIconName: string): string {
    return util.format(DDRAGON_URL.CHAMPION_PASSIVE_ICON, version, passiveIconName);
  }

  static URL_CHAMPION_SPELL_ICON(version: string, spellIconName: string): string {
    return util.format(DDRAGON_URL.CHAMPION_SPELL_ICON, version, spellIconName);
  }

  static URL_SPELL_ICON(version: string, spellIconName: string): string {
    return util.format(DDRAGON_URL.SPELL_ICON, version, spellIconName);
  }

  static URL_ITEM_ICON(version: string, itemIconName: string) {
    return util.format(DDRAGON_URL.ITEM_ICON, version, itemIconName);
  }

  static URL_PERK_ICON(version: string): string {
    return util.format(DDRAGON_URL.BASE_PERK_ICON_URL, version);
  }

  static URL_STATIC_CHAMPIONS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_CHAMPION_ALL_DATA, version);
  }

  static URL_STATIC_CHAMPION_DATA(version: string, champion: string): string {
    return util.format(DDRAGON_URL.STATIC_CHAMPION_DATA, version, champion);
  }

  static URL_STATIC_ITEMS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_ITEM_ALL_DATA, version);
  }

  static URL_STATIC_SPELLS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_SPELL_ALL_DATA, version);
  }

  static URL_STATIC_PERKS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_PERK_ALL_DATA, version);
  }

  static URL_PATCH_DATA(): string {
    return DDRAGON_URL.PATCH;
  }

  static pendingDownloadPromise: Promise<any>;
  static downloadStaticDataByVersion(version: string) {
    if (DDragonHelper.pendingDownloadPromise) {
      return DDragonHelper.pendingDownloadPromise;
    }

    DDragonHelper.pendingDownloadPromise = downloadStaticDataFiles(
      version,
      DDragonHelper.buildStoragePath(version)
    );
    return DDragonHelper.pendingDownloadPromise;
  }

  static async getLatestVersion(): Promise<string> {
    let version = await redis.get('LOL_LAST_VERSION');
    if (!version) {
      try {
        const res = await axios.get(DDragonHelper.URL_VERSION());
        version = res.data[0];
        redis.set('LOL_LAST_VERSION', version, 60 * 60 * 4);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return version;
  }

  static async getLatestSeason(): Promise<number> {
    let season = await redis.get('LOL_LAST_SEASON_ID');
    if (!season) {
      try {
        const version = await DDragonHelper.getLatestVersion();
        const patchDataPath = path.join(DDragonHelper.buildStoragePath(version), 'patch.json');
        const jsonData = JSON.parse(fs.readFileSync(patchDataPath, { encoding: 'utf8' }));
        const patchData = jsonData.patches;

        const utcNow = new Date(new Date().toUTCString()).getTime();
        while (patchData.length) {
          const last = patchData.pop();
          if (last.start < utcNow) {
            season = last.season;
            break;
          }
        }
        redis.set('LOL_LAST_SEASON_ID', season, 43200);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Number(season);
  }

  static getChampionData(version: string, championKey: number, championId: string) {
    const key = championKey.toString();
    const value = DDragonHelper.staticChampionDataCache.get(version, key);
    if (value) {
      return Promise.resolve(value);
    } else {
      return getStaticData(version, `champion-${championKey}`)
        .then((champion: IChampionDataDragon) => {
          const championData = champion.data[championId];
          DDragonHelper.staticChampionDataCache.set(version, championData, key);
          return championData;
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }
  }

  static getChampionNameList(version: string) {
    return getStaticData(version, 'champion_all')
      .then((data) => {
        let result: { [id: string]: string } = {};
        for (const key in data.data) {
          const value = data.data[key];
          result[value.key] = key;
        }

        return result;
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }

  static getItemList(version: string) {
    return getStaticData(version, 'item_all')
      .then((data) => {
        return data.data;
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }

  static getItemData(version: string, itemKey: number) {
    const key = itemKey.toString();
    const value = DDragonHelper.staticItemDataCache.get(version, key);
    if (value) {
      return Promise.resolve(value);
    } else {
      return getStaticData(version, 'item_all')
        .then((items) => {
          items = items.data;
          DDragonHelper.staticItemDataCache.set(version, items[key], key);
          return <IItemDataDragon>items[key];
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }
  }

  static getSummonerSpellList(version: string) {
    return getStaticData(version, 'spell_all')
      .then((spells) => {
        return spells.data;
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }

  static getSummonerSpellData(version: string, spellId: string) {
    const value = DDragonHelper.staticSpellDataCache.get(version, spellId);
    if (value) {
      return Promise.resolve(value);
    } else {
      return getStaticData(version, 'spell_all')
        .then((spells) => {
          spells = spells.data;
          DDragonHelper.staticSpellDataCache.set(version, spells[spellId], spellId);
          return <ISpellDataDragon>spells[spellId];
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }
  }

  static getPerkAllData(version: string) {
    const value = DDragonHelper.staticPerkDataCache.get(version);
    if (value) {
      return Promise.resolve(value);
    } else {
      return getStaticData(version, 'perk_all')
        .then((data) => {
          DDragonHelper.staticPerkDataCache.set(version, data);
          return <IPerkDataDragon[]>data;
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }
  }
}

function getStaticData(version: string, type: string) {
  return DDragonHelper.downloadStaticDataByVersion(version)
    .then(() => {
      const filePath = path.join(DDragonHelper.buildStoragePath(version), `${type}.json`);
      let content = '';
      try {
        content = fs.readFileSync(filePath, { encoding: 'utf8' });
      } catch (err) {
        return Promise.reject(err);
      }

      return JSON.parse(content);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

function downloadStaticDataFiles(version: string, dest: string) {
  const infos: {
    downloadUrl: string;
    downloadFileName: string;
    callback?: (
      downloadPath: string,
      data: any,
      done: () => void,
      fail: (err: any) => void
    ) => void;
  }[] = [
    {
      downloadFileName: 'champion_all.json',
      downloadUrl: DDragonHelper.URL_STATIC_CHAMPIONS_DATA(version),
      callback: async (downloadPath, data, done, fail) => {
        for (const key in data.data) {
          const value = data.data[key];
          const championDataPath = path.resolve(
            downloadPath,
            `champion-${value.key.toString()}.json`
          );
          if (!fs.existsSync(championDataPath)) {
            const url = DDragonHelper.URL_STATIC_CHAMPION_DATA(version, key);
            try {
              const response = await axios.get(url);
              fs.writeFileSync(championDataPath, JSON.stringify(response.data));
              console.log(`[${championDataPath}] Written.`);
            } catch (error) {
              fail(error);
              return;
            }
          }
        }

        done();
      },
    },
    {
      downloadFileName: 'item_all.json',
      downloadUrl: DDragonHelper.URL_STATIC_ITEMS_DATA(version),
    },
    {
      downloadFileName: 'spell_all.json',
      downloadUrl: DDragonHelper.URL_STATIC_SPELLS_DATA(version),
    },
    {
      downloadFileName: 'perk_all.json',
      downloadUrl: DDragonHelper.URL_STATIC_PERKS_DATA(version),
    },
    {
      downloadFileName: 'patch.json',
      downloadUrl: DDragonHelper.URL_PATCH_DATA(),
    },
  ];

  const downloadPromises = infos.map((info) => {
    const downloadFilePath = path.resolve(dest, info.downloadFileName);
    const downloadFolderPath = path.dirname(downloadFilePath);
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(downloadFolderPath)) {
        fs.mkdirSync(downloadFolderPath, { recursive: true });
      }

      if (!fs.existsSync(downloadFilePath)) {
        axios
          .get(info.downloadUrl)
          .then((response) => {
            fs.writeFileSync(downloadFilePath, JSON.stringify(response.data));
            console.log(`[${info.downloadFileName}] Written.`);

            if (info.callback) {
              info.callback(downloadFolderPath, response.data, resolve, reject);
            } else {
              resolve();
            }
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        const content = fs.readFileSync(downloadFilePath, { encoding: 'utf8' });
        if (info.callback) {
          info.callback(downloadFolderPath, JSON.parse(content).data, resolve, reject);
        } else {
          resolve();
        }
      }
    });
  });

  return Promise.all(downloadPromises);
}
