import * as fs from 'fs';
import * as path from 'path';
import { IPerkDataDragon } from '../types/perk';
import { ReadStrorage } from './storage';

class PerkReadStrorage extends ReadStrorage {
  public get(dataFolderPath: string, version: string): IPerkDataDragon[] {
    const value = this.getCache(version);
    if (value !== null) {
      return value;
    }

    const allPerkDataFile = path.join(dataFolderPath, 'perk_all.json');
    const allData = JSON.parse(fs.readFileSync(allPerkDataFile, { encoding: 'utf8' }));
    this.setCache(version, allData);
    return allData;
  }
}

export default new PerkReadStrorage();
