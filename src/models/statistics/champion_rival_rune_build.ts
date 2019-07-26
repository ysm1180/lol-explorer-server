import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalRuneBuildModel extends Document {
  championKey: number;
  rivalChampionKey: number;
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

var statisticsChampionRivalRuneBuildSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
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

export default model<IStatisticsChampionRivalRuneBuildModel>(
  'statistics_champion_rival_rune_build',
  statisticsChampionRivalRuneBuildSchema
);
