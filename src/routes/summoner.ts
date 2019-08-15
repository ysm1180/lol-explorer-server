import * as express from 'express';
import * as lodash from 'lodash';
import demacia from '../common/demacia';
import { GAME_QUEUE_ID, LEAGUE_QUEUE_TYPE, MAP_ID } from '../lib/demacia/constants';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import { IMatchApiData } from '../lib/demacia/models';
import Game from '../models/game';
import GameChampion, { IGameChampionModel } from '../models/game-champion';
import GameTimeline from '../models/game-timeline';
import Match from '../models/match';
import Summoner from '../models/summoner';
import { updateChampionAnalysisByGame } from '../models/util/game';
import * as league from '../models/util/league';
import { getMatchListExactly, getMatchListRecentlyAll, getUnrankedMatchListToBeInserted } from '../models/util/match';
import { IGameClientData, IGameParticipantClientData, IGamePlayerClientData, IGameTeamClientData } from './models/game';
import { IRiftGamesChampionClinetData, IRiftSummonerChampionClinetData } from './models/rift-champion';

const router = express.Router();

router.get('/:name', async function(req, res, next) {
  try {
    let summoner = await Summoner.findOne({
      name: req.params.name,
    });
    const lastSeason = await DDragonHelper.getLatestSeason();
    const version = await DDragonHelper.getLatestVersion();
    if (!summoner) {
      let summonerData = await demacia.getSummonerByName(req.params.name);

      // Check change nickname
      summoner = await Summoner.findOne({ id: summonerData.id });
      if (!summoner) {
        summoner = new Summoner(summonerData);
      }
      summoner.name = req.params.name;
      summoner.save();
    }

    const seasons = await league.getOrCreateLeagueData(summoner.id, lastSeason);
    res.json({
      ...summoner.toObject(),
      seasons,
      iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summoner.profileIconId),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/byAccount/:accountId', async function(req, res, next) {
  try {
    let summoner = await Summoner.findOne({
      accountId: req.params.accountId,
    });
    const lastSeason = await DDragonHelper.getLatestSeason();
    const version = await DDragonHelper.getLatestVersion();
    if (!summoner) {
      let summonerData = await demacia.getSummonerByAccountId(req.params.accountId);
      summoner = new Summoner(summonerData);
      summoner.save();
    }

    const seasons = await league.getOrCreateLeagueData(summoner.id, lastSeason);
    res.json({
      ...summoner.toObject(),
      seasons,
      iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summoner.profileIconId),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:name', async function(req, res, next) {
  try {
    let summoner = await Summoner.findOne({
      name: req.params.name,
    });

    if (summoner) {
      const now = new Date(Date.now());
      summoner.updatedTs.setSeconds(summoner.updatedTs.getSeconds() + 120);
      if (now < summoner.updatedTs) {
        const diffSeconds = Math.floor((summoner.updatedTs.getTime() - now.getTime()) / 1000);
        res
          .status(429)
          .json({ message: `Please retry after ${diffSeconds} seconds`, seconds: diffSeconds });
        return;
      }
    }

    let summonerData = await demacia.getSummonerByName(req.params.name);
    summoner = await Summoner.findOne({ accountId: summonerData.accountId });
    if (!summoner) {
      summoner = new Summoner(summonerData);
    }
    summoner.name = req.params.name;
    summoner.updatedTs = new Date(Date.now());
    summoner.save();

    // Season
    const lastSeason = await DDragonHelper.getLatestSeason();
    await league.updateLeageData(summoner.id, lastSeason);

    // Match
    const insertMatchDataList = await getMatchListRecentlyAll(summoner.accountId);
    if (insertMatchDataList.length > 0) {
      await Match.collection.insertMany(insertMatchDataList);
    }

    res.json({
      success: true,
      updatedMatchCount: insertMatchDataList.length,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/matches/unranked/:accountId/:queueId/', async function(req, res, next) {
  try {
    const accountId = String(req.params.accountId);
    const queueId = Number(req.params.queueId);

    if (queueId !== 420 && queueId !== 440) {
      res.status(400).json({
        status: {
          message: 'queue should be rank.',
          status_code: 400,
        },
      });
      return;
    }

    let summoner = await Summoner.findOne({
      accountId: accountId,
    });
    if (!summoner) {
      let summonerData = await demacia.getSummonerByAccountId(accountId);
      summoner = new Summoner(summonerData);
      summoner.save();
    }
    const lastSeasonNumber = await DDragonHelper.getLatestSeason();
    const seasons = await league.getOrCreateLeagueData(summoner.id, lastSeasonNumber);
    const season = seasons.find((season) => season.queueType === LEAGUE_QUEUE_TYPE[queueId]);
    if (season) {
      res.status(400).json({
        status: {
          message: 'This api should be called for unranked tier.',
          status_code: 400,
        },
      });
      return;
    }

    const items = (await Match.find({
      summonerAccountId: accountId,
      queue: queueId,
      season: lastSeasonNumber,
    }).lean()) as IMatchApiData[];

    if (items.length > 10) {
      res.status(400).json({
        status: {
          message: 'This api should be called for unranked tier.',
          status_code: 400,
        },
      });
      return;
    }

    let matchList = items;
    const matchListData = await getUnrankedMatchListToBeInserted(
      accountId,
      lastSeasonNumber,
      queueId
    );
    if (matchListData.length > 0) {
      await Match.collection.insertMany(matchListData);
      matchList.push(...matchListData);
    }

    if (matchList.length > 0) {
      const promises = [];
      for (let i = 0; i < matchList.length; i++) {
        const gameId = matchList[i].gameId;

        promises.push(
          GameTimeline.findOne({ gameId }).then(async (timeline) => {
            if (!timeline) {
              const timelineData = await demacia.getMatchTimelineByGameId(gameId);
              timeline = new GameTimeline({ ...timelineData, gameId });
              timeline.save();
            }

            return Game.find({ gameId: Number(gameId) })
              .limit(1)
              .then(async (games) => {
                if (games.length === 0) {
                  const data = await demacia.getMatchInfoByGameId(gameId);
                  const game = new Game(data);
                  game.save();

                  updateChampionAnalysisByGame(game, timeline!);

                  return game;
                } else {
                  return games[0];
                }
              });
          })
        );
      }

      const gameModels = await Promise.all(promises);

      const result: Object[] = [];
      matchList.forEach((match, idx) => {
        const data = { ...match };
        const gameClientData: IGameClientData = {
          gameDuration: 0,
          mapId: 0,
          requester: { isWin: false, teamId: 0, participantId: 0 },
          teams: {},
        };
        const originalGameData = gameModels[idx];

        gameClientData.gameDuration = originalGameData.gameDuration;
        gameClientData.mapId = originalGameData.mapId;
        originalGameData.teams.forEach((team) => {
          const data: IGameTeamClientData = {} as any;

          data.isWin = team.win === 'Win' ? true : false;
          data.teamId = team.teamId;
          data.towerKills = team.towerKills;
          data.dragonKills = team.dragonKills;
          data.baronKills = team.baronKills;
          data.firstBlood = team.firstBlood;
          data.participants = {};
          data.totalKills = 0;
          data.totalDeaths = 0;
          data.totalAssists = 0;

          gameClientData.teams[data.teamId] = data;
        });

        const playerInfoList: { [id: string]: IGamePlayerClientData } = {};
        originalGameData.participantIdentities.forEach((participantIdentity) => {
          const player: IGamePlayerClientData = {} as any;

          const {
            accountId,
            summonerId,
            summonerName,
            profileIcon,
            platformId,
          } = participantIdentity.player;
          player.accountId = accountId;
          player.summonerId = summonerId;
          player.summonerName = summonerName;
          player.platformId = platformId;
          player.profileIcon = profileIcon;

          playerInfoList[participantIdentity.participantId] = player;

          if (accountId === req.params.accountId) {
            gameClientData.requester.participantId = participantIdentity.participantId;
          }
        });

        originalGameData.participants.forEach((participant) => {
          const participantClinetData: IGameParticipantClientData = {} as any;

          const { item0, item1, item2, item3, item4, item5, item6 } = participant.stats;
          const { spell1Id, spell2Id } = participant;
          participantClinetData.player = playerInfoList[participant.participantId];
          participantClinetData.teamId = participant.teamId;
          participantClinetData.championId = participant.championId;
          participantClinetData.items = [item0, item1, item2, item3, item4, item5, item6];
          participantClinetData.spells = [spell1Id, spell2Id];
          participantClinetData.stats = {} as any;

          const {
            kills,
            deaths,
            assists,
            doubleKills,
            tripleKills,
            quadraKills,
            pentaKills,
            totalDamageDealt,
            trueDamageDealt,
            totalDamageDealtToChampions,
            trueDamageDealtToChampions,
            totalHeal,
            visionScore,
            totalDamageTaken,
            trueDamageTaken,
            goldEarned,
            turretKills,
            totalMinionsKilled,
            neutralMinionsKilled,
            neutralMinionsKilledTeamJungle,
            neutralMinionsKilledEnemyJungle,
            champLevel,
            firstBloodKill,
            firstTowerKill,
            perkPrimaryStyle,
            perkSubStyle,
            perk0,
            perk1,
            perk2,
            perk3,
            perk4,
            perk5,
            statPerk0,
            statPerk1,
            statPerk2,
          } = participant.stats;
          participantClinetData.stats.kills = kills;
          participantClinetData.stats.deaths = deaths;
          participantClinetData.stats.assists = assists;
          participantClinetData.stats.doubleKills = doubleKills;
          participantClinetData.stats.tripleKills = tripleKills;
          participantClinetData.stats.quadraKills = quadraKills;
          participantClinetData.stats.pentaKills = pentaKills;
          participantClinetData.stats.totalDamageDealt = totalDamageDealt;
          participantClinetData.stats.trueDamageDealt = trueDamageDealt;
          participantClinetData.stats.totalDamageDealtToChampions = totalDamageDealtToChampions;
          participantClinetData.stats.trueDamageDealtToChampions = trueDamageDealtToChampions;
          participantClinetData.stats.totalHeal = totalHeal;
          participantClinetData.stats.visionScore = visionScore;
          participantClinetData.stats.totalDamageTaken = totalDamageTaken;
          participantClinetData.stats.trueDamageTaken = trueDamageTaken;
          participantClinetData.stats.goldEarned = goldEarned;
          participantClinetData.stats.turretKills = turretKills;
          participantClinetData.stats.totalMinionsKilled = totalMinionsKilled;
          participantClinetData.stats.neutralMinionsKilled = neutralMinionsKilled;
          participantClinetData.stats.neutralMinionsKilledTeamJungle = neutralMinionsKilledTeamJungle;
          participantClinetData.stats.neutralMinionsKilledEnemyJungle = neutralMinionsKilledEnemyJungle;
          participantClinetData.stats.champLevel = champLevel;
          participantClinetData.stats.firstBloodKill = firstBloodKill;
          participantClinetData.stats.firstTowerKill = firstTowerKill;
          participantClinetData.stats.perkPrimaryStyle = perkPrimaryStyle;
          participantClinetData.stats.perkSubStyle = perkSubStyle;
          participantClinetData.stats.perks = [perk0, perk1, perk2, perk3, perk4, perk5];
          participantClinetData.stats.statPerks = [statPerk0, statPerk1, statPerk2];
          participantClinetData.timeline = participant.timeline;

          const team = gameClientData.teams[participant.teamId];
          team.participants[participant.participantId] = participantClinetData;
          team.totalKills += kills;
          team.totalDeaths += deaths;
          team.totalAssists += assists;

          if (participant.participantId == gameClientData.requester.participantId) {
            gameClientData.requester.teamId = participant.teamId;
            gameClientData.requester.isWin = team.isWin;
          }
        });

        result.push({ ...data, gameInfo: gameClientData });
      });

      res.json(result);
    } else {
      res.json([]);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/matches/:accountId/:start/:count', async function(req, res, next) {
  try {
    const start = Number(req.params.start);
    const count = Number(req.params.count);

    if (count < 1) {
      res.status(400).json({
        status: {
          message: 'Cannot get less than 1.',
          status_code: 400,
        },
      });
      return;
    }

    if (count > 100) {
      res.status(400).json({
        status: {
          message: 'Cannot get more than 100.',
          status_code: 400,
        },
      });
      return;
    }

    const items = (await Match.find({
      summonerAccountId: req.params.accountId,
    })
      .sort({ timestamp: -1 })
      .skip(start)
      .limit(count)
      .lean()) as IMatchApiData[];

    let matchList = items;

    if (items.length === 0) {
      const docsCount = await Match.countDocuments();
      let timestamp = -1;
      if (docsCount !== 0 && start > 0) {
        const maxTimestampRows = await Match.aggregate([
          {
            $match: {
              summonerAccountId: req.params.accountId,
            },
          },
          {
            $sort: {
              timestamp: -1,
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              timestamp: 1,
            },
          },
        ]);
        if (maxTimestampRows.length === 0) {
          res.status(404).json({
            status: {
              message: 'Not matched max timestamp.',
              status_code: 404,
            },
          });
          return;
        }

        timestamp = maxTimestampRows[0].timestamp;
      }

      const insertMatchDataList = await getMatchListExactly(
        req.params.accountId,
        start,
        100,
        timestamp
      );
      if (insertMatchDataList.length > 0) {
        const docs = await Match.collection.insertMany(insertMatchDataList);
        matchList = docs.ops;
        matchList = matchList.slice(0, count);
      }
    } else if (items.length < count) {
      const maxTimestampRows = await Match.aggregate([
        {
          $match: {
            summonerAccountId: req.params.accountId,
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            timestamp: 1,
          },
        },
      ]);
      if (maxTimestampRows.length === 0) {
        res.status(404).json({
          status: {
            message: 'Not matched max timestamp.',
            status_code: 404,
          },
        });
        return;
      }

      const maxTimestamp = maxTimestampRows[0].timestamp;
      const insertMatchDataList = await getMatchListExactly(
        req.params.accountId,
        start,
        count - items.length,
        maxTimestamp
      );
      if (insertMatchDataList.length > 0) {
        const docs = await Match.collection.insertMany(insertMatchDataList);
        matchList.push(...docs.ops);
      }
    } else if (items.length > count) {
      res.status(400).json({
        status: {
          message: 'Bad match list count.',
          status_code: 400,
        },
      });
      return;
    }

    if (matchList.length > 0) {
      const promises = [];
      for (let i = 0; i < matchList.length; i++) {
        const gameId = matchList[i].gameId;

        promises.push(
          GameTimeline.findOne({ gameId }).then(async (timeline) => {
            if (!timeline) {
              const timelineData = await demacia.getMatchTimelineByGameId(gameId);
              timeline = new GameTimeline({ ...timelineData, gameId });
              timeline.save();
            }

            return Game.find({ gameId: Number(gameId) })
              .limit(1)
              .then(async (games) => {
                if (games.length === 0) {
                  const data = await demacia.getMatchInfoByGameId(gameId);
                  const game = new Game(data);
                  game.save();

                  updateChampionAnalysisByGame(game, timeline!);

                  return game;
                } else {
                  return games[0];
                }
              });
          })
        );
      }
      const gameModels = await Promise.all(promises);

      const result: Object[] = [];
      matchList.forEach((match, idx) => {
        const data = { ...match };
        const gameClientData: IGameClientData = {
          gameDuration: 0,
          mapId: 0,
          requester: { isWin: false, teamId: 0, participantId: 0 },
          teams: {},
        };
        const originalGameData = gameModels[idx];

        gameClientData.gameDuration = originalGameData.gameDuration;
        gameClientData.mapId = originalGameData.mapId;
        originalGameData.teams.forEach((team) => {
          const data: IGameTeamClientData = {} as any;

          data.isWin = team.win === 'Win' ? true : false;
          data.teamId = team.teamId;
          data.towerKills = team.towerKills;
          data.dragonKills = team.dragonKills;
          data.baronKills = team.baronKills;
          data.firstBlood = team.firstBlood;
          data.participants = {};
          data.totalKills = 0;
          data.totalDeaths = 0;
          data.totalAssists = 0;

          gameClientData.teams[data.teamId] = data;
        });

        const playerInfoList: { [id: string]: IGamePlayerClientData } = {};
        originalGameData.participantIdentities.forEach((participantIdentity) => {
          const player: IGamePlayerClientData = {} as any;

          const {
            accountId,
            summonerId,
            summonerName,
            profileIcon,
            platformId,
          } = participantIdentity.player;
          player.accountId = accountId;
          player.summonerId = summonerId;
          player.summonerName = summonerName;
          player.platformId = platformId;
          player.profileIcon = profileIcon;

          playerInfoList[participantIdentity.participantId] = player;

          if (accountId === req.params.accountId) {
            gameClientData.requester.participantId = participantIdentity.participantId;
          }
        });

        originalGameData.participants.forEach((participant) => {
          const participantClinetData: IGameParticipantClientData = {} as any;

          const { item0, item1, item2, item3, item4, item5, item6 } = participant.stats;
          const { spell1Id, spell2Id } = participant;
          participantClinetData.player = playerInfoList[participant.participantId];
          participantClinetData.teamId = participant.teamId;
          participantClinetData.championId = participant.championId;
          participantClinetData.items = [item0, item1, item2, item3, item4, item5, item6];
          participantClinetData.spells = [spell1Id, spell2Id];
          participantClinetData.stats = {} as any;

          const {
            kills,
            deaths,
            assists,
            doubleKills,
            tripleKills,
            quadraKills,
            pentaKills,
            totalDamageDealt,
            trueDamageDealt,
            totalDamageDealtToChampions,
            trueDamageDealtToChampions,
            totalHeal,
            visionScore,
            totalDamageTaken,
            trueDamageTaken,
            goldEarned,
            turretKills,
            totalMinionsKilled,
            neutralMinionsKilled,
            neutralMinionsKilledTeamJungle,
            neutralMinionsKilledEnemyJungle,
            champLevel,
            firstBloodKill,
            firstTowerKill,
            perkPrimaryStyle,
            perkSubStyle,
            perk0,
            perk1,
            perk2,
            perk3,
            perk4,
            perk5,
            statPerk0,
            statPerk1,
            statPerk2,
          } = participant.stats;
          participantClinetData.stats.kills = kills;
          participantClinetData.stats.deaths = deaths;
          participantClinetData.stats.assists = assists;
          participantClinetData.stats.doubleKills = doubleKills;
          participantClinetData.stats.tripleKills = tripleKills;
          participantClinetData.stats.quadraKills = quadraKills;
          participantClinetData.stats.pentaKills = pentaKills;
          participantClinetData.stats.totalDamageDealt = totalDamageDealt;
          participantClinetData.stats.trueDamageDealt = trueDamageDealt;
          participantClinetData.stats.totalDamageDealtToChampions = totalDamageDealtToChampions;
          participantClinetData.stats.trueDamageDealtToChampions = trueDamageDealtToChampions;
          participantClinetData.stats.totalHeal = totalHeal;
          participantClinetData.stats.visionScore = visionScore;
          participantClinetData.stats.totalDamageTaken = totalDamageTaken;
          participantClinetData.stats.trueDamageTaken = trueDamageTaken;
          participantClinetData.stats.goldEarned = goldEarned;
          participantClinetData.stats.turretKills = turretKills;
          participantClinetData.stats.totalMinionsKilled = totalMinionsKilled;
          participantClinetData.stats.neutralMinionsKilled = neutralMinionsKilled;
          participantClinetData.stats.neutralMinionsKilledTeamJungle = neutralMinionsKilledTeamJungle;
          participantClinetData.stats.neutralMinionsKilledEnemyJungle = neutralMinionsKilledEnemyJungle;
          participantClinetData.stats.champLevel = champLevel;
          participantClinetData.stats.firstBloodKill = firstBloodKill;
          participantClinetData.stats.firstTowerKill = firstTowerKill;
          participantClinetData.stats.perkPrimaryStyle = perkPrimaryStyle;
          participantClinetData.stats.perkSubStyle = perkSubStyle;
          participantClinetData.stats.perks = [perk0, perk1, perk2, perk3, perk4, perk5];
          participantClinetData.stats.statPerks = [statPerk0, statPerk1, statPerk2];
          participantClinetData.timeline = participant.timeline;

          const team = gameClientData.teams[participant.teamId];
          team.participants[participant.participantId] = participantClinetData;
          team.totalKills += kills;
          team.totalDeaths += deaths;
          team.totalAssists += assists;

          if (participant.participantId == gameClientData.requester.participantId) {
            gameClientData.requester.teamId = participant.teamId;
            gameClientData.requester.isWin = team.isWin;
          }
        });

        result.push({ ...data, gameInfo: gameClientData });
      });

      res.json(result);
    } else {
      res.json([]);
    }
  } catch (err) {
    next(err);
  }
});

function getRiftChampionClientData(gameChampion: IGameChampionModel) {
  const champion: IRiftSummonerChampionClinetData = {} as any;
  champion.key = gameChampion.championKey;
  champion.wins = gameChampion.wins;
  champion.losses = gameChampion.losses;
  champion.averageKills = gameChampion.averageKills;
  champion.averageDeaths = gameChampion.averageDeaths;
  champion.averageAssists = gameChampion.averageAssists;
  champion.averageCS = gameChampion.averageCS;
  champion.averageEarnedGold = gameChampion.averageEarnedGold;
  champion.averageGameDuration = gameChampion.averageGameDuration;
  champion.doubleKills = gameChampion.doubleKills;
  champion.tripleKills = gameChampion.tripleKills;
  champion.quadraKills = gameChampion.quadraKills;
  champion.pentaKills = gameChampion.pentaKills;
  return champion;
}

function addRiftChampionClientData(
  _a: IRiftSummonerChampionClinetData,
  b: IRiftSummonerChampionClinetData | IGameChampionModel
) {
  const a = lodash.cloneDeep(_a);
  a.wins += b.wins;
  a.losses += b.losses;
  a.averageKills = (a.averageKills + b.averageKills) / 2;
  a.averageDeaths = (a.averageDeaths + b.averageDeaths) / 2;
  a.averageAssists = (a.averageAssists + b.averageAssists) / 2;
  a.averageCS = (a.averageCS + b.averageCS) / 2;
  a.averageEarnedGold = (a.averageEarnedGold + b.averageEarnedGold) / 2;
  a.averageGameDuration = (a.averageGameDuration + b.averageGameDuration) / 2;
  a.doubleKills += b.doubleKills;
  a.tripleKills += b.tripleKills;
  a.quadraKills += b.quadraKills;
  a.pentaKills += b.pentaKills;
  return a;
}

router.get('/rift/champions/:accountId', async function(req, res, next) {
  try {
    const accountId = req.params.accountId;
    const seasonId = await DDragonHelper.getLatestSeason();

    const gameChampions = await GameChampion.find({
      summonerAccountId: accountId,
      seasonId,
      mapId: MAP_ID.SUMMONER_RIFT,
    });

    const result: {
      totalGames: number;
      soloGames: number;
      flexGames: number;
      champions: { [id: string]: IRiftGamesChampionClinetData };
    } = {
      totalGames: 0,
      soloGames: 0,
      flexGames: 0,
      champions: {} as any,
    };
    for (let i = 0; i < gameChampions.length; i++) {
      const gameChampion = gameChampions[i];

      if (result.champions[gameChampion.championKey]) {
        if (
          gameChampion.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK ||
          gameChampion.queueId === GAME_QUEUE_ID.RIFT_FLEX_RANK
        ) {
          const champions = result.champions[gameChampion.championKey];
          champions.total = addRiftChampionClientData(champions.total, gameChampion);
          if (gameChampion.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK) {
            if (champions.solo) {
              champions.solo = addRiftChampionClientData(champions.solo, gameChampion);
            } else {
              champions.solo = getRiftChampionClientData(gameChampion);
            }
          } else {
            if (champions.flex) {
              champions.flex = addRiftChampionClientData(champions.flex, gameChampion);
            } else {
              champions.flex = getRiftChampionClientData(gameChampion);
            }
          }
        }
      } else {
        const champion = getRiftChampionClientData(gameChampion);

        if (
          gameChampion.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK ||
          gameChampion.queueId === GAME_QUEUE_ID.RIFT_FLEX_RANK
        ) {
          result.champions[champion.key] = {} as any;
          result.champions[champion.key].total = champion;
          if (gameChampion.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK) {
            result.champions[champion.key].solo = champion;
          } else {
            result.champions[champion.key].flex = champion;
          }
        }
      }
    }

    const soloMatchList = await Match.find({
      summonerAccountId: req.params.accountId,
      season: seasonId,
      queue: GAME_QUEUE_ID.RIFT_SOLO_RANK,
    });
    const flexMatchList = await Match.find({
      summonerAccountId: req.params.accountId,
      season: seasonId,
      queue: GAME_QUEUE_ID.RIFT_FLEX_RANK,
    });
    const soloRankGameIds = soloMatchList.map((match) => match.gameId);
    const flexRankGameIds = flexMatchList.map((match) => match.gameId);
    const soloSavedGames = await Game.find().in('gameId', soloRankGameIds);
    const flexSavedGames = await Game.find().in('gameId', flexRankGameIds);

    result.totalGames = soloSavedGames.length + flexSavedGames.length;
    result.soloGames = soloSavedGames.length;
    result.flexGames = flexSavedGames.length;

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
