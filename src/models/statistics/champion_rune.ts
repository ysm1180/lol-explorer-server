import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRuneModel extends Document {
  championKey: number;
  position: POSITION;
  tier: string;
  count: number;
  win: number;
  gameVersion: string;
  mainRuneStyle: number;
  mainRunes: number[];
  subRuneStyle: number;
  subRunes: number[];
  statRunes: number[];
}

var statisticsChampionRuneSchema = new Schema({
  championKey: Number,
  position: Number,
  tier: String,
  count: Number,
  win: Number,
  gameVersion: String,
  mainRuneStyle: Number,
  mainRunes: [Number],
  subRuneStyle: Number,
  subRunes: [Number],
  statRunes: [Number],
});

export default model<IStatisticsChampionRuneModel>(
  'statistics_champion_rune',
  statisticsChampionRuneSchema
);
