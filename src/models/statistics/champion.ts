import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IChampionStatisticsModel extends Document {
  gameId: number;
  championKey: number;
  tier: string;
  isWin: boolean;
  position: POSITION;
  teamId: number;
  participantId: number;
  timeline: any;
}

var championStatisticsSchema = new Schema({
  gameId: Number,
  championKey: Number,
  tier: String,
  isWin: Boolean,
  position: Number,
  teamId: Number,
  participantId: Number,
  stats: {
    type: 'Mixed',
  },
  timeline: {
    type: 'Mixed',
  },
  rivalData: {
    type: 'Mixed',
  },
  gameVersion: String,
});

export default model<IChampionStatisticsModel>('statistics_champion', championStatisticsSchema);
