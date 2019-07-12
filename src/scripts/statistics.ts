import axios from 'axios';
import * as express from 'express';
import mongo from '../db/mongo';
import { GAME_QUEUE_ID, LEAGUE_QUEUE_TYPE, MAP_ID, POSITION } from '../lib/demacia/constants';
import { Demacia } from '../lib/demacia/demacia';
import GameTimeline from '../models/game-timeline';
import DevApi from '../models/statistics/api';
import StatisticsChampion from '../models/statistics/champion';
import StatisticsGame from '../models/statistics/game';
import StatisticsSummoner from '../models/statistics/summoner';
import { getPositions } from '../models/util/game';
import { getPurchasedItemEvents, getSkillSlotEvents } from '../models/util/timeline';
import devApi, { IDevApiClassData } from './api';

const app = express();
mongo.connect();

const router = express.Router();
router.post('/add/:key', async (req, res, next) => {
  const key = req.params.key;
  devApi.addKey(key);
  devApi.run(devApi.length() - 1);
});

app.use('/api', router);

const summonerList = async () => {
  const summoners = await StatisticsSummoner.find({ tier: 'CHALLENGER' }).select({ name: 1 });
  const result = [];

  for (let i = 0; i < summoners.length; i++) {
    result.push(summoners[i].name);
  }

  return [...new Set(result)];
};

DevApi.find().then(async (data) => {
  try {
    const keys = data.map((k) => k.key);
    for (let i = 0; i < keys.length; i++) {
      devApi.addKey(keys[i]);
    }
    devApi.setExpiredFn(async (key: string) => {
      try {
        await axios.post('http://localhost:5555/expired', { api_key: key });
        console.log(`EXPIRED ${key}`);
        devApi.removeKey(key);
      } catch (err) {
        console.log(`Expired function error ${err}`);
      }
    });
    devApi.setSharedData(await summonerList());
    devApi.setProcessFunction(async (nameList: string[], apiClassData: IDevApiClassData) => {
      const accountIdList: string[] = [];

      const summonerFn = async (index: number) => {
        try {
          const summoner = await apiClassData.demacia.getSummonerByName(nameList[index]);
          console.log(`[${new Date().toTimeString()}] GET summoner ${nameList[index]}`);
          accountIdList.push(summoner.accountId);
        } catch (err) {
          if (err.response && err.response.status === 404) {
            console.log(`Summoner is not founded ${nameList[index]}`);
          }
          return Promise.resolve();
        }
      };

      for (let i = 0; i < nameList.length; i++) {
        await summonerFn(i);
      }

      for (let i = 0; i < accountIdList.length; i++) {
        try {
          const matchList = (await apiClassData.demacia.getMatchListByAccountId(accountIdList[i]))
            .matches;
          for (let j = 0; j < matchList.length; j++) {
            console.log(`[${new Date().toTimeString()}] START analyze ${matchList[j].gameId}`);
            await analyzeGame(apiClassData.demacia, matchList[j].gameId);
          }
        } catch (err) {
          if (err.response) {
            console.log(err.response.data);
          } else {
            console.log(err);
          }
        }
      }

      console.log('END');
    });

    await devApi.runAll();
    return;
  } catch (err) {
    return Promise.reject(err);
  }
});

var port = process.env.PORT || 6666;
app.listen(port);

export async function analyzeGame(demacia: Demacia, gameId: number) {
  try {
    let game = await StatisticsGame.findOne({ gameId });
    if (!game) {
      const gameData = await demacia.getMatchInfoByGameId(gameId);
      game = new StatisticsGame(gameData);
      game.isAnalyze = [false, false, false, false, false, false, false, false, false, false];
      await game.save();
    }

    let timeline = await GameTimeline.findOne({ gameId });
    if (!timeline) {
      const timelineData = await demacia.getMatchTimelineByGameId(gameId);
      timeline = new GameTimeline({ ...timelineData, gameId });
      await timeline.save();
    }

    if (
      game.mapId == MAP_ID.SUMMONER_RIFT &&
      (game.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK ||
        game.queueId === GAME_QUEUE_ID.RIFT_FLEX_RANK)
    ) {
      const positions = getPositions(game);
      const champions = [];

      for (let i = 0; i < game.participantIdentities.length; i++) {
        const summonerData = game.participantIdentities[i].player;
        const participantId = game.participantIdentities[i].participantId;
        if (positions[participantId] !== POSITION.UNKNOWN && !game.isAnalyze[participantId]) {
          try {
            const summoner = await demacia.getSummonerByName(summonerData.summonerName);
            const summonerLeagueApiData = await demacia.getLeagueBySummonerId(summoner.id);

            game.isAnalyze[participantId] = true;
            await game.save();

            const participantData = game.participants.find(
              (participant) => participant.participantId === participantId
            )!;
            const teamData = game.teams.find((team) => team.teamId === participantData.teamId)!;

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

            champions.push({
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
          } catch (err) {
            if (err.response && err.response.status === 404) {
              continue;
            } else {
              throw err;
            }
          }
        }
      }

      await StatisticsChampion.insertMany(champions);
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
