import { GAME_QUEUE_ID, LEAGUE_QUEUE_TYPE, POSITION } from '../lib/demacia/constants';
import { Demacia } from '../lib/demacia/demacia';
import GameTimeline from '../models/game-timeline';
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
import { Lock, LolStatisticsWrapper } from './common';

const wrapper = new LolStatisticsWrapper();
const lock = new Lock();
const highTiers = ['PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];

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

    const positions = await getPositions(game, timeline);
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
            let rank = '';
            try {
              const summonerApiData = await demacia.getSummonerByName(summonerData.summonerName);
              const summonerLeagueApiData = await demacia.getLeagueBySummonerId(summonerApiData.id);

              for (let j = 0; j < summonerLeagueApiData.length; j++) {
                if (summonerLeagueApiData[j].queueType == queueType) {
                  tier = summonerLeagueApiData[j].tier;
                  rank = summonerLeagueApiData[j].rank;
                }
              }
              if (highTiers.includes(tier)) {
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

          const gameMinutes = Math.floor(game.gameDuration / 60);

          const skills = getSkillLevelupSlots(timeline, participantId).slice(0, 15);
          const items = getItemEvents(timeline, participantId).sort(
            (a, b) => a.timestamp - b.timestamp
          );
          const position = positions[participantId];

          const gameId = game.gameId;
          const teamId = teamData.teamId;
          const championKey = participantData.championId;
          const spells = [participantData.spell1Id, participantData.spell2Id].sort((a, b) => a - b);
          const participantTimeline = participantData.timeline;

          const stats = participantData.stats;
          const isWin = stats.win;
          const mainRuneStyle = stats.perkPrimaryStyle;
          const mainRunes = [stats.perk0, stats.perk1, stats.perk2, stats.perk3];
          const subRuneStyle = stats.perkSubStyle;
          const subRunes = [stats.perk4, stats.perk5];
          const statRunes = [stats.statPerk0, stats.statPerk1, stats.statPerk2];

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

          if (highTiers.includes(tier)) {
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
                skills,
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

            if (purchasedItemIds.length >= 3) {
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
                killPercent: totalKillsByTeam[teamId] === 0 ? 0 :
                  (participantData.stats.kills + participantData.stats.assists) /
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

    await StatisticsChampion.insertMany(champions);

    return Promise.resolve();
  } catch (err) {
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err);
    }

    return Promise.reject(err);
  } finally {
    gameModel.isReady = true;
    await gameModel.save();
  }
}

gameList(1000).then((initData) => {
  if (initData.length === 0) {
    console.log('END');
    return;
  }

  let lockReleaser;
  wrapper.run(
    initData,
    async (sharedData: { game: IStatisticsGameModel; selected: boolean }[], apiClassData) => {
      console.log(`START PROCESS ${apiClassData.key}`);

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

            console.log(err);
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

        const newGameList = await gameList(1000);
        if (newGameList.length === 0) {
          lockReleaser();
          break;
        }

        sharedData.push(...newGameList);
        console.log(`NEW ADD GAME ${newGameList.length}`);

        lockReleaser();
      }
    }
  );
});
