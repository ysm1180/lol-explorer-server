import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionRivalStatModel extends Document {
  championKey: number;
  rivalChampionKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  csPerMinutes: { [duration: string]: number };
  goldPerMinutes: { [duration: string]: number };
  xpPerMinutes: { [duration: string]: number };
  averageSoloKills: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageDamageDealtToChampions: number;
  averageDamageTaken: number;
  averageGoldEarned: number;
}

var statisticsChampionRivalStatSchema = new Schema({
  championKey: Number,
  rivalChampionKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  csPerMinutes: ['Mixed'],
  goldPerMinutes: ['Mixed'],
  xpPerMinutes: ['Mixed'],
  averageSoloKills: Number,
  averageKills: Number,
  averageDeaths: Number,
  averageAssists: Number,
  averageDamageDealtToChampions: Number,
  averageDamageTaken: Number,
  averageGoldEarned: Number,
});

export default model<IStatisticsChampionRivalStatModel>(
  'statistics_champion_rival_stat',
  statisticsChampionRivalStatSchema
);
