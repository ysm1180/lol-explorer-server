import { format } from 'util';
import { LOL_API } from '../../constants';
import { ILeagueApiData } from '../../lib/demacia/models';
import { callLolApi } from '../../lib/lol';
import League, { ILeagueModel } from '../league';

export async function getOrCreateLeagueData(id: string, lastSeason: number): Promise<ILeagueModel[]> {
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
