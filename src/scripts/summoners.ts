import axios from 'axios';
import * as express from 'express';
import mongo from '../db/mongo';
import { Demacia } from '../lib/demacia/demacia';
import { STRATEGY } from '../lib/demacia/ratelimiter/ratelimiter';
import StatisticsSummoner from '../models/statistics/summoner';
import { apiKey } from './api';

const app = express();
mongo.connect();

const demacia = [
  new Demacia(apiKey[0], STRATEGY.SPREAD),
  new Demacia(apiKey[1], STRATEGY.SPREAD),
  new Demacia(apiKey[2], STRATEGY.SPREAD),
  new Demacia(apiKey[3], STRATEGY.SPREAD),
  new Demacia(apiKey[4], STRATEGY.SPREAD),
];

const initSummonerList = async () => {
  try {
    console.log('START');

    await StatisticsSummoner.remove({});

    const result = [];
    const queues: ('RANKED_SOLO_5x5' | 'RANKED_FLEX_SR')[] = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'];
    for (let i = 0; i < queues.length; i++) {
      const queue = queues[i];

      let challengers = await demacia[0].getChallengerSummonerList(queue);
      for (let i = 0; i < challengers.entries.length; i++) {
        result.push({
          name: challengers.entries[i].summonerName,
          queue,
          tier: 'CHALLENGER',
          rank: '',
        });
      }
      console.log(`${queue} challengers ${challengers.entries.length}`);

      let grandmasters = await demacia[0].getGrandMasterSummonerList(queue);
      for (let i = 0; i < grandmasters.entries.length; i++) {
        result.push({
          name: grandmasters.entries[i].summonerName,
          queue,
          tier: 'GRANDMASTER',
          rank: '',
        });
      }
      console.log(`${queue} grandmasters ${grandmasters.entries.length}`);

      let masters = await demacia[0].getMasterSummonerList(queue);
      for (let i = 0; i < masters.entries.length; i++) {
        result.push({
          name: masters.entries[i].summonerName,
          queue,
          tier: 'MASTER',
          rank: '',
        });
      }
      console.log(`${queue} masters ${masters.entries.length}`);
    }

    await StatisticsSummoner.insertMany(result);

    const ranks = ['I', 'II', 'III', 'IV'];
    const tiers = ['DIAMOND', 'PLATINUM'];

    let page = 1;
    const getSummonerList = async (
      queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR',
      tier: string,
      rank: string,
      index: number
    ) => {
      try {
        let summoners = await demacia[index].getSummonerListByLeague(
          queue,
          tier,
          rank,
          page + index
        );

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
        if (err.response) {
          if (err.response.status === 403) {
            axios.post('http://gasi.asuscomm.com:5001/expired', { api_key: apiKey[index] });
            console.log(`EXPIRED ${index}: ${apiKey[index]}`);
          } else {
            console.log(err.response.data);
          }
        } else {
          console.log(err);
        }
        return [];
      }
    };

    for (let i = 0; i < queues.length; i++) {
      const queue = queues[i];
      for (let j = 0; j < tiers.length; j++) {
        const tier = tiers[j];
        for (let k = 0; k < ranks.length; k++) {
          const rank = ranks[k];

          page = 1;
          while (1) {
            const names = await Promise.all([
              getSummonerList(queue, tier, rank, 0),
              getSummonerList(queue, tier, rank, 1),
              getSummonerList(queue, tier, rank, 2),
              getSummonerList(queue, tier, rank, 3),
              getSummonerList(queue, tier, rank, 4),
            ]).then((names) => {
              return [...names[0], ...names[1], ...names[2], ...names[3], ...names[4]];
            });

            if (names.length === 0) {
              break;
            }

            await StatisticsSummoner.insertMany(names);
            console.log(`${queue} ${tier} ${rank} ${names.length}`);

            page += 5;
          }
        }
      }
    }

    console.log('End Inserting Summoners');
  } catch (err) {
    console.log(err);
  }
};

initSummonerList();

var port = process.env.PORT || 4001;
app.listen(port);
