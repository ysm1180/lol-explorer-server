import * as fs from 'fs';
import * as path from 'path';
import { ReadStrorage } from './storage';
import { IItemDataDragon } from '../types/item';

class ItemReadStrorage extends ReadStrorage {
  public get(dataFolderPath: string, version: string, itemKey: number): IItemDataDragon {
    const value = this.getCache(version, itemKey.toString());
    if (value !== null) {
      return value;
    }

    const allItemDataFile = path.join(dataFolderPath, 'item_all.json');
    const allData = JSON.parse(fs.readFileSync(allItemDataFile, { encoding: 'utf8' }));
    const data = allData.data[itemKey.toString()];
    this.setCache(version, data, itemKey.toString());
    return data;
  }
}

export default new ItemReadStrorage();
