import demacia from '../../common/demacia';
import League from '../league';

export async function getOrCreateLeagueData(summonerId: string, lastSeason: number) {
  try {
    const items = await League.find({ summonerId: summonerId, season: lastSeason });
    let leagueList = items;
    if (items.length === 0) {
      const leagueDataList = await demacia.getLeagueBySummonerId(summonerId);
      for (var i = 0; i < leagueDataList.length; i++) {
        leagueDataList[i].season = lastSeason;
      }
      const docs = await League.collection.insertMany(leagueDataList);
      leagueList = docs.ops;
    }

    return Promise.resolve(leagueList);
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function updateLeageData(summonerId: string, lastSeason: number) {
  try {
    const leagueDataList = await demacia.getLeagueBySummonerId(summonerId);

    for (var i = 0; i < leagueDataList.length; i++) {
      leagueDataList[i].season = lastSeason;
    }

    await League.bulkWrite(
      leagueDataList.map((league) => ({
        updateOne: {
          filter: { summonerId: league.summonerId, season: lastSeason, leagueId: league.leagueId },
          update: { $set: league },
          upsert: true,
        },
      }))
    );

    return Promise.resolve(leagueDataList);
  } catch (err) {
    return Promise.reject(err);
  }
}
