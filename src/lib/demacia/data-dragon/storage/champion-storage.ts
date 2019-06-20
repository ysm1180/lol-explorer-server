import * as fs from 'fs';
import * as path from 'path';
import { ReadStrorage } from './storage';
import { IChampionDataDragon } from '../types/champion';

class ChampionReadStrorage extends ReadStrorage {
  public get(dataFolderPath: string, version: string, championKey: number): IChampionDataDragon {
    const value = this.getCache(version, championKey.toString());
    if (value !== null) {
      return value;
    }

    const championDataFilePath = path.join(dataFolderPath, `champion-${championKey}.json`);
    const data = JSON.parse(fs.readFileSync(championDataFilePath, { encoding: 'utf8' }));
    this.setCache(version, data, championKey.toString());
    return data;
  }
}

export default new ChampionReadStrorage();
