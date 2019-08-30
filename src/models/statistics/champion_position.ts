import { Document, model, Schema } from 'mongoose';
import { POSITION } from '../../lib/demacia/constants';

export interface IStatisticsChampionPositionModel extends Document {
  championKey: number;
  position: POSITION;
  count: number;
  win: number;
  gameVersion: string;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageDamageTaken: number;
  averageGoldEarned: number;
  averageKillPercent: number;
  averageTimeCCingOthers: number;
  averageTimeCrowdControlDealt: number;
  averageNeutralMinionsKilled: number;
  averageNeutralMinionsKilledTeamJungle: number;
  averageNeutralMinionsKilledEnemyJungle: number;
  averageDamageSelfMitigated: number;
  averageTrueDamageDealtToChampions: number;
  averageMagicDamageDealtToChampions: number;
  averagePhysicalDamageDealtToChampions: number;
  averageHeal: number;
  averageUnitsHealed: number;
}

var statisticsChampionPositionSchema = new Schema({
  championKey: Number,
  position: Number,
  count: Number,
  win: Number,
  gameVersion: String,
  averageKills: Number,
  averageDeaths: Number,
  averageAssists: Number,
  averageDamageTaken: Number,
  averageGoldEarned: Number,
  averageKillPercent: Number,
  averageTimeCCingOthers: Number,
  averageTimeCrowdControlDealt: Number,
  averageNeutralMinionsKilled: Number,
  averageNeutralMinionsKilledTeamJungle: Number,
  averageNeutralMinionsKilledEnemyJungle: Number,
  averageDamageSelfMitigated: Number,
  averageTrueDamageDealtToChampions: Number,
  averageMagicDamageDealtToChampions: Number,
  averagePhysicalDamageDealtToChampions: Number,
  averageHeal: Number,
  averageUnitsHealed: Number,
});

export default model<IStatisticsChampionPositionModel>(
  'statistics_champion_position',
  statisticsChampionPositionSchema
);
