import axios from 'axios';
import * as express from 'express';
import mongo from '../db/mongo';
import { GAME_QUEUE_ID, LEAGUE_QUEUE_TYPE, MAP_ID, POSITION } from '../lib/demacia/constants';
import { Demacia } from '../lib/demacia/demacia';
import { STRATEGY } from '../lib/demacia/ratelimiter/ratelimiter';
import GameTimeline from '../models/game-timeline';
import StatisticsChampion from '../models/statistics/champion';
import StatisticsGame from '../models/statistics/game';
import StatisticsSummoner from '../models/statistics/summoner';
import { getPositions } from '../models/util/game';
import { getPurchasedItemEvents, getSkillSlotEvents } from '../models/util/timeline';
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

const summonerList = async () => {
  const summoners = await StatisticsSummoner.find({ tier: 'CHALLENGER' }).select({ name: 1 });
  const result = [];

  for (let i = 0; i < summoners.length; i++) {
    result.push(summoners[i].name);
  }

  return [...new Set(result)];
};

summonerList()
  .then(async (summonerNameList) => {
    try {
      let summoners: any[] = [];
      const summonerAccountList: string[][] = [];

      const summonerFn = async (i: number, j: number) => {
        try {
          summoners[j] = null;

          if (summonerNameList.length - 1 >= i + j) {
            summoners[j] = await demacia[j].getSummonerByName(summonerNameList[i + j]);
          }

          if (summoners[j]) {
            console.log(
              `[${new Date().toTimeString()}] ${j} : GET summoner ${summonerNameList[i + j]}`
            );
            summonerAccountList[j].push(summoners[j].accountId);
          }
        } catch (err) {
          if (err.response && err.response.status === 403) {
            axios.post('http://gasi.asuscomm.com:5001/expired', { api_key: apiKey[j] });
            console.log(`EXPIRED ${j}: ${apiKey[j]}`);
          }
        }
      };

      for (let j = 0; j < apiKey.length; j++) {
        summonerAccountList.push([]);
      }

      for (let i = 0; i < summonerNameList.length; i = i + apiKey.length) {
        const promises = [];
        summoners = [];
        for (let j = 0; j < apiKey.length; j++) {
          summoners.push(null);
          promises.push(summonerFn(i, j));
        }

        await Promise.all(promises);
      }

      const fn = async (index: number) => {
        for (let i = 0; i < summonerAccountList[index].length; i++) {
          try {
            const matchList = (await demacia[index].getMatchListByAccountId(
              summonerAccountList[index][i]
            )).matches;
            for (let j = 0; j < matchList.length; j++) {
              console.log(
                `[${new Date().toTimeString()}] START analyze ${index} ${matchList[j].gameId}`
              );
              await analyzeGame(demacia[index], matchList[j].gameId);
            }
          } catch (err) {
            if (err.response && err.response.status === 403) {
              axios.post('http://gasi.asuscomm.com:5001/expired', { api_key: apiKey[index] });
              console.log(`EXPIRED ${index}: ${apiKey[index]}`);
              break;
            }
          }
        }
      };

      await Promise.all([fn(0), fn(1), fn(2), fn(3), fn(4)]);

      console.log('END');
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  })
  .catch((err) => {
    console.log(err);
  });

var port = process.env.PORT || 4000;
app.listen(port);

export async function analyzeGame(demacia: Demacia, gameId: number) {
  try {
    let game = await StatisticsGame.findOne({ gameId });
    if (!game) {
      const gameData = await demacia.getMatchInfoByGameId(gameId);
      game = new StatisticsGame(gameData);
      game.isAnalyze = [false, false, false, false, false, false, false, false, false, false];
    }

    let timeline = await GameTimeline.findOne({ gameId });
    if (!timeline) {
      const timelineData = await demacia.getMatchTimelineByGameId(gameId);
      timeline = new GameTimeline({ ...timelineData, gameId });
    }

    if (
      game.mapId == MAP_ID.SUMMONER_RIFT &&
      (game.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK ||
        game.queueId === GAME_QUEUE_ID.RIFT_FLEX_RANK)
    ) {
      const positions = getPositions(game);

      for (let i = 0; i < game.participantIdentities.length; i++) {
        const summonerData = game.participantIdentities[i].player;
        const participantId = game.participantIdentities[i].participantId;
        if (positions[participantId] !== POSITION.UNKNOWN && !game.isAnalyze[participantId]) {
          game.isAnalyze[participantId] = true;

          const participantData = game.participants.find(
            (participant) => participant.participantId === participantId
          )!;
          const teamData = game.teams.find((team) => team.teamId === participantData.teamId)!;

          const summonerLeagueApiData = await demacia.getLeagueBySummonerId(
            summonerData.summonerId
          );

          let tier: string = 'UNRANKED';
          for (let j = 0; j < summonerLeagueApiData.length; j++) {
            if (summonerLeagueApiData[j].queueType == LEAGUE_QUEUE_TYPE[game.queueId]) {
              tier = summonerLeagueApiData[j].tier;
            }
          }

          const gameId = game.gameId;
          const isWin = participantData.stats.win;
          const teamId = teamData.teamId;
          const championKey = participantData.championId;
          const spell1 = participantData.spell1Id;
          const spell2 = participantData.spell2Id;
          const stats = participantData.stats;
          const participantTimeline = participantData.timeline;
          const gameMinutes = Math.floor(game.gameDuration / 60);
          const skills = getSkillSlotEvents(timeline, participantId);
          const items = getPurchasedItemEvents(timeline, participantId);
          const position = positions[participantId];

          const data = new StatisticsChampion({
            gameId,
            isWin,
            championKey,
            tier,
            spell1,
            spell2,
            teamId,
            stats,
            timeline: participantTimeline,
            durationMinutes: gameMinutes,
            skills,
            items,
            position,
          });
          data.save();
        }
      }

      game.save();
      timeline.save();
    }

    return Promise.resolve();
  } catch (err) {
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err);
    }
    return Promise.reject(err);
  }
}
