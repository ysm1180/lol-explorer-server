import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalSpellBuildModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  spells: number[];
}

var statisticsChampionRivalSpellBuildSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  spells: [Number],
});

export default model<IStatisticsChampionRivalSpellBuildModel>(
  'statistics_champion_rival_spell_build',
  statisticsChampionRivalSpellBuildSchema
);
