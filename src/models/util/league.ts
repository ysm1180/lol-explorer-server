import demacia from '../../common/demacia';
import League from '../league';

export async function getOrCreateLeagueData(id: string, lastSeason: number) {
  return League.find({ summonerId: id, season: lastSeason })
    .then(async (items) => {
      let leagueList = items;
      if (items.length === 0) {
        try {
          const leagueDataList = await demacia.getLeagueBySummonerId(id);
          for (var i = 0; i < leagueDataList.length; i++) {
            leagueDataList[i].season = lastSeason;
          }
          const docs = await League.collection.insertMany(leagueDataList);
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
