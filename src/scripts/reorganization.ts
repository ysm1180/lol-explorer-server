import * as express from 'express';
import { Model } from 'mongoose';
import mongo from '../db/mongo';
import { POSITION } from '../lib/demacia/constants';
import GameTimeline from '../models/game-timeline';
import StatisticsChampionBan from '../models/statistics/champion_ban';
import StatisticsChampionFinalItem from '../models/statistics/champion_final_item';
import StatisticsChampionFinalItemBuild from '../models/statistics/champion_final_item_build';
import StatisticsChampionItemBuild from '../models/statistics/champion_item_build';
import StatisticsChampionMainItem from '../models/statistics/champion_main_item';
import StatisticsChampionPosition from '../models/statistics/champion_position';
import StatisticsChampionRivalFinalItem from '../models/statistics/champion_rival_final_item';
import StatisticsChampionRivalItemBuild from '../models/statistics/champion_rival_item_build';
import StatisticsChampionRivalMainItemBuild from '../models/statistics/champion_rival_main_item_build';
import StatisticsChampionRivalRune from '../models/statistics/champion_rival_rune_build';
import StatisticsChampionRivalShoes from '../models/statistics/champion_rival_shoes';
import StatisticsChampionRivalSkillSet from '../models/statistics/champion_rival_skill_set';
import StatisticsChampionRivalSpell from '../models/statistics/champion_rival_spell_build';
import StatisticsChampionRivalStartItem from '../models/statistics/champion_rival_start_item';
import StatisticsChampionRivalStat from '../models/statistics/champion_rival_stat';
import StatisticsChampionRune from '../models/statistics/champion_rune';
import StatisticsChampionShoes from '../models/statistics/champion_shoes';
import StatisticsChampionSkillSet from '../models/statistics/champion_skill_set';
import StatisticsChampionSpell from '../models/statistics/champion_spell';
import StatisticsChampionStartItem from '../models/statistics/champion_start_item';
import StatisticsChampionTimeWin from '../models/statistics/champion_time_win';
import StatisticsGame, { IStatisticsGameModel } from '../models/statistics/game';
import { getPositions } from '../models/util/game';
import {
  getConsumedItemIdList,
  getIntermediateItems,
  getShoesItemIdList,
  getSubItemsOfFinalItem,
} from '../models/util/static';
import * as statistics from '../models/util/statistics';
import {
  getItemEvents,
  getSkillLevelupSlots,
  getSoloKills,
  getStartItemIdList,
} from '../models/util/timeline';

const app = express();
mongo.connect();

const gameList = async (size: number) => {
  console.time('get');
  const games = await StatisticsGame.find({ isReady: false })
    .limit(size)
    .lean();

  StatisticsGame.bulkWrite(
    games.map((game: any) => ({
      updateOne: {
        filter: { gameId: game.gameId },
        update: {
          $set: {
            isReady: true,
          },
        },
      },
    }))
  );
  console.timeEnd('get');

  return games;
};

let savedData: any = {
  rival: {
    stat: {},
    rune: {},
    spell: {},
    skill: {},
    startItem: {},
    mainItem: {},
    itemBuild: {},
    finalItem: {},
    shoes: {},
  },
  ban: {},
  skill: {},
  spell: {},
  startItem: {},
  itemBuild: {},
  mainItem: {},
  finalItem: {},
  finalItemBuild: {},
  rune: {},
  position: {},
  shoes: {},
  time: {},
};

async function start(
  game: IStatisticsGameModel,
  {
    consumedItemList,
    shoesItemList,
    intermediateItems,
    subItemsOfFinalItem,
  }: {
    consumedItemList: number[];
    shoesItemList: number[];
    intermediateItems: { [id: string]: { itemId: number; into: number[] } };
    subItemsOfFinalItem: { [id: string]: string[] };
  }
) {
  const gameModel = await StatisticsGame.findOne({ gameId: game.gameId });
  if (!gameModel) {
    return Promise.resolve([]);
  }

  let timeline = await GameTimeline.findOne({ gameId: game.gameId });
  if (!timeline) {
    return Promise.resolve([]);
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
    savedData.ban = await statistics.saveChampionBans({
      data: savedData.ban,
      totalBannedChampions,
      gameVersion,
    });

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

    const savedParticipants = [];

    for (let i = 0; i < game.participantIdentities.length; i++) {
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
                (!!intermediateItems[item.itemId] || !!subItemsOfFinalItem[item.itemId])
              ) {
                const finals = itemBuild.filter((id) => !!subItemsOfFinalItem[id]);
                if (finals.length < 3) {
                  itemBuild.push(item.itemId);
                }
              }

              if (!consumedItemList.includes(item.itemId) && !!subItemsOfFinalItem[item.itemId]) {
                finalItemIds.push(item.itemId);
              }

              if (
                !consumedItemList.includes(item.itemId) &&
                !!subItemsOfFinalItem[item.itemId] &&
                !shoesItemList.includes(item.itemId)
              ) {
                mainItemIds.push(item.itemId);
              }

              if (
                finalShoes.itemId === 0 &&
                !consumedItemList.includes(item.itemId) &&
                !!subItemsOfFinalItem[item.itemId] &&
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
                (!!intermediateItems[item.itemId] || !!subItemsOfFinalItem[item.itemId])
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

          finalItemIds = finalItemIds.slice(0, 6);
          for (const finalItemId of finalItemIds) {
            savedData.finalItem = await statistics.saveChampionFinalItem({
              data: savedData.finalItem,
              championKey,
              position,
              gameVersion,
              isWin,
              item: finalItemId,
            });
          }

          mainItemIds = mainItemIds.slice(0, 3);
          const finals = itemBuild.filter((id) => !!subItemsOfFinalItem[id]);
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

            const insertedItemList = [];
            // 중간 아이템 개수 조절
            const cloneSubItems: { [key: string]: string[] } = {};
            const result = itemIds.map((id) => ({ itemId: id.toString(), used: false }));
            for (let j = 0; j < result.length; j++) {
              const itemId = result[j].itemId;
              if (!!subItemsOfFinalItem[itemId]) {
                cloneSubItems[itemId] = subItemsOfFinalItem[itemId].slice();

                for (let k = 0; k < j; k++) {
                  if (!result[k].used && cloneSubItems[itemId].includes(result[k].itemId)) {
                    const index = cloneSubItems[itemId].indexOf(result[k].itemId);
                    cloneSubItems[itemId].splice(index, 1);
                    result[k].used = true;
                  }
                }

                insertedItemList.push({
                  index: j,
                  items: [...cloneSubItems[itemId].map((item) => Number(item))],
                });
              }
            }

            insertedItemList.reverse().forEach((itemList) => {
              itemIds.splice(itemList.index, 0, ...itemList.items);
            });

            itemBuild = itemIds.slice();
          }
          const startItemIds = getStartItemIdList(timeline, participantId);

          savedData.spell = await statistics.saveChampionSpell({
            data: savedData.spell,
            championKey,
            position,
            gameVersion,
            isWin,
            spells,
          });

          savedData.rune = await statistics.saveChampionRune({
            data: savedData.rune,
            championKey,
            position,
            gameVersion,
            isWin,
            mainRuneStyle,
            mainRunes,
            subRuneStyle,
            subRunes,
            statRunes,
          });

          savedData.position = await statistics.saveChampionPosition({
            data: savedData.position,
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
          });

          if (startItemIds.length > 0) {
            savedData.startItem = await statistics.saveChampionStartItem({
              data: savedData.startItem,
              championKey,
              position,
              gameVersion,
              isWin,
              items: startItemIds,
            });
          }

          if (finalShoes.itemId !== 0) {
            savedData.shoes = await statistics.saveChampionShoes({
              data: savedData.shoes,
              championKey,
              position,
              gameVersion,
              isWin,
              shoes: finalShoes.itemId,
              timestamp: finalShoes.timestamp,
            });
          }

          if (skills.length >= 15) {
            savedData.skill = await statistics.saveChampionSkillSet({
              data: savedData.skill,
              championKey,
              position,
              gameVersion,
              isWin,
              skills,
            });
          }

          if (itemBuild.length > 0) {
            savedData.itemBuild = await statistics.saveChampionItemBuild({
              data: savedData.itemBuild,
              championKey,
              position,
              gameVersion,
              isWin,
              items: itemBuild,
            });
          }

          if (mainItemIds.length === 3) {
            savedData.mainItem = await statistics.saveChampionMainItems({
              data: savedData.mainItem,
              championKey,
              position,
              gameVersion,
              isWin,
              items: mainItemIds,
            });
          }

          if (finalItemIds.length >= 6) {
            savedData.finalItem = await statistics.saveChampionFinalItemBuild({
              data: savedData.finalItemBuild,
              championKey,
              position,
              gameVersion,
              isWin,
              items: finalItemIds,
            });
          }

          savedData.time = await statistics.saveChampionTimeWin({
            data: savedData.time,
            championKey,
            position,
            gameMinutes,
            gameVersion,
            isWin,
          });

          if (rivals[participantId]) {
            savedData.rival = await statistics.saveChampionRivalData({
              data: savedData.rival,
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
            });
          }

          savedParticipants.push(participantId);
        } catch (err) {
          console.error(`[GAME PARTICIPANT ${participantId} ANALYZE ERROR]`);
          console.log(err);
        }
      }
    }

    return Promise.resolve(savedParticipants);
  } catch (err) {
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err);
    }
    return Promise.reject(err);
  }
}

gameList(100).then(async (games) => {
  const consumedItemList = await getConsumedItemIdList();
  const intermediateItems = await getIntermediateItems();
  const subItemsOfFinalItem = await getSubItemsOfFinalItem();
  const shoesItemList = await getShoesItemIdList();

  if (games.length === 0) {
    console.log('END');
    return;
  }

  console.log('START');
  let isAnalyzeByGame: { [gameId: string]: boolean[] } = {};
  let savedGames = [];

  while (true) {
    const game = games.pop();

    try {
      isAnalyzeByGame[game.gameId] = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ];
      const savedParticipants = await start(game, {
        consumedItemList,
        shoesItemList,
        intermediateItems,
        subItemsOfFinalItem,
      });

      for (const participantId of savedParticipants) {
        isAnalyzeByGame[game.gameId][participantId] = true;
      }
      savedGames.push(game.gameId);
    } catch (err) {
      console.log(err);
    }

    if (games.length === 0) {
      StatisticsGame.bulkWrite(
        savedGames.map((gameId) => ({
          updateOne: {
            filter: { gameId },
            update: {
              $set: {
                isReady: true,
                isAnalyze: isAnalyzeByGame[gameId],
              },
            },
          },
        }))
      );

      const saveToDB = (dbData: any, database: Model<any>) => {
        const list = [];
        for (const key in dbData) {
          list.push({ data: { ...dbData[key] }, pk: JSON.parse(key) });
        }
        if (list.length > 0) {
          return database
            .bulkWrite(
              list.map((el) => ({
                updateOne: {
                  filter: { ...el.pk },
                  update: {
                    $set: { ...el.data },
                  },
                  upsert: true,
                },
              }))
            )
            .then(() => Promise.resolve());
        } else {
          return Promise.resolve();
        }
      };

      await Promise.all([
        saveToDB(savedData.rival.stat, StatisticsChampionRivalStat),
        saveToDB(savedData.rival.spell, StatisticsChampionRivalSpell),
        saveToDB(savedData.rival.rune, StatisticsChampionRivalRune),
        saveToDB(savedData.rival.startItem, StatisticsChampionRivalStartItem),
        saveToDB(savedData.rival.mainItem, StatisticsChampionRivalMainItemBuild),
        saveToDB(savedData.rival.itemBuild, StatisticsChampionRivalItemBuild),
        saveToDB(savedData.rival.finalItem, StatisticsChampionRivalFinalItem),
        saveToDB(savedData.rival.shoes, StatisticsChampionRivalShoes),
        saveToDB(savedData.rival.skill, StatisticsChampionRivalSkillSet),

        saveToDB(savedData.ban, StatisticsChampionBan),
        saveToDB(savedData.skill, StatisticsChampionSkillSet),
        saveToDB(savedData.spell, StatisticsChampionSpell),
        saveToDB(savedData.startItem, StatisticsChampionStartItem),
        saveToDB(savedData.itemBuild, StatisticsChampionItemBuild),
        saveToDB(savedData.mainItem, StatisticsChampionMainItem),
        saveToDB(savedData.finalItem, StatisticsChampionFinalItem),
        saveToDB(savedData.finalItemBuild, StatisticsChampionFinalItemBuild),
        saveToDB(savedData.rune, StatisticsChampionRune),
        saveToDB(savedData.position, StatisticsChampionPosition),
        saveToDB(savedData.shoes, StatisticsChampionShoes),
        saveToDB(savedData.time, StatisticsChampionTimeWin),
      ]);

      savedData = {
        rival: {
          stat: {},
          rune: {},
          spell: {},
          skill: {},
          startItem: {},
          mainItem: {},
          itemBuild: {},
          finalItem: {},
          shoes: {},
        },
        ban: {},
        skill: {},
        spell: {},
        startItem: {},
        itemBuild: {},
        mainItem: {},
        finalItem: {},
        finalItemBuild: {},
        rune: {},
        position: {},
        shoes: {},
        time: {},
      };
      isAnalyzeByGame = {};
      savedGames = [];

      games.push(...(await gameList(100)));
      console.log(`[${new Date().toLocaleTimeString('ko-KR')}] SAVED AND ADD GAME ${games.length}`);
      if (games.length === 0) {
        break;
      }
    }
  }

  console.log('END');
});

var port = process.env.PORT || 6667;
app.listen(port);
