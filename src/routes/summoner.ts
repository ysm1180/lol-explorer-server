import * as express from 'express';
import * as lodash from 'lodash';
import demacia from '../common/demacia';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import Game, { IGameModel } from '../models/game';
import Match from '../models/match';
import Summoner from '../models/summoner';
import * as league from '../models/util/league';

const router = express.Router();

router.get('/:name', function(req, res, next) {
  Summoner.findOne(
    {
      name: req.params.name,
    },
    async (err, summoner) => {
      if (err) {
        next(err);
      }

      const lastSeason = await DDragonHelper.getLastestSeason();
      const version = await DDragonHelper.getLastestVersion();
      if (!summoner) {
        demacia
          .getSummonerByName(req.params.name)
          .then(async (summonerData) => {
            try {
              const summoners = await Summoner.find({ id: summonerData.id }).limit(1);
              if (summoners.length === 0) {
                summoner = new Summoner(summonerData);
              } else {
                summoner = summoners[0];
                summoner.name = req.params.name;
              }
              summoner.save();
            } catch (err) {
              throw new Error(err);
            }

            return league.getOrCreateLeagueData(summoner.id, lastSeason).then((seasons) => {
              if (summoner) {
                return { ...summoner.toObject(), seasons };
              }
            });
          })
          .then(async (summonerData) => {
            const matchData = await demacia.getMatchListByAccountId(summonerData.accountId);
            const matchList = matchData.matches;
            for (var i = 0; i < matchList.length; i++) {
              matchList[i].summonerAccountId = summonerData.accountId;
            }
            await Match.collection.insertMany(matchList);

            return summonerData;
          })
          .then((summonerData) => {
            res.json({
              ...summonerData,
              iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summonerData.profileIconId),
            });
          })
          .catch((err) => {
            res.status(err.response.status).json({ error: err.response.data });
          });
      } else {
        league.getOrCreateLeagueData(summoner.id, lastSeason).then((seasons) => {
          summoner &&
            res.json({
              ...summoner.toObject(),
              seasons,
              iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summoner.profileIconId),
            });
        });
      }
    }
  );
});

router.get('/matches/:accountId/:start/:count', function(req, res, next) {
  const start = Number(req.params.start);
  const count = Number(req.params.count);

  if (start + count > 100) {
    res.status(400).json({ message: 'Cannot get more than 100.' });
    return;
  }

  Match.find({
    summonerAccountId: req.params.accountId,
  })
    .sort({ timestamp: -1 })
    .skip(start)
    .limit(count)
    .then(async (items) => {
      let matchList = items.map((item) => item.toObject());
      if (items.length === 0) {
        try {
          const data = await demacia.getMatchListByAccountId(req.params.accountId);
          let matchListData = data.matches;
          for (var i = 0; i < matchListData.length; i++) {
            matchListData[i].summonerAccountId = req.params.accountId;
          }
          const docs = await Match.collection.insertMany(matchListData);
          matchList = docs.ops;
          matchList = matchList.slice(start, start + count);
        } catch (err) {
          if (err.response.status === 404) {
            matchList = [];
          }
        }
      }

      if (matchList.length > 0) {
        const promises = [];
        for (let i = 0; i < matchList.length; i++) {
          const gameId = matchList[i].gameId;
          const getGameApiCallingInfo = () => {
            return Game.find({ gameId: Number(gameId) })
              .limit(1)
              .then(async (games) => {
                if (games.length === 0) {
                  try {
                    const data = await demacia.getMatchInfoByGameId(gameId);
                    const game = new Game(data);
                    game.save();
                    return game;
                  } catch (err) {
                    return Promise.reject(err);
                  }
                } else {
                  return games[0];
                }
              });
          };

          promises.push(getGameApiCallingInfo());
        }

        Promise.all(promises)
          .then((games: IGameModel[]) => {
            const result: Object[] = [];
            matchList.forEach((match, idx) => {
              const data = { ...match };
              const gameClientData = lodash.cloneDeep(games[idx]);
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
          })
          .catch((err) => {
            next(err);
          });
      } else {
        res.json([]);
      }
    });
});

export default router;
