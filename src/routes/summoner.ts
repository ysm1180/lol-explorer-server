import * as console from 'console';
import * as express from 'express';
import * as lodash from 'lodash';
import * as querystring from 'querystring';
import * as util from 'util';
import * as constants from '../constants';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import * as models from '../lib/demacia/models';
import * as lol from '../lib/lol';
import Game from '../models/game';
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
        const url = util.format(
          constants.LOL_API.GET_SUMMONER_BY_NAME,
          querystring.escape(req.params.name)
        );
        lol
          .callLolApi<models.ISummonerApiData>(url)
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
            const matchListUrl = util.format(
              constants.LOL_API.GET_MATCH_LIST_BY_ACCOUNT_ID,
              querystring.escape(summonerData.accountId)
            );
            const matchData = await lol.callLolApi<{ matches: models.IMatchApiData[] }>(
              matchListUrl
            );
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
          if (summoner) {
            res.json({
              ...summoner.toObject(),
              seasons,
              iconUrl: DDragonHelper.URL_PROFILE_ICON(version, summoner.profileIconId),
            });
          } else {
            res.status(404).json({ message: 'Summoner is not found.' });
          }
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
        const url = util.format(
          constants.LOL_API.GET_MATCH_LIST_BY_ACCOUNT_ID,
          querystring.escape(req.params.accountId)
        );
        try {
          const data = await lol.callLolApi<{ matches: models.IMatchApiData[] }>(url);
          let matchListData = data.matches;
          for (var i = 0; i < matchListData.length; i++) {
            matchListData[i].summonerAccountId = req.params.accountId;
          }
          const docs = await Match.collection.insertMany(matchListData);
          matchList = docs.ops;
          matchList = matchList.slice(start, start + count);
        } catch (err) {
          console.log(`[callLolApi] ${url}`);
          console.log(err.response);
          if (err.response.status === 404) {
            matchList = [];
          }
        }
      }

      if (matchList.length > 0) {
        const promises = [];
        for (let i = 0; i < matchList.length; i++) {
          const gameId = matchList[i].gameId;
          const getGameApiCallingInfo = (): Promise<lol.IAjaxGet<models.IGameApiData>> => {
            return Game.find({ gameId: Number(gameId) })
              .limit(1)
              .then((games) => {
                if (games.length === 0) {
                  const url = util.format(constants.LOL_API.GET_MATCH_INFO_BY_GAME_ID, gameId);
                  return {
                    url,
                  };
                } else {
                  return {
                    url: '',
                    data: games[0],
                  };
                }
              });
          };

          promises.push(Promise.resolve(getGameApiCallingInfo()));
        }

        Promise.all(promises)
          .then((ajaxDataList) => {
            const itemsOfArray: lol.IAjaxGet<models.IGameApiData>[][] = [];
            let items: lol.IAjaxGet<models.IGameApiData>[] = [];
            let count = 0;
            ajaxDataList.forEach((ajaxData) => {
              items.push(ajaxData);
              count++;

              // TODO : 10 is random constant, but later adjust the value by app rate.
              if (count === 10) {
                itemsOfArray.push(items);
                items = [];
                count = 0;
              }
            });

            return lol.sequentialCallLolApis(itemsOfArray);
          })
          .then(async (games: { save: boolean; data: models.IGameApiData }[]) => {
            games.forEach((game) => {
              if (game.save) {
                new Game(game.data).save();
              }
            });

            const result: Object[] = [];
            matchList.forEach((match, idx) => {
              const data = { ...match };
              const gameClientData = lodash.cloneDeep(games[idx].data);
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
