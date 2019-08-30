import * as express from 'express';
import mongo from '../db/mongo';
import { POSITION } from '../lib/demacia/constants';
import GameTimeline from '../models/game-timeline';
import StatisticsGame, { IStatisticsGameModel } from '../models/statistics/game';
import { getPositions } from '../models/util/game';
import { getCombinedItemsByFinalItem, getConsumedItemIdList, getIntermediateItems, getShoesItemIdList } from '../models/util/static';
import * as statistics from '../models/util/statistics';
import { getItemEvents, getSkillLevelupSlots, getSoloKills, getStartItemIdList } from '../models/util/timeline';

const app = express();
mongo.connect();

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
        gameVersion: '9.17',
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
    result.push(games[i]);
  }

  return [...new Set(result)];
};

async function start(
  game: IStatisticsGameModel,
  {
    consumedItemList,
    shoesItemList,
    intermediateItems,
    combinedItemsByFinalItem,
  }: {
    consumedItemList: number[];
    shoesItemList: number[];
    intermediateItems: { [id: string]: { itemId: number; into: number[] } };
    combinedItemsByFinalItem: { [id: string]: string[] };
  }
) {
  const gameModel = await StatisticsGame.findOne({ gameId: game.gameId });
  if (!gameModel || (gameModel && gameModel.isReady)) {
    return;
  }

  let timeline = await GameTimeline.findOne({ gameId: game.gameId });
  if (!timeline) {
    return;
  }

  try {
    const gameVersion = game.gameVersion;

    const positions = await getPositions(game, timeline);
    const teams = game.teams;

    const totalBannedChampions = [];
    const totalKillsByTeam: { [id: string]: number } = {};
    for (const team of teams) {
      totalBannedChampions.push(...team.bans.map((ban) => ban.championId));
    }
    await statistics.saveChampionBans({ totalBannedChampions, gameVersion });

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

        if (
          positions[participantId] !== POSITION.UNKNOWN &&
          positions[participantId] !== positions[rivalParticipantId]
        ) {
          continue;
        }

        rivals[participantId] = {
          championKey: rivalParticipantData.championId,
          participantId: rivalParticipantData.participantId,
        };
      }
    }

    for (let i = 0; i < game.participantIdentities.length; i++) {
      const promises = [];
      const participantId = game.participantIdentities[i].participantId;
      if (positions[participantId] !== POSITION.UNKNOWN) {
        try {
          const participantData = game.participants.find(
            (participant) => participant.participantId === participantId
          )!;
          const teamData = game.teams.find((team) => team.teamId === participantData.teamId)!;

          const gameMinutes = Math.floor(game.gameDuration / 60);

          const skills = getSkillLevelupSlots(timeline, participantId).slice(0, 15);
          const items = getItemEvents(timeline, participantId).sort(
            (a, b) => a.timestamp - b.timestamp
          );
          const position = positions[participantId];

          const teamId = teamData.teamId;
          const championKey = participantData.championId;
          const spells = [participantData.spell1Id, participantData.spell2Id].sort((a, b) => a - b);
          const participantTimeline = participantData.timeline;

          const stats = {
            gameId: game.gameId,
            participantId: participantId,
            ...participantData.stats,
          };
          const isWin = stats.win;
          const mainRuneStyle = stats.perkPrimaryStyle;
          const mainRunes = [stats.perk0, stats.perk1, stats.perk2, stats.perk3];
          const subRuneStyle = stats.perkSubStyle;
          const subRunes = [stats.perk4, stats.perk5];
          const statRunes = [stats.statPerk0, stats.statPerk1, stats.statPerk2];

          const destroyedItemIds = [];
          let itemBuild: number[] = [];
          let mainItemIds = [];
          let finalItemIds = [];
          let finalShoes = {
            itemId: 0,
            timestamp: 0,
          };

          for (const item of items) {
            if (item.type === 'ITEM_PURCHASED') {
              if (
                !consumedItemList.includes(item.itemId) &&
                (!!intermediateItems[item.itemId] || !!combinedItemsByFinalItem[item.itemId])
              ) {
                const finals = itemBuild.filter((id) => !!combinedItemsByFinalItem[id]);
                if (finals.length < 3) {
                  itemBuild.push(item.itemId);
                }
              }

              if (
                !consumedItemList.includes(item.itemId) &&
                !!combinedItemsByFinalItem[item.itemId]
              ) {
                finalItemIds.push(item.itemId);
              }

              if (
                !consumedItemList.includes(item.itemId) &&
                !!combinedItemsByFinalItem[item.itemId] &&
                !shoesItemList.includes(item.itemId)
              ) {
                mainItemIds.push(item.itemId);
              }

              if (
                finalShoes.itemId === 0 &&
                !consumedItemList.includes(item.itemId) &&
                !!combinedItemsByFinalItem[item.itemId] &&
                shoesItemList.includes(item.itemId)
              ) {
                finalShoes.itemId = item.itemId;
                finalShoes.timestamp = item.timestamp;
              }
            } else if (item.type === 'ITEM_UNDO') {
              let index = finalItemIds.lastIndexOf(item.itemId);
              if (index !== -1) {
                finalItemIds.splice(index, 1);
              }

              if (
                !consumedItemList.includes(item.itemId) &&
                (!!intermediateItems[item.itemId] || !!combinedItemsByFinalItem[item.itemId])
              ) {
                index = itemBuild.lastIndexOf(item.itemId);
                if (index !== -1) {
                  itemBuild.splice(index, 1);
                }
              }
            } else if (item.type === 'ITEM_DESTROYED') {
              if (!consumedItemList.includes(item.itemId) && !!intermediateItems[item.itemId]) {
                destroyedItemIds.push(item.itemId);
              }
            }
          }
          for (const finalItemId of finalItemIds) {
            promises.push(
              statistics.saveChampionFinalItem({
                championKey,
                position,
                gameVersion,
                isWin,
                item: finalItemId,
              })
            );
          }
          finalItemIds = finalItemIds.slice(0, 6);
          mainItemIds = mainItemIds.slice(0, 3);
          const finals = itemBuild.filter((id) => !!combinedItemsByFinalItem[id]);
          if (finals.length !== 3) {
            itemBuild = [];
          } else {
            // const itemIds: number[] = [];
            // for (let i = 0; i < itemBuild.length; i++) {
            //   const itemId = itemBuild[i];
            //   const finalItems = itemBuild
            //     .slice(i + 1)
            //     .filter((id) => !!combinedItemsByFinalItem[id]);
            //   if (
            //     !!intermediateItems[itemId] &&
            //     intermediateItems[itemId].into.filter((id) => finalItems.includes(id)).length > 0
            //   ) {
            //     itemIds.push(itemId);
            //   } else if (!!combinedItemsByFinalItem[itemId]) {
            //     itemIds.push(itemId);
            //   } else {
            //     const index = destroyedItemIds.indexOf(itemId);
            //     if (index !== -1) {
            //       destroyedItemIds.splice(index, 1);
            //     }
            //   }
            // }

            const itemIds = itemBuild.slice();
            let removedItemIndexList: number[] = [];
            for (let j = 0; j < itemIds.length; j++) {
              const itemId = itemIds[j];
              for (let k = j + 1; k < itemIds.length; k++) {
                const combinedItemId = itemIds[k];
                if (
                  !!intermediateItems[itemId] &&
                  !!intermediateItems[combinedItemId] &&
                  intermediateItems[itemId].into.includes(combinedItemId) &&
                  destroyedItemIds.includes(itemId)
                ) {
                  const index = destroyedItemIds.indexOf(itemId);
                  if (index !== -1) {
                    destroyedItemIds.splice(index, 1);
                  }
                  removedItemIndexList.push(j);
                  break;
                }
              }
            }
            removedItemIndexList.reverse().forEach((index) => {
              itemIds.splice(index, 1);
            });
            removedItemIndexList = [];

            // 중간 아이템 개수 조절
            const cloneCombinedItemsByFinalItem: { [key: string]: string[] } = {};
            for (const key in combinedItemsByFinalItem) {
              cloneCombinedItemsByFinalItem[key] = [...combinedItemsByFinalItem[key]];
            }
            const result = itemIds.map((id) => ({ itemId: id.toString(), used: false }));
            for (let j = 0; j < result.length; j++) {
              const itemId = result[j].itemId;
              if (!!combinedItemsByFinalItem[itemId]) {
                let count = 0;
                for (let k = 0; k < j; k++) {
                  if (
                    !result[k].used &&
                    cloneCombinedItemsByFinalItem[itemId].includes(result[k].itemId)
                  ) {
                    const index = cloneCombinedItemsByFinalItem[itemId].indexOf(result[k].itemId);
                    cloneCombinedItemsByFinalItem[itemId].splice(index, 1);
                    result[k].used = true;
                    count++;
                    if (
                      combinedItemsByFinalItem[itemId].length > 1 &&
                      count > combinedItemsByFinalItem[itemId].length - 1
                    ) {
                      removedItemIndexList.push(k);
                    }
                  }
                }
              }
            }

            removedItemIndexList.reverse().forEach((index) => {
              itemIds.splice(index, 1);
            });
            itemBuild = itemIds.slice();
          }
          const startItemIds = getStartItemIdList(timeline, participantId);

          promises.push(
            ...[
              statistics.saveChampionSpell({
                championKey,
                position,
                gameVersion,
                isWin,
                spells,
              }),
              statistics.saveChampionRune({
                championKey,
                position,
                gameVersion,
                isWin,
                mainRuneStyle,
                mainRunes,
                subRuneStyle,
                subRunes,
                statRunes,
              }),
            ]
          );

          promises.push(
            statistics.saveChampionPosition({
              championKey,
              position,
              gameVersion,
              isWin,
              stats: {
                kills: stats.kills,
                deaths: stats.deaths,
                assists: stats.assists,
                damageTaken: stats.totalDamageTaken,
                goldEarned: stats.goldEarned,
                killPercent:
                  totalKillsByTeam[teamId] === 0
                    ? 0
                    : (participantData.stats.kills + participantData.stats.assists) /
                      totalKillsByTeam[teamId],
                timeCCingOthers: stats.timeCCingOthers,
                timeCrowdControlDealt: stats.totalTimeCrowdControlDealt,
                neutralMinionsKilled: stats.neutralMinionsKilled,
                neutralMinionsKilledTeamJungle: stats.neutralMinionsKilledTeamJungle,
                neutralMinionsKilledEnemyJungle: stats.neutralMinionsKilledEnemyJungle,
                damageSelfMitigated: stats.damageSelfMitigated,
                trueDamageDealtToChampions: stats.trueDamageDealtToChampions,
                magicDamageDealtToChampions: stats.magicDamageDealtToChampions,
                physicalDamageDealtToChampions: stats.physicalDamageDealtToChampions,
                heal: stats.totalHeal,
                unitsHealed: stats.totalUnitsHealed,
              },
            })
          );

          if (startItemIds.length > 0) {
            promises.push(
              statistics.saveChampionStartItem({
                championKey,
                position,
                gameVersion,
                isWin,
                items: startItemIds,
              })
            );
          }

          if (finalShoes.itemId !== 0) {
            promises.push(
              statistics.saveChampionShoes({
                championKey,
                position,
                gameVersion,
                isWin,
                shoes: finalShoes.itemId,
                timestamp: finalShoes.timestamp,
              })
            );
          }

          if (skills.length >= 15) {
            promises.push(
              statistics.saveChampionSkillSet({
                championKey,
                position,
                gameVersion,
                isWin,
                skills,
              })
            );
          }

          if (itemBuild.length > 0) {
            promises.push(
              statistics.saveChampionItemBuild({
                championKey,
                position,
                gameVersion,
                isWin,
                items: itemBuild,
              })
            );
          }

          if (mainItemIds.length === 3) {
            promises.push(
              statistics.saveChampionMainItems({
                championKey,
                position,
                gameVersion,
                isWin,
                items: mainItemIds,
              })
            );
          }

          if (finalItemIds.length >= 5) {
            promises.push(
              statistics.saveChampionFinalItemBuild({
                championKey,
                position,
                gameVersion,
                isWin,
                items: finalItemIds,
              })
            );
          }

          promises.push(
            statistics.saveChampionTimeWin({
              championKey,
              position,
              gameMinutes,
              gameVersion,
              isWin,
            })
          );

          if (rivals[participantId]) {
            promises.push(
              statistics.saveChampionRivalData({
                championKey,
                rivalChampionKey: rivals[participantId].championKey,
                position,
                gameVersion,
                isWin,
                shoes: {
                  itemId: finalShoes.itemId,
                  timestamp: finalShoes.timestamp,
                },
                finalItems: finalItemIds,
                items: mainItemIds,
                itemBuild: itemBuild,
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
                  csPerMinutes: participantTimeline.creepsPerMinDeltas,
                  goldPerMinutes: participantTimeline.goldPerMinDeltas,
                  killPercent:
                    totalKillsByTeam[teamId] === 0
                      ? 0
                      : (participantData.stats.kills + participantData.stats.assists) /
                        totalKillsByTeam[teamId],
                  soloKills: getSoloKills(
                    timeline,
                    participantId,
                    rivals[participantId].participantId
                  ),
                },
                skills,
              })
            );
          }

          await Promise.all(promises);

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
    }

    gameModel.isReady = true;

    return Promise.resolve();
  } catch (err) {
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err);
    }

    gameModel.isReady = false;

    return Promise.reject(err);
  } finally {
    await gameModel.save();
  }
}

gameList(1000).then(async (games) => {
  const consumedItemList = await getConsumedItemIdList();
  const intermediateItems = await getIntermediateItems();
  const combinedItemsByFinalItem = await getCombinedItemsByFinalItem();
  const shoesItemList = await getShoesItemIdList();

  if (games.length === 0) {
    console.log('END');
    return;
  }

  while (true) {
    const game = games.pop();

    try {
      await start(game, {
        consumedItemList,
        shoesItemList,
        intermediateItems,
        combinedItemsByFinalItem,
      });
      console.log(`[${new Date().toLocaleTimeString('ko-KR')}] ${game.gameId}`);
    } catch (err) {
      console.log(err);
    }

    if (games.length === 0) {
      games.push(...(await gameList(1000)));
      if (games.length === 0) {
        break;
      }
    }
  }

  console.log('END');
});

var port = process.env.PORT || 6667;
app.listen(port);
