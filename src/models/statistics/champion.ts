import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IChampionStatisticsModel extends Document {
  gameId: number;
  championKey: number;
  tier: string;
  isWin: boolean;
  durationMinutes: number;
  position: POSITION;
  spell1: number;
  spell2: number;
  teamId: number;
  stats: {
    mainPerkStyle: number;
    mainPerk0: number;
    mainPerk1: number;
    mainPerk2: number;
    mainPerk3: number;
    subPerkStyle: number;
    subPerk0: number;
    subPerk1: number;
    statPerk0: number;
    statPerk1: number;
    statPerk2: number;
  };
  timeline: any;
  skills: {
    skillSlot: number;
    timestamp: number;
  }[];
  items: {
    itemId: number;
    timestamp: number;
  }[];
}

var championStatisticsSchema = new Schema({
  gameId: Number,
  championKey: Number,
  tier: String,
  isWin: Boolean,
  durationMinutes: Number,
  position: Number,
  spell1: Number,
  spell2: Number,
  teamId: Number,
  stats: {
    type: ['Mixed'],
  },
  timeline: {
    type: ['Mixed'],
  },
  skills: {
    type: ['Mixed'],
  },
  items: {
    type: ['Mixed'],
  },
});

export default model<IChampionStatisticsModel>('statistics_champion', championStatisticsSchema);
