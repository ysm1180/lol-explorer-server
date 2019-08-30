import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionSkillSetModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  skills: number[];
}

var statisticsChampionSkillSetSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  skills: [Number],
});

export default model<IStatisticsChampionSkillSetModel>(
  'statistics_champion_skill_set',
  statisticsChampionSkillSetSchema
);
