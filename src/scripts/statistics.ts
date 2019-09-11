import { GAME_QUEUE_ID } from '../lib/demacia/constants';
import { Demacia } from '../lib/demacia/demacia';
import GameTimeline from '../models/game-timeline';
import StatisticsGame from '../models/statistics/game';
import StatisticsSummoner from '../models/statistics/summoner';
import { Lock, LolStatisticsWrapper } from './common';

const wrapper = new LolStatisticsWrapper();
const lock = new Lock();

const summonerList = async (size: number) => {
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
            $or: [
              {
                isReady: false,
              },
              {
                isReady: null,
              },
            ],
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
    result.push({
      name: summoners[i].name,
      selected: false,
    });
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

summonerList(1000).then(async (initData) => {
  if (initData.length === 0) {
    console.log('END');
    return;
  }

  let lockReleaser;

  wrapper.run(initData, async (sharedData: { name: string; selected: boolean }[], apiClassData) => {
    while (true) {
      while (true) {
        lockReleaser = await lock.acquire();

        let unselectedList = sharedData.filter((data) => !data.selected);
        if (unselectedList.length === 0) {
          lockReleaser();
          break;
        }

        const idx = Math.floor(Math.random() * unselectedList.length);
        unselectedList[idx].selected = true;

        lockReleaser();

        try {
          const name = unselectedList[idx].name;
          const accountId = await getSummonerAccountId(apiClassData.demacia, name);
          let matchList = (await apiClassData.demacia.getMatchQueueListByAccountId(
            accountId,
            13,
            GAME_QUEUE_ID.RIFT_SOLO_RANK
          )).matches;
          for (let j = 0; j < matchList.length; j++) {
            const result = await analyzeGame(apiClassData.demacia, matchList[j].gameId);
            if (!result) {
              break;
            }

            console.log(
              `[${new Date().toLocaleTimeString('ko-KR')}] ${apiClassData.key} Analyze ${
                matchList[j].gameId
              }`
            );
          }

          matchList = (await apiClassData.demacia.getMatchQueueListByAccountId(
            accountId,
            13,
            GAME_QUEUE_ID.RIFT_FLEX_RANK
          )).matches;
          for (let j = 0; j < matchList.length; j++) {
            const result = await analyzeGame(apiClassData.demacia, matchList[j].gameId);
            if (!result) {
              break;
            }

            console.log(
              `[${new Date().toLocaleTimeString('ko-KR')}] ${apiClassData.key} Analyze ${
                matchList[j].gameId
              }`
            );
          }

          try {
            lockReleaser = await lock.acquire();

            const selectedSummoner = await StatisticsSummoner.findOne({ name });
            if (selectedSummoner) {
              selectedSummoner.isReady = true;
              selectedSummoner.save();
            }
          } catch {
          } finally {
            lockReleaser();
          }
        } catch (err) {
          if (err.response && err.response.status === 403) {
            unselectedList[idx].selected = false;
            return Promise.reject(err);
          }
        }
      }

      lockReleaser = await lock.acquire();

      if (sharedData.filter((data) => !data.selected).length > 0) {
        lockReleaser();
        continue;
      } else if (sharedData.length === 0) {
        lockReleaser();
        break;
      }

      sharedData.splice(0, sharedData.length);

      const newSummonerList = await summonerList(1000);
      if (newSummonerList.length === 0) {
        lockReleaser();
        break;
      }

      sharedData.push(...newSummonerList);
      console.log(`NEW ADD SUMMONER ${newSummonerList.length}`);

      lockReleaser();
    }

    await StatisticsSummoner.updateMany({}, { $set: { isReady: false } });
  });
});

export async function analyzeGame(demacia: Demacia, gameId: number) {
  let game = await StatisticsGame.findOne({ gameId });
  let isGameSave = false;
  if (!game) {
    const gameData = await demacia.getMatchInfoByGameId(gameId);
    gameData.gameVersion = gameData.gameVersion
      .split('.')
      .slice(0, 2)
      .join('.');
    game = new StatisticsGame(gameData);
    game.isAnalyze = [false, false, false, false, false, false, false, false, false, false];
    game.isReady = false;
    isGameSave = true;
  }

  try {
    const gameVersion = game.gameVersion;

    if (gameVersion !== '9.18' && gameVersion !== '9.17' && gameVersion !== '9.16' && gameVersion !== '9.15') {
      return Promise.resolve(false);
    }

    if (
      (game.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK ||
        game.queueId === GAME_QUEUE_ID.RIFT_FLEX_RANK) &&
      !(game.gameDuration <= 60 * 5 && !game.teams[0].firstBlood && !game.teams[1].firstBlood)
    ) {
      let timeline = await GameTimeline.findOne({ gameId });
      if (!timeline) {
        const timelineData = await demacia.getMatchTimelineByGameId(gameId);
        timeline = new GameTimeline({ ...timelineData, gameId });
        await timeline.save();
      }
      if (isGameSave) {
        await game.save();
      }
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
