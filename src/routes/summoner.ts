import * as express from 'express';
import demacia from '../common/demacia';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import Game, { IGameModel } from '../models/game';
import Match from '../models/match';
import Summoner from '../models/summoner';
import * as league from '../models/util/league';
import {
  IGameClientData,
  IGameParticipantClientData,
  IGamePlayerClientData,
  IGameTeamClientData,
} from './models/game';

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
      const summoners = await Summoner.find({ id: summonerData.id }).limit(1);
      if (summoners.length === 0) {
        summoner = new Summoner(summonerData);
      } else {
        summoner = summoners[0];
        summoner.name = req.params.name;
      }
      summoner.save();

      const matchData = await demacia.getMatchListByAccountId(summonerData.accountId);
      const matchList = matchData.matches;
      for (var i = 0; i < matchList.length; i++) {
        matchList[i].summonerAccountId = summonerData.accountId;
      }
      await Match.collection.insertMany(matchList);

      const seasons = await league.getOrCreateLeagueData(summoner.id, lastSeason);
      res.json({
        ...summoner.toObject(),
        seasons,
        iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summonerData.profileIconId),
      });
    } else {
      const seasons = await league.getOrCreateLeagueData(summoner.id, lastSeason);
      res.json({
        ...summoner.toObject(),
        seasons,
        iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summoner.profileIconId),
      });
    }
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
    const summoners = await Summoner.find({ id: summonerData.id }).limit(1);
    if (summoners.length === 0) {
      summoner = new Summoner(summonerData);
    } else {
      summoner = summoners[0];
      summoner.name = req.params.name;
    }
    summoner.updatedTs = new Date(Date.now());
    summoner.save();

    // Season
    const lastSeason = await DDragonHelper.getLatestSeason();
    await league.updateLeageData(summoner.id, lastSeason);

    // Match
    const data = await demacia.getMatchListByAccountId(summoner.accountId);
    const matchListData = data.matches;
    const insertMatchDataList = [];
    for (let i = 0; i < matchListData.length; i++) {
      const matchData = await Match.find({
        summonerAccountId: summoner.accountId,
        gameId: matchListData[i].gameId,
      }).limit(1);

      if (matchData.length === 0) {
        insertMatchDataList.push(matchListData[i]);
      }
    }
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

router.post('/matches/:accountId', async function(req, res, next) {
  try {
    const data = await demacia.getMatchListByAccountId(req.params.accountId);
    const matchListData = data.matches;
    for (var i = 0; i < matchListData.length; i++) {
      matchListData[i].summonerAccountId = req.params.accountId;
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
      res.status(400).json({ message: 'Cannot get less than 1.' });
      return;
    }

    if (count > 100) {
      res.status(400).json({ message: 'Cannot get more than 100.' });
      return;
    }

    const items = await Match.find({
      summonerAccountId: req.params.accountId,
    })
      .sort({ timestamp: -1 })
      .skip(start)
      .limit(count);

    let matchList = items.map((item) => item.toObject());

    if (items.length === 0) {
      // First call
      const data = await demacia.getMatchListByAccountId(req.params.accountId);
      const matchListData = data.matches;
      for (var i = 0; i < matchListData.length; i++) {
        matchListData[i].summonerAccountId = req.params.accountId;
      }
      const docs = await Match.collection.insertMany(matchListData);
      matchList = docs.ops;
      matchList = matchList.slice(start, start + count).map((item) => item.toObject());
    }

    if (matchList.length > 0) {
      const gameModels: IGameModel[] = [];
      for (let i = 0; i < matchList.length; i++) {
        const gameId = matchList[i].gameId;
        const games = await Game.find({ gameId: Number(gameId) }).limit(1);
        if (games.length === 0) {
          const data = await demacia.getMatchInfoByGameId(gameId);
          const game = new Game(data);
          game.save();
          gameModels.push(game);
        } else {
          gameModels.push(games[0]);
        }
      }

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

export default router;
