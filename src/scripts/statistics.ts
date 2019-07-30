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
import { getConsumedStaticItemIdList, getFinalStaticItemIdList, getShoesStaticItemIdList } from '../models/util/static';
import { saveChampionBans, saveChampionPosition, saveChampionPurchasedItems, saveChampionRivalData, saveChampionRune, saveChampionShoes, saveChampionSkillSet, saveChampionSpell, saveChampionStartItem, saveChampionTimeWin } from '../models/util/statistics';
import { getItemEvents, getSkillLevelupSlots, getSoloKills, getStartItemIdList } from '../models/util/timeline';
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

let isFinished = false;
export class Lock {
  private tip: Promise<void>;

  constructor() {
    this.tip = Promise.resolve<void>(undefined);
  }

  public async acquire(): Promise<() => void> {
    const oldTip = this.tip;
    let resolver = () => {};
    const promise = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    this.tip = oldTip.then(() => promise);
    return oldTip.then(() => resolver);
  }
}
const lock = new Lock();

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
    const initData = await summonerList(1000);
    if (initData.length === 0) {
      console.log('END');
      return;
    }

    devApi.setSharedData(initData);
    devApi.setProcessFunction(
      async (sharedData: { name: string; selected: boolean }[], apiClassData: IDevApiClassData) => {
        let unselectedList = sharedData.filter((data) => !data.selected);

        while (true) {
          while (unselectedList.length > 0) {
            const idx = Math.floor(Math.random() * unselectedList.length);
            if (!unselectedList[idx].selected) {
              try {
                unselectedList[idx].selected = true;

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

          const releaser = await lock.acquire();

          if (isFinished) {
            console.log(`${apiClassData.key} FINISHED`);
            break;
          }

          unselectedList = sharedData.filter((data) => !data.selected);
          if (unselectedList.length > 0) {
            releaser();
            continue;
          }

          const newSummonerList = await summonerList(1000);
          if (newSummonerList.length === 0) {
            console.log(`${apiClassData.key} FINISHED`);
            isFinished = true;
            releaser();
            break;
          }
          
          sharedData.splice(0, sharedData.length);
          sharedData.push(...newSummonerList);
          console.log(`NEW ADD SUMMONER ${newSummonerList.length}`);
          unselectedList = sharedData.filter((data) => !data.selected);

          releaser();
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

  try {
    const getGameVersion = (version: string) => {
      const temp = version.split('.');
      return `${temp[0]}.${temp[1]}`;
    };
    const gameVersion = getGameVersion(game.gameVersion);

    if (gameVersion !== '9.14' && gameVersion !== '9.13' && gameVersion !== '9.12') {
      return Promise.resolve(false);
    }

    if (
      game.mapId == MAP_ID.SUMMONER_RIFT &&
      (game.queueId === GAME_QUEUE_ID.RIFT_SOLO_RANK ||
        game.queueId === GAME_QUEUE_ID.RIFT_FLEX_RANK) &&
      !(game.gameDuration <= 60 * 5 && !game.teams[0].firstBlood && !game.teams[1].firstBlood)
    ) {
      const consumedItemList = await getConsumedStaticItemIdList();
      const finalItemList = await getFinalStaticItemIdList();
      const shoesItemList = await getShoesStaticItemIdList();

      await timeline.save();

      const positions = await getPositions(game);
      const champions = [];
      const teams = game.teams;

      const totalBannedChampions = [];
      const totalKillsByTeam: { [id: string]: number } = {};
      for (const team of teams) {
        totalBannedChampions.push(...team.bans.map((ban) => ban.championId));
      }
      await saveChampionBans({ totalBannedChampions, gameVersion });

      const rivals: { [id: string]: { championKey: number; participantId: number } } = {};
      for (let i = 0; i < game.participantIdentities.length; i++) {
        const participantId = game.participantIdentities[i].participantId;
        const participantData = game.participants.find(
          (participant) => participant.participantId === participantId
        )!;

        if (!totalKillsByTeam[participantData.teamId]) {
          totalKillsByTeam[participantData.teamId] = 0;
        }
        totalKillsByTeam[participantData.teamId] += participantData.stats.kills;

        for (let j = 0; j < game.participantIdentities.length; j++) {
          if (i === j) {
            continue;
          }

          const rivalParticipantId = game.participantIdentities[j].participantId;
          const rivalParticipantData = game.participants.find(
            (participant) => participant.participantId === rivalParticipantId
          )!;
          if (participantData.teamId === rivalParticipantData.teamId) {
            continue;
          }

          if (positions[participantId] !== positions[rivalParticipantId]) {
            continue;
          }

          rivals[participantId] = {
            championKey: rivalParticipantData.championId,
            participantId: rivalParticipantData.participantId,
          };
        }
      }

      for (let i = 0; i < game.participantIdentities.length; i++) {
        const summonerData = game.participantIdentities[i].player;
        const participantId = game.participantIdentities[i].participantId;
        if (positions[participantId] !== POSITION.UNKNOWN && !game.isAnalyze[participantId]) {
          try {
            let tier: string = 'UNRANKED';

            const queueType =
              LEAGUE_QUEUE_TYPE[
                game.queueId as GAME_QUEUE_ID.RIFT_SOLO_RANK | GAME_QUEUE_ID.RIFT_FLEX_RANK
              ];
            const summoner = await StatisticsSummoner.findOne({
              name: summonerData.summonerName,
              queue: queueType,
            });
            if (!summoner) {
              let rank = '';
              try {
                const summonerApiData = await demacia.getSummonerByName(summonerData.summonerName);
                const summonerLeagueApiData = await demacia.getLeagueBySummonerId(
                  summonerApiData.id
                );

                for (let j = 0; j < summonerLeagueApiData.length; j++) {
                  if (summonerLeagueApiData[j].queueType == queueType) {
                    tier = summonerLeagueApiData[j].tier;
                    rank = summonerLeagueApiData[j].rank;
                  }
                }
                if (
                  tier === 'PLATINUM' ||
                  tier === 'DIAMOND' ||
                  tier === 'MASTER' ||
                  tier === 'GRANDMASTER' ||
                  tier === 'CHALLENGER'
                ) {
                  await new StatisticsSummoner({
                    name: summonerData.summonerName,
                    queue: queueType,
                    tier,
                    rank,
                  }).save();
                }
              } catch (err) {
                if (err.response && err.response.status === 404) {
                  console.log(`${summonerData.summonerName} NOT Found.`);
                }
              }
            } else {
              tier = summoner.tier;
            }

            const participantData = game.participants.find(
              (participant) => participant.participantId === participantId
            )!;
            const teamData = game.teams.find((team) => team.teamId === participantData.teamId)!;

            const gameId = game.gameId;
            const isWin = participantData.stats.win;
            const teamId = teamData.teamId;
            const championKey = participantData.championId;
            const stats = participantData.stats;
            const spells = [participantData.spell1Id, participantData.spell2Id].sort(
              (a, b) => a - b
            );
            const mainRuneStyle = stats.perkPrimaryStyle;
            const mainRunes = [stats.perk0, stats.perk1, stats.perk2, stats.perk3];
            const subRuneStyle = stats.perkSubStyle;
            const subRunes = [stats.perk4, stats.perk5];
            const statRunes = [stats.statPerk0, stats.statPerk1, stats.statPerk2];
            const participantTimeline = participantData.timeline;
            const gameMinutes = Math.floor(game.gameDuration / 60);
            const skills = getSkillLevelupSlots(timeline, participantId);
            const items = getItemEvents(timeline, participantId).sort(
              (a, b) => a.timestamp - b.timestamp
            );
            const position = positions[participantId];

            const totalPurchasedItemEvent = [];
            const purchasedItemIds = [];
            let finalShoes = {
              itemId: 0,
              timestamp: 0,
            };

            for (const item of items) {
              if (item.type === 'ITEM_PURCHASED') {
                if (
                  !consumedItemList.includes(item.itemId) &&
                  finalItemList.includes(item.itemId) &&
                  !shoesItemList.includes(item.itemId)
                ) {
                  purchasedItemIds.push(item.itemId);
                }

                if (
                  finalShoes.itemId === 0 &&
                  !consumedItemList.includes(item.itemId) &&
                  finalItemList.includes(item.itemId) &&
                  shoesItemList.includes(item.itemId)
                ) {
                  finalShoes.itemId = item.itemId;
                  finalShoes.timestamp = item.timestamp;
                }
                totalPurchasedItemEvent.push(item);
              } else if (item.type === 'ITEM_UNDO') {
                let index = purchasedItemIds.indexOf(item.itemId);
                if (index !== -1) {
                  purchasedItemIds.splice(index, 1);
                }

                index = totalPurchasedItemEvent.findIndex((event) => event.itemId === item.itemId);
                if (index !== -1) {
                  totalPurchasedItemEvent.splice(index, 1);
                }
              }
            }

            const startItemIds = getStartItemIdList(timeline, participantId);

            if (
              tier === 'PLATINUM' ||
              tier === 'DIAMOND' ||
              tier === 'MASTER' ||
              tier === 'GRANDMASTER' ||
              tier === 'CHALLENGER'
            ) {
              champions.push({
                gameId,
                isWin,
                championKey,
                tier,
                participantId,
                teamId,
                stats,
                timeline: participantTimeline,
                gameVersion,
                position,
                rivalData: rivals[participantId],
              });

              await Promise.all([
                saveChampionPosition({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                }),
                saveChampionSpell({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  spells,
                }),
                saveChampionRune({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  mainRuneStyle,
                  mainRunes,
                  subRuneStyle,
                  subRunes,
                  statRunes,
                }),
              ]);
              if (skills.length >= 15) {
                await saveChampionSkillSet({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  skills: skills.slice(0, 15),
                });
              }

              if (startItemIds.length > 0) {
                await saveChampionStartItem({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  items: startItemIds,
                });
              }

              if (purchasedItemIds.length > 0) {
                await saveChampionPurchasedItems({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  items: purchasedItemIds,
                });
              }

              if (finalShoes.itemId !== 0) {
                await saveChampionShoes({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  shoes: finalShoes.itemId,
                  timestamp: finalShoes.timestamp,
                });
              }
            }

            await saveChampionTimeWin({
              championKey,
              position,
              gameMinutes,
              gameVersion,
              isWin,
            });

            if (rivals[participantId]) {
              await saveChampionRivalData({
                championKey,
                rivalChampionKey: rivals[participantId].championKey,
                position,
                gameVersion,
                isWin,
                shoes: {
                  itemId: finalShoes.itemId,
                  timestamp: finalShoes.timestamp,
                },
                items: purchasedItemIds,
                startItems: startItemIds,
                spells,
                runeData: {
                  mainRuneStyle,
                  mainRunes,
                  subRuneStyle,
                  subRunes,
                  statRunes,
                },
                stats: {
                  kills: stats.kills,
                  deaths: stats.deaths,
                  assists: stats.assists,
                  damageDealtToChampions: stats.totalDamageDealtToChampions,
                  damageTaken: stats.totalDamageTaken,
                  goldEarned: stats.goldEarned,
                  csPerMinutes: participantData.timeline.creepsPerMinDeltas,
                  xpPerMinutes: participantData.timeline.xpPerMinDeltas,
                  goldPerMinutes: participantData.timeline.goldPerMinDeltas,
                  killPercent:
                    (participantData.stats.kills + participantData.stats.assists) /
                    totalKillsByTeam[teamId],
                  soloKills: getSoloKills(
                    timeline,
                    participantId,
                    rivals[participantId].participantId
                  ),
                },
              });
            }

            game.isAnalyze[participantId] = true;
          } catch (err) {
            console.error(`[GAME PARTICIPANT ${participantId} ANALYZE ERROR]`);
            if (err.response) {
              console.log(err.response.data);
            } else {
              console.log(err);
            }
            game.isAnalyze[participantId] = false;
          }
        }
      }

      game.isReady = true;

      await StatisticsChampion.insertMany(champions);
      await game.save();
    }

    return Promise.resolve(true);
  } catch (err) {
    console.error('[GAME ANALYZE ERROR]');
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err);
    }

    game.isReady = false;
    await game.save();

    return Promise.reject(err);
  }
}
