export interface IRiftSummonerChampionClinetData {
  key: number;
  queueId: number;
  mapId: number;
  wins: number;
  losses: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageCS: number;
  averageEarnedGold: number;
  averageGameDuration: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
}

export interface IRiftGamesChampionClinetData {
  total: IRiftSummonerChampionClinetData;
  solo: IRiftSummonerChampionClinetData;
  flex: IRiftSummonerChampionClinetData;
}
