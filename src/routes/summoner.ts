import * as console from 'console';
import { Router } from 'express';
import * as lodash from 'lodash';
import { escape } from 'querystring';
import { format } from 'util';
import { LOL_API, LOL_URL } from '../constants';
import { IGameApiData, ILeagueApiData, IMatchApiData, ISummonerApiData } from '../lib/demacia/models';
import { callLolApi, getLastSeason, getLastVersion, IAjaxGet, sequentialCallLolApis } from '../lib/lol';
import Game from '../models/game';
import League, { ILeagueModel } from '../models/league';
import Match from '../models/match';
import Summoner from '../models/summoner';

const router = Router();

async function getOrCreateLeagueData(id: string, lastSeason: number): Promise<ILeagueModel[]> {
  return League.find({ summonerId: id, season: lastSeason })
    .then(async (items) => {
      let leagueList = items;
      if (items.length == 0) {
        const leagueUrl = format(LOL_API.GET_SUMMONER_LEAGUE_BY_ID, escape(id));
        try {
          const leagueDataList = await callLolApi<ILeagueApiData[]>(leagueUrl);
          for (var i = 0; i < leagueDataList.length; i++) {
            leagueDataList[i].season = lastSeason;
          }
          const docs = await League.collection.insertMany(leagueDataList);
          console.info('%d leagues were stored.', docs.insertedCount);

          leagueList = docs.ops;
        } catch (err) {
          return Promise.reject(err);
        }
      }

      return Promise.resolve(leagueList);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

router.get('/:name', function(req, res, next) {
  Summoner.findOne(
    {
      name: req.params.name,
    },
    async (err, summoner) => {
      if (err) {
        next(err);
      }

      const lastSeason = await getLastSeason();
      const version = await getLastVersion();
      if (!summoner) {
        const url = format(LOL_API.GET_SUMMONER_BY_NAME, escape(req.params.name));
        callLolApi<ISummonerApiData>(url)
          .then(async (summonerData) => {
            try {
              const summoners = await Summoner.find({ id: summonerData.id }).limit(1);
              if (summoners.length === 0) {
                summoner = new Summoner(summonerData);
              } else {
                summoner = summoners[0];
                if (!summoner) {
                  summoner = new Summoner(summonerData);
                }
                summoner.name = req.params.name;
              }
              summoner.save();
            } catch (err) {
              throw new Error(err);
            }

            return getOrCreateLeagueData(summoner.id, lastSeason).then((seasons) => {
              if (summoner) {
                return { ...summoner.toObject(), seasons };
              }
            });
          })
          .then(async (summonerData) => {
            const matchListUrl = format(
              LOL_API.GET_MATCH_LIST_BY_ACCOUNT_ID,
              escape(summonerData.accountId)
            );
            const matchData = await callLolApi<{ matches: IMatchApiData[] }>(matchListUrl);
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
              iconUrl: format(LOL_URL.PROFILE_ICON, version, summonerData.profileIconId),
            });
          })
          .catch((err) => {
            res.status(err.response.status).json({ error: err.response.data });
          });
      } else {
        getOrCreateLeagueData(summoner.id, lastSeason).then((seasons) => {
          if (summoner) {
            res.json({
              ...summoner.toObject(),
              seasons,
              iconUrl: format(LOL_URL.PROFILE_ICON, version, summoner.profileIconId),
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
        const url = format(LOL_API.GET_MATCH_LIST_BY_ACCOUNT_ID, escape(req.params.accountId));
        try {
          const data = await callLolApi<{ matches: IMatchApiData[] }>(url);
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
          const getGameApiCallingInfo = (): Promise<IAjaxGet<IGameApiData>> => {
            return Game.find({ gameId: Number(gameId) })
              .limit(1)
              .then((games) => {
                if (games.length === 0) {
                  const url = format(LOL_API.GET_MATCH_INFO_BY_GAME_ID, gameId);
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

          // const getGameApiCallingInfo = () => {
          //   return Game.find({ gameId: Number(gameId) })
          //     .limit(1)
          //     .then(async (games) => {
          //       if (games.length === 0) {
          //         try {
          //           const url = format(LOL_API.GET_MATCH_INFO_BY_GAME_ID, gameId);
          //           const gameData = await callLolApi<IGameData>(url);
          //           const game = new Game(gameData);
          //           game.save();

          //           return game;
          //         } catch (err) {
          //           return Promise.reject(err);
          //         }
          //       } else {
          //         return games[0];
          //       }
          //     });
          // };
          promises.push(Promise.resolve(getGameApiCallingInfo()));
        }

        Promise.all(promises)
          .then((ajaxDataList) => {
            const itemsOfArray: IAjaxGet<IGameApiData>[][] = [];
            let items: IAjaxGet<IGameApiData>[] = [];
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

            return sequentialCallLolApis(itemsOfArray);
          })
          .then(async (games: { save: boolean; data: IGameApiData }[]) => {
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
