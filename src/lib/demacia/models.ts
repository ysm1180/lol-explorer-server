export type TeamId = 100 | 200;

export interface ISummonerApiData {
  name: string;
  accountId: string;
  id: string;
  profileIconId: number;
}

export interface IMatchApiData {
  summonerAccountId?: string;
  gameId: number;
  champion: number;
  timestamp: number;
  first?: boolean;
}

export interface IGameTeamData {
  teamId: TeamId;
  win: string;
  firstBlood: boolean;
  firstTower: boolean;
  firstInhibitor: boolean;
  firstBaron: boolean;
  firstDragon: boolean;
  firstRiftHerald: boolean;
  towerKills: number;
  inhibitorKills: number;
  baronKills: number;
  dragonKills: number;
  vilemawKills: number;
  riftHeraldKills: number;
  dominionVictoryScore: number;
  bans: {
    championId: number;
    pickTurn: number;
  }[];
}

export interface IGameParticipantData {
  participantId: number;
  teamId: TeamId;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  stats: {
    participantId: number;
    win: boolean;
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
    kills: number;
    deaths: number;
    assists: number;
    largestKillingSpree: number;
    largestMultiKill: number;
    killingSprees: number;
    longestTimeSpentLiving: number;
    doubleKills: number;
    tripleKills: number;
    quadraKills: number;
    pentaKills: number;
    unrealKills: number;
    totalDamageDealt: number;
    magicDamageDealt: number;
    physicalDamageDealt: number;
    trueDamageDealt: number;
    largestCriticalStrike: number;
    totalDamageDealtToChampions: number;
    magicDamageDealtToChampions: number;
    physicalDamageDealtToChampions: number;
    trueDamageDealtToChampions: number;
    totalHeal: number;
    totalUnitsHealed: number;
    damageSelfMitigated: number;
    damageDealtToObjectives: number;
    damageDealtToTurrets: number;
    visionScore: number;
    timeCCingOthers: number;
    totalDamageTaken: number;
    magicalDamageTaken: number;
    physicalDamageTaken: number;
    trueDamageTaken: number;
    goldEarned: number;
    goldSpent: number;
    turretKills: number;
    inhibitorKills: number;
    totalMinionsKilled: number;
    neutralMinionsKilled: number;
    neutralMinionsKilledTeamJungle: number;
    neutralMinionsKilledEnemyJungle: number;
    totalTimeCrowdControlDealt: number;
    champLevel: number;
    visionWardsBoughtInGame: number;
    sightWardsBoughtInGame: number;
    wardsPlaced: number;
    wardsKilled: number;
    firstBloodKill: boolean;
    firstBloodAssist: boolean;
    firstTowerKill: boolean;
    firstTowerAssist: boolean;
    combatPlayerScore: number;
    objectivePlayerScore: number;
    totalPlayerScore: number;
    totalScoreRank: number;
    playerScore0: number;
    playerScore1: number;
    playerScore2: number;
    playerScore3: number;
    playerScore4: number;
    playerScore5: number;
    playerScore6: number;
    playerScore7: number;
    playerScore8: number;
    playerScore9: number;
    perk0: number;
    perk0Var1: number;
    perk0Var2: number;
    perk0Var3: number;
    perk1: number;
    perk1Var1: number;
    perk1Var2: number;
    perk1Var3: number;
    perk2: number;
    perk2Var1: number;
    perk2Var2: number;
    perk2Var3: number;
    perk3: number;
    perk3Var1: number;
    perk3Var2: number;
    perk3Var3: number;
    perk4: number;
    perk4Var1: number;
    perk4Var2: number;
    perk4Var3: number;
    perk5: number;
    perk5Var1: number;
    perk5Var2: number;
    perk5Var3: number;
    perkPrimaryStyle: number;
    perkSubStyle: number;
    statPerk0: number;
    statPerk1: number;
    statPerk2: number;
  };
  timeline: {
    creepsPerMinDeltas?: { [duration: string]: number };
    xpPerMinDeltas?: { [duration: string]: number };
    goldPerMinDeltas?: { [duration: string]: number };
    participantId: number;
    role: string;
    lane: 'TOP' | 'MID' | 'MIDDLE' | 'JUNGLE' | 'BOTTOM' | 'NONE';
  };
}

export interface IGameParticipantIdentity {
  participantId: number;
  player: {
    platformId: string;
    accountId: string;
    summonerName: string;
    summonerId: string;
    currentPlatformId: string;
    currentAccountId: string;
    matchHistoryUri: string;
    profileIcon: number;
  };
}

export interface IGameApiData {
  gameId: number;
  gameDuration: number;
  queueId: number;
  mapId: number;
  platformId: number;
  teams: IGameTeamData[];
  participants: IGameParticipantData[];
  participantIdentities: IGameParticipantIdentity[];
  gameVersion: string;
}

export interface IGameTimelineParticipantFrame {
  [id: string]: {
    participantId: number;
    position: { x: number; y: number };
    currentGold: number;
    totalGold: number;
    level: number;
    xp: number;
    minionsKilled: number;
    jungleMinionsKilled: number;
    dominionScore: number;
    teamScore: number;
  };
}

export interface IGameTimelineEvent {
  type:
    | 'CHAMPION_KILL'
    | 'WARD_PLACED'
    | 'WARD_KILL'
    | 'BUILDING_KILL'
    | 'ELITE_MONSTER_KILL'
    | 'ITEM_PURCHASED'
    | 'ITEM_SOLD'
    | 'ITEM_DESTROYED'
    | 'ITEM_UNDO'
    | 'SKILL_LEVEL_UP'
    | 'ASCENDED_EVENT'
    | 'CAPTURE_POINT'
    | 'PORO_KING_SUMMON';
  timestamp: number;
  participantId?: number;
  skillSlot?: number;
  levelUpType?: string;
  itemId?: number;
  killerId?: number;
  victimId?: number;
  assistingParticipantIds?: number[];
  wardType?: string;
  creatorId?: number;
  afterId?: number;
  beforeId?: number;
  monsterType?: string;
  monsterSubType?: string;
  teamId?: TeamId;
  buildingType?: string;
  laneType?: string;
  towerType?: string;
}

export interface IGameTimelineFrame {
  participantFrames: IGameTimelineParticipantFrame;
  events: IGameTimelineEvent[];
  timestamp: number;
}

export interface IGameTimelineApiData {
  frames: IGameTimelineFrame[];
  frameInterval: number;
}

export interface ILeagueApiData {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
  season?: number;
  miniSeries?: Object;
}

export interface ILeagueSummonerApiData {
  tier: string;
  leagueId: string;
  queue: string;
  name: string;
  entries: {
    summonerId: string;
    summonerName: string;
    leaguePoints: number;
    rank: string;
    wins: number;
    losses: number;
    veteran: boolean;
    inactive: boolean;
    freshBlood: boolean;
    hotStreak: boolean;
    miniSeries?: Object;
  }[];
}
