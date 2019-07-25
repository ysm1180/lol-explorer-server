import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionPositionModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
}

var statisticsChampionPositionSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
});

export default model<IStatisticsChampionPositionModel>(
  'statistics_champion_position',
  statisticsChampionPositionSchema
);
