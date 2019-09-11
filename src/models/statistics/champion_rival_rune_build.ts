import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalRuneBuildModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  mainRuneStyle: number;
  mainRune1: number;
  mainRune2: number;
  mainRune3: number;
  mainRune4: number;
  subRuneStyle: number;
  subRune1: number;
  subRune2: number;
  statRune1: number;
  statRune2: number;
  statRune3: number;
}

var statisticsChampionRivalRuneBuildSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  mainRuneStyle: Number,
  mainRune1: Number,
  mainRune2: Number,
  mainRune3: Number,
  mainRune4: Number,
  subRuneStyle: Number,
  subRune1: Number,
  subRune2: Number,
  statRune1: Number,
  statRune2: Number,
  statRune3: Number,
});

export default model<IStatisticsChampionRivalRuneBuildModel>(
  'statistics_champion_rival_rune_build',
  statisticsChampionRivalRuneBuildSchema
);
