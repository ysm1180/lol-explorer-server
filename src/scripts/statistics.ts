import axios from 'axios';
import * as express from 'express';
import mongo from '../db/mongo';
import { GAME_QUEUE_ID, LEAGUE_QUEUE_TYPE, MAP_ID, POSITION } from '../lib/demacia/constants';
import { Demacia } from '../lib/demacia/demacia';
import GameTimeline from '../models/game-timeline';
import DevApi from '../models/statistics/api';
import StatisticsChampion from '../models/statistics/champion';
import StatisticsChampionPosition from '../models/statistics/champion_position';
import StatisticsChampionStartItem from '../models/statistics/champion_start_item';
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
  console.log(`RUN PROCESS ${key}`);
  devApi.run(key);

  res.send('OK');
});

app.use('/api', router);

const summonerList = async (prev: string[], size: number) => {
  const summoners = await StatisticsSummoner.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              { tier: 'PLATINUM' },
              { tier: 'DIAMOND' },
              { tier: 'MASTER' },
              { tier: 'GRANDMASTER' },
              { tier: 'CHALLENGER' },
            ],
          },
          {
            name: {
              $nin: prev,
            },
          },
        ],
      },
    },
    {
      $sample: {
        size,
      },
    },
    {
      $project: {
        name: 1,
      },
    },
  ]);
  const result = [];

  for (let i = 0; i < summoners.length; i++) {
    if (!prev.includes(summoners[i].name)) {
      result.push({
        name: summoners[i].name,
        selected: false,
      });
    }
  }

  return [...new Set(result)];
};

const getSummonerAccountId = async (demacia: Demacia, name: string) => {
  try {
    const summoner = await demacia.getSummonerByName(name);
    console.log(`[${new Date().toLocaleTimeString('ko-KR')}] GET summoner ${name}`);
    return summoner.accountId;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Summoner is not founded ${name}`);
    }
    return Promise.reject(err);
  }
};

DevApi.find().then(async (data) => {
  try {
    const keys = data.map((k) => k.key);
    devApi.setExpiredFn(async (key: string) => {
      try {
        await axios.post('http://localhost:5555/expired', { api_key: key });
        console.log(`EXPIRED ${key}`);
        devApi.removeKey(key);
      } catch (err) {
        console.log(`Expired function error ${err}`);
      }
    });
    devApi.setSharedData(await summonerList([], 50000));
    devApi.setProcessFunction(
      async (sharedData: { name: string; selected: boolean }[], apiClassData: IDevApiClassData) => {
        let unselectedList = sharedData.filter((data) => !data.selected);

        const totalCount = await StatisticsSummoner.countDocuments();
        let count = 0;

        while (count < totalCount) {
          while (unselectedList.length > 0) {
            const idx = Math.floor(Math.random() * unselectedList.length);
            if (!unselectedList[idx].selected) {
              try {
                unselectedList[idx].selected = true;
                count++;

                const name = unselectedList[idx].name;
                const accountId = await getSummonerAccountId(apiClassData.demacia, name);
                const matchList = (await apiClassData.demacia.getMatchListByAccountId(accountId))
                  .matches;
                for (let j = 0; j < matchList.length; j++) {
                  console.log(
                    `[${new Date().toLocaleTimeString('ko-KR')}] ${apiClassData.key} Analyze ${
                      matchList[j].gameId
                    }`
                  );
                  const result = await analyzeGame(apiClassData.demacia, matchList[j].gameId);
                  if (!result) {
                    break;
                  }
                }
              } catch (err) {
                if (err.response && err.response.status === 403) {
                  unselectedList[idx].selected = false;
                  return Promise.reject(err);
                }

                if (err.response) {
                  console.error(err.response.data);
                } else {
                  console.error(err);
                }
              }
            }

            unselectedList = sharedData.filter((data) => !data.selected);
          }

          const newSummonerList = await summonerList(sharedData.map((data) => data.name), 50000);
          if (newSummonerList.length === 0) {
            break;
          }
          sharedData.push(...newSummonerList);
          console.log(`NEW ADD ${newSummonerList.length}`);
          unselectedList = sharedData.filter((data) => !data.selected);
        }

        console.log('END');
      }
    );

    await devApi.runAll(keys);
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

    const getGameVersion = (version: string) => {
      const temp = version.split('.');
      return `${temp[0]}.${temp[1]}`;
    };
    if (getGameVersion(game.gameVersion) !== '9.14') {
      return Promise.resolve(false);
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

            if (
              tier === 'PLATINUM' ||
              tier === 'DIAMOND' ||
              tier === 'MASTER' ||
              tier === 'GRANDMASTER' ||
              tier === 'CHALLENGER'
            ) {
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
              const gameVersion = getGameVersion(game.gameVersion);

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

              const startItemIds = items
                .filter((item) => item.timestamp <= 60000)
                .map((item) => item.itemId)
                .sort((a, b) => a - b);

              const startItem = await StatisticsChampionStartItem.findOne({
                championKey,
                position,
                tier,
                gameVersion,
                items: startItemIds,
              });
              if (startItem) {
                startItem.count++;
                if (isWin) {
                  startItem.win++;
                }
                startItem.save();
              } else {
                new StatisticsChampionStartItem({
                  championKey,
                  position,
                  tier,
                  gameVersion,
                  items: startItemIds,
                  count: 1,
                  win: isWin ? 1 : 0,
                }).save();
              }

              const count = await StatisticsChampionPosition.findOne({
                championKey,
                position,
                tier,
                gameVersion,
              });
              if (count) {
                count.count++;
                if (isWin) {
                  count.win++;
                }
                count.save();
              } else {
                new StatisticsChampionPosition({
                  championKey,
                  position,
                  tier,
                  gameVersion,
                  count: 1,
                  win: isWin ? 1 : 0,
                }).save();
              }
            }
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

    return Promise.resolve(true);
  } catch (err) {
    console.error('[GAME ANALYZE ERROR]');
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err);
    }
    return Promise.reject(err);
  }
}
