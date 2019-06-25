import * as express from 'express';
import * as lodash from 'lodash';
import demacia from '../common/demacia';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import Game, { IGameModel } from '../models/game';
import Match from '../models/match';
import Summoner from '../models/summoner';
import * as league from '../models/util/league';

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
        res.status(429).json({ message: `Please retry after ${diffSeconds} seconds` });
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

    const lastSeason = await DDragonHelper.getLatestSeason();
    const seasons = await league.updateLeageData(summoner.id, lastSeason);
    const version = await DDragonHelper.getLatestVersion();

    res.json({
      ...summoner.toObject(),
      seasons,
      iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summoner.profileIconId),
    });
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
      const data = await demacia.getMatchListByAccountId(req.params.accountId);
      let matchListData = data.matches;
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
        const gameClientData = lodash.cloneDeep(gameModels[idx]);
        gameClientData.participants.forEach((participant) => {
          const { item0, item1, item2, item3, item4, item5, item6 } = participant.stats;
          participant.stats.items = [item0, item1, item2, item3, item4, item5, item6];

          delete participant.stats.item0;
          delete participant.stats.item1;
          delete participant.stats.item2;
          delete participant.stats.item3;
          delete participant.stats.item4;
          delete participant.stats.item5;
          delete participant.stats.item6;
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
