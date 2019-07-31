import { Demacia } from '../lib/demacia/demacia';
import StatisticsSummoner from '../models/statistics/summoner';
import { LolStatisticsWrapper } from './common';

const wrapper = new LolStatisticsWrapper();

const insertHighRankSummonerList = async (demacia: Demacia) => {
  try {
    const result = [];
    const queues: ('RANKED_SOLO_5x5' | 'RANKED_FLEX_SR')[] = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'];
    for (let i = 0; i < queues.length; i++) {
      const queue = queues[i];

      let challengers = await demacia.getChallengerSummonerList(queue);
      for (let i = 0; i < challengers.entries.length; i++) {
        result.push({
          name: challengers.entries[i].summonerName,
          queue,
          tier: 'CHALLENGER',
          rank: '',
        });
      }
      console.log(`${queue} Challengers ${challengers.entries.length}`);

      let grandmasters = await demacia.getGrandMasterSummonerList(queue);
      for (let i = 0; i < grandmasters.entries.length; i++) {
        result.push({
          name: grandmasters.entries[i].summonerName,
          queue,
          tier: 'GRANDMASTER',
          rank: '',
        });
      }
      console.log(`${queue} Grandmasters ${grandmasters.entries.length}`);

      let masters = await demacia.getMasterSummonerList(queue);
      for (let i = 0; i < masters.entries.length; i++) {
        result.push({
          name: masters.entries[i].summonerName,
          queue,
          tier: 'MASTER',
          rank: '',
        });
      }
      console.log(`${queue} Masters ${masters.entries.length}`);
    }

    await StatisticsSummoner.insertMany(result);

    return;
  } catch (err) {
    return Promise.reject(err);
  }
};

const getSummonerList = async (
  queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR',
  tier: string,
  rank: string,
  page: number,
  demacia: Demacia
) => {
  try {
    let summoners = await demacia.getSummonerListByLeague(queue, tier, rank, page);

    const result = [];
    for (let i = 0; i < summoners.length; i++) {
      result.push({
        name: summoners[i].summonerName,
        queue,
        tier,
        rank,
      });
    }

    return result;
  } catch (err) {
    return Promise.reject(err);
  }
};

StatisticsSummoner.remove({}).then(() => {
  const queues: ('RANKED_SOLO_5x5' | 'RANKED_FLEX_SR')[] = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'];
  const tiers = ['DIAMOND', 'PLATINUM'];
  const ranks = ['I', 'II', 'III', 'IV'];

  const progressData: any[] = [];
  for (let i = 0; i < queues.length; i++) {
    const queue = queues[i];

    for (let j = 0; j < tiers.length; j++) {
      const tier = tiers[j];

      for (let k = 0; k < ranks.length; k++) {
        const rank = ranks[k];
        progressData.push({
          queue,
          tier,
          rank,
          page: 1,
        });
      }
    }
  }

  wrapper.run(
    {
      insertedHighRanks: false,
      pageData: progressData,
    },
    async (sharedData: any, apiClassData) => {
      try {
        if (!sharedData.insertedHighRanks) {
          sharedData.insertedHighRanks = true;
          await insertHighRankSummonerList(apiClassData.demacia);
        }

        let pageData = sharedData.pageData.filter((data: { page: number }) => data.page !== -1);
        while (pageData.length > 0) {
          try {
            const idx = Math.floor(Math.random() * pageData.length);
            const randomData = pageData[idx];
            if (randomData.page !== -1) {
              const result = await getSummonerList(
                randomData.queue,
                randomData.tier,
                randomData.rank,
                randomData.page++,
                apiClassData.demacia
              );
              if (result.length === 0) {
                randomData.page = -1;
              } else {
                console.log(
                  `${randomData.queue} ${randomData.tier} ${randomData.rank} ${randomData.page}`
                );
                await StatisticsSummoner.insertMany(result);
              }
            }
          } catch (err) {
            if (err.response && err.response.status === 403) {
              return Promise.reject(err);
            }
            console.log(err);
          }

          pageData = sharedData.pageData.filter((data: { page: number }) => data.page !== -1);
        }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          return Promise.reject(err);
        }

        if (err.response) {
          console.error(err.response.data);
        } else {
          console.error(err);
        }
      }
    }
  );
});
