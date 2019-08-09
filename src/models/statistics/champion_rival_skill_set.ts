import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalSkillSetModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  skills: number[];
}

var statisticsChampionRivalSkillSetSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  skills: [Number],
});

export default model<IStatisticsChampionRivalSkillSetModel>(
  'statistics_champion_rival_skill_set',
  statisticsChampionRivalSkillSetSchema
);
