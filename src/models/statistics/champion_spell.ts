import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionSpellModel extends Document {
  championKey: number;
  position: POSITION;
  tier: string;
  count: number;
  win: number;
  gameVersion: string;
  spells: number[];
}

var statisticsChampionSpellSchema = new Schema({
  championKey: Number,
  position: Number,
  tier: String,
  count: Number,
  win: Number,
  gameVersion: String,
  spells: [Number],
});

export default model<IStatisticsChampionSpellModel>(
  'statistics_champion_spell',
  statisticsChampionSpellSchema
);
