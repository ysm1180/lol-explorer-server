import * as fs from 'fs';
import * as path from 'path';
import { ReadStrorage } from './storage';
import { ISpellDataDragon } from '../types/spell';

class SpellReadStrorage extends ReadStrorage {
  public get(dataFolderPath: string, version: string, spellId: string): ISpellDataDragon {
    const value = this.getCache(version, spellId);
    if (value !== null) {
      return value;
    }

    const allSpellDataFile = path.join(dataFolderPath, 'spell_all.json');
    const allData = JSON.parse(fs.readFileSync(allSpellDataFile, { encoding: 'utf8' }));
    const data = allData.data[spellId];
    this.setCache(version, data, spellId);
    return data;
  }
}

export default new SpellReadStrorage();
