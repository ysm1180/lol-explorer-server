export interface IGameClientData {
  gameDuration: number;
  mapId: number;
  requester: {
    teamId: number;
    isWin: boolean;
    participantId: number;
  };
  teams: { [id: string]: IGameTeamClientData };
}

export interface IGameTeamClientData {
  teamId: number;
  isWin: boolean;
  firstBlood: boolean;
  towerKills: number;
  baronKills: number;
  dragonKills: number;
  participants: { [id: string]: IGameParticipantClientData };
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
}

export interface IGamePlayerClientData {
  platformId: string;
  accountId: string;
  summonerName: string;
  summonerId: string;
  profileIcon: number;
}

export interface IGameParticipantClientData {
  player: IGamePlayerClientData;
  participantId: number;
  teamId: number;
  championId: number;
  spells: number[];
  items: number[];
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    doubleKills: number;
    tripleKills: number;
    quadraKills: number;
    pentaKills: number;
    totalDamageDealt: number;
    trueDamageDealt: number;
    totalDamageDealtToChampions: number;
    trueDamageDealtToChampions: number;
    totalHeal: number;
    visionScore: number;
    totalDamageTaken: number;
    trueDamageTaken: number;
    goldEarned: number;
    turretKills: number;
    totalMinionsKilled: number;
    neutralMinionsKilled: number;
    neutralMinionsKilledTeamJungle: number;
    neutralMinionsKilledEnemyJungle: number;
    champLevel: number;
    firstBloodKill: boolean;
    firstTowerKill: boolean;
    perkPrimaryStyle: number;
    perkSubStyle: number;
    perks: number[];
    statPerks: number[];
  };
  timeline: {
    participantId: number;
    role: string;
    lane: string;
  };
}
