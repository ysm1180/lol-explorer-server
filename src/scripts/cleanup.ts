import axios from 'axios';
import * as express from 'express';
import mongo from '../db/mongo';
import { GAME_QUEUE_ID, LEAGUE_QUEUE_TYPE, POSITION } from '../lib/demacia/constants';
import { Demacia } from '../lib/demacia/demacia';
import GameTimeline from '../models/game-timeline';
import DevApi from '../models/statistics/api';
import StatisticsChampion from '../models/statistics/champion';
import StatisticsGame, { IStatisticsGameModel } from '../models/statistics/game';
import StatisticsSummoner from '../models/statistics/summoner';
import { getPositions } from '../models/util/game';
import {
  getConsumedStaticItemIdList,
  getFinalStaticItemIdList,
  getShoesStaticItemIdList,
} from '../models/util/static';
import {
  saveChampionBans,
  saveChampionPosition,
  saveChampionPurchasedItems,
  saveChampionRivalData,
  saveChampionRune,
  saveChampionShoes,
  saveChampionSkillSet,
  saveChampionSpell,
  saveChampionStartItem,
  saveChampionTimeWin,
} from '../models/util/statistics';
import {
  getItemEvents,
  getSkillLevelupSlots,
  getSoloKills,
  getStartItemIdList,
} from '../models/util/timeline';
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

const gameList = async (size: number) => {
  const games = await StatisticsGame.aggregate([
    {
      $match: {
        $or: [
          {
            isReady: false,
          },
          {
            isReady: null,
          },
        ],
      },
    },
    {
      $sample: {
        size,
      },
    },
  ]).allowDiskUse(true);
  const result = [];

  for (let i = 0; i < games.length; i++) {
    result.push({
      game: games[i],
      selected: false,
    });
  }

  return [...new Set(result)];
};

console.log('Clean UP');
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
    devApi.setSharedData(await gameList(200));
    devApi.setProcessFunction(
      async (
        sharedData: { game: IStatisticsGameModel; selected: boolean }[],
        apiClassData: IDevApiClassData
      ) => {
        console.log(`START PROCESS ${apiClassData.key}`);
        let unselectedList = sharedData.filter((data) => !data.selected);

        while (true) {
          while (unselectedList.length > 0) {
            const idx = Math.floor(Math.random() * unselectedList.length);
            if (!unselectedList[idx].selected) {
              try {
                unselectedList[idx].selected = true;

                await start(apiClassData.demacia, unselectedList[idx].game);
                console.log(
                  `[${new Date().toLocaleTimeString('ko-KR')}] ${apiClassData.key} Analyze ${
                    unselectedList[idx].game.gameId
                  }`
                );
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

          const newGameList = await gameList(200);
          if (newGameList.length === 0) {
            break;
          }
          sharedData.splice(0, sharedData.length);
          sharedData.push(...newGameList);
          console.log(`NEW ADD GAME ${newGameList.length}`);
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

async function start(demacia: Demacia, game: IStatisticsGameModel) {
  const gameModel = await StatisticsGame.findOne({ gameId: game.gameId });
  if (!gameModel || (gameModel && gameModel.isReady)) {
    return;
  }

  let timeline = await GameTimeline.findOne({ gameId: game.gameId });
  if (!timeline) {
    return;
  }

  try {
    const getGameVersion = (version: string) => {
      const temp = version.split('.');
      return `${temp[0]}.${temp[1]}`;
    };
    const gameVersion = getGameVersion(game.gameVersion);

    const consumedItemList = await getConsumedStaticItemIdList();
    const finalItemList = await getFinalStaticItemIdList();
    const shoesItemList = await getShoesStaticItemIdList();

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
      if (positions[participantId] !== POSITION.UNKNOWN) {
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
            const summonerApiData = await demacia.getSummonerByName(summonerData.summonerName);
            const summonerLeagueApiData = await demacia.getLeagueBySummonerId(summonerApiData.id);

            let rank = '';
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
          const spells = [participantData.spell1Id, participantData.spell2Id].sort((a, b) => a - b);
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

          gameModel.isAnalyze[participantId] = true;
        } catch (err) {
          if (err.response && err.response.status === 403) {
            return Promise.reject(err);
          }

          console.error(`[GAME PARTICIPANT ${participantId} ANALYZE ERROR]`);
          if (err.response) {
            console.log(err.response.data);
          } else {
            console.log(err);
          }

          gameModel.isAnalyze[participantId] = false;
        }
      }

      await StatisticsChampion.insertMany(champions);
    }

    gameModel.isReady = true;
    await gameModel.save();

    return Promise.resolve(true);
  } catch (err) {
    console.error('[GAME ANALYZE ERROR]');
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err);
    }

    gameModel.isReady = false;
    await gameModel.save();

    return Promise.reject(err);
  }
}

var port = process.env.PORT || 6666;
app.listen(port);
