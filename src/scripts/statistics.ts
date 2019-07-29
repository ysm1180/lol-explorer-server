import axios from 'axios';
import * as express from 'express';
import mongo from '../db/mongo';
import { GAME_QUEUE_ID, LEAGUE_QUEUE_TYPE, MAP_ID, POSITION } from '../lib/demacia/constants';
import { Demacia } from '../lib/demacia/demacia';
import { IGameParticipantData } from '../lib/demacia/models';
import GameTimeline from '../models/game-timeline';
import DevApi from '../models/statistics/api';
import StatisticsChampion from '../models/statistics/champion';
import StatisticsChampionBan from '../models/statistics/champion_ban';
import StatisticsChampionPosition from '../models/statistics/champion_position';
import StatisticsChampionPurchasedItem from '../models/statistics/champion_purchased_item';
import StatisticsChampionRune from '../models/statistics/champion_rune';
import StatisticsChampionSkillSet from '../models/statistics/champion_skill_set';
import StatisticsChampionSpell from '../models/statistics/champion_spell';
import StatisticsChampionStartItem from '../models/statistics/champion_start_item';
import StatisticsChampionTimeWin from '../models/statistics/champion_time_win';
import StatisticsGame from '../models/statistics/game';
import StatisticsSummoner from '../models/statistics/summoner';
import { getPositions } from '../models/util/game';
import { getCombinedStaticItemIdList, getConsumedStaticItemIdList } from '../models/util/static';
import { getItemEvents, getSkillLevelupSlots } from '../models/util/timeline';
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
    devApi.setSharedData(await summonerList([], 1000));
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

          const newSummonerList = await summonerList(sharedData.map((data) => data.name), 1000);
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

async function saveChampionTimeWin({
  championKey,
  position,
  gameVersion,
  gameMinutes,
  isWin,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  gameMinutes: number;
  isWin: boolean;
}) {
  const count = await StatisticsChampionTimeWin.findOne({
    championKey,
    position,
    gameVersion,
    gameMinutes,
  });
  if (count) {
    count.count++;
    if (isWin) {
      count.win++;
    }
    count.save();
  } else {
    await new StatisticsChampionTimeWin({
      championKey,
      position,
      gameMinutes,
      gameVersion,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

async function saveChampionBans({
  totalBannedChampions,
  gameVersion,
}: {
  totalBannedChampions: number[];
  gameVersion: string;
}) {
  const championCount: { [id: string]: number } = {};
  for (const championId of totalBannedChampions) {
    if (!championCount[championId]) {
      championCount[championId] = 1;
    } else {
      championCount[championId]++;
    }
  }

  for (const championKey of Object.keys(championCount)) {
    const championBan = await StatisticsChampionBan.findOne({
      championKey,
      gameVersion,
    });
    if (championBan) {
      championBan.countByGame++;
      championBan.count += championCount[championKey];
      championBan.save();
    } else {
      await new StatisticsChampionBan({
        championKey,
        gameVersion,
        count: championCount[championKey],
        countByGame: 1,
      }).save();
    }
  }
}

async function saveChampionRune({
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
}: {
  championKey: number;
  tier: string;
  position: number;
  gameVersion: string;
  isWin: boolean;
  mainRuneStyle: number;
  mainRunes: number[];
  subRuneStyle: number;
  subRunes: number[];
  statRunes: number[];
}) {
  const rune = await StatisticsChampionRune.findOne({
    championKey,
    position,
    tier,
    gameVersion,
    mainRuneStyle,
    mainRunes,
    subRuneStyle,
    subRunes,
    statRunes,
  });
  if (rune) {
    rune.count++;
    if (isWin) {
      rune.win++;
    }
    rune.save();
  } else {
    await new StatisticsChampionRune({
      championKey,
      position,
      tier,
      gameVersion,
      mainRuneStyle,
      mainRunes,
      subRuneStyle,
      subRunes,
      statRunes,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

async function saveChampionSkillSet({
  championKey,
  tier,
  position,
  gameVersion,
  isWin,
  skills,
}: {
  championKey: number;
  tier: string;
  position: number;
  gameVersion: string;
  isWin: boolean;
  skills: number[];
}) {
  const skillset = await StatisticsChampionSkillSet.findOne({
    championKey,
    position,
    tier,
    gameVersion,
    skills,
  });
  if (skillset) {
    skillset.count++;
    if (isWin) {
      skillset.win++;
    }
    skillset.save();
  } else {
    await new StatisticsChampionSkillSet({
      championKey,
      position,
      tier,
      gameVersion,
      skills,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

async function saveChampionPurchasedItems({
  championKey,
  tier,
  position,
  gameVersion,
  isWin,
  items,
}: {
  championKey: number;
  tier: string;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const item = await StatisticsChampionPurchasedItem.findOne({
    championKey,
    position,
    tier,
    gameVersion,
    items,
  });
  if (item) {
    item.count++;
    if (isWin) {
      item.win++;
    }
    item.save();
  } else {
    await new StatisticsChampionPurchasedItem({
      championKey,
      position,
      tier,
      gameVersion,
      items,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

async function saveChampionSpell({
  championKey,
  tier,
  position,
  gameVersion,
  isWin,
  spells,
}: {
  championKey: number;
  tier: string;
  position: number;
  gameVersion: string;
  isWin: boolean;
  spells: number[];
}) {
  const spell = await StatisticsChampionSpell.findOne({
    championKey,
    position,
    tier,
    gameVersion,
    spells,
  });
  if (spell) {
    spell.count++;
    if (isWin) {
      spell.win++;
    }
    spell.save();
  } else {
    await new StatisticsChampionSpell({
      championKey,
      position,
      tier,
      gameVersion,
      spells,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

async function saveChampionStartItem({
  championKey,
  tier,
  position,
  gameVersion,
  isWin,
  items,
}: {
  championKey: number;
  tier: string;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const startItem = await StatisticsChampionStartItem.findOne({
    championKey,
    position,
    tier,
    gameVersion,
    items,
  });
  if (startItem) {
    startItem.count++;
    if (isWin) {
      startItem.win++;
    }
    startItem.save();
  } else {
    await new StatisticsChampionStartItem({
      championKey,
      position,
      tier,
      gameVersion,
      items,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}
async function saveChampionPosition({
  championKey,
  tier,
  position,
  gameVersion,
  isWin,
}: {
  championKey: number;
  tier: string;
  position: number;
  gameVersion: string;
  isWin: boolean;
}) {
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
    await new StatisticsChampionPosition({
      championKey,
      position,
      tier,
      gameVersion,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function analyzeGame(demacia: Demacia, gameId: number) {
  try {
    let game = await StatisticsGame.findOne({ gameId });
    if (!game) {
      const gameData = await demacia.getMatchInfoByGameId(gameId);
      game = new StatisticsGame(gameData);
    }

    let timeline = await GameTimeline.findOne({ gameId });
    if (!timeline) {
      const timelineData = await demacia.getMatchTimelineByGameId(gameId);
      timeline = new GameTimeline({ ...timelineData, gameId });
    }

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
      const combinedItemList = await getCombinedStaticItemIdList();

      game.isAnalyze = [false, false, false, false, false, false, false, false, false, false];
      await timeline.save();

      const positions = await getPositions(game);
      const champions = [];
      const teams = game.teams;

      const totalBannedChampions = [];
      for (const team of teams) {
        totalBannedChampions.push(...team.bans.map((ban) => ban.championId));
      }
      await saveChampionBans({ totalBannedChampions, gameVersion });

      const rivals: { [id: string]: IGameParticipantData } = {};
      for (let i = 0; i < game.participantIdentities.length; i++) {
        const participantId = game.participantIdentities[i].participantId;
        const participantData = game.participants.find(
          (participant) => participant.participantId === participantId
        )!;

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

          rivals[participantId] = rivalParticipantData;
        }
      }

      for (let i = 0; i < game.participantIdentities.length; i++) {
        const summonerData = game.participantIdentities[i].player;
        const participantId = game.participantIdentities[i].participantId;
        if (positions[participantId] !== POSITION.UNKNOWN && !game.isAnalyze[participantId]) {
          try {
            const summoner = await demacia.getSummonerByName(summonerData.summonerName);
            const summonerLeagueApiData = await demacia.getLeagueBySummonerId(summoner.id);

            game.isAnalyze[participantId] = true;

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
              for (const item of items) {
                if (item.type === 'ITEM_PURCHASED') {
                  if (
                    !consumedItemList.includes(item.itemId) &&
                    combinedItemList.includes(item.itemId)
                  ) {
                    purchasedItemIds.push(item.itemId);
                  }
                  totalPurchasedItemEvent.push(item);
                } else if (item.type === 'ITEM_UNDO') {
                  let index = purchasedItemIds.indexOf(item.itemId);
                  if (index !== -1) {
                    purchasedItemIds.splice(index, 1);
                  }

                  index = totalPurchasedItemEvent.findIndex(
                    (event) => event.itemId === item.itemId
                  );
                  if (index !== -1) {
                    totalPurchasedItemEvent.splice(index, 1);
                  }
                }
              }

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
              const startItemIds = totalPurchasedItemEvent
                .filter((item) => item.timestamp <= 60000)
                .map((item) => item.itemId)
                .sort((a, b) => a - b);


              await Promise.all([
                saveChampionTimeWin({
                  championKey,
                  position,
                  gameMinutes,
                  gameVersion,
                  isWin,
                }),
                saveChampionStartItem({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  items: startItemIds,
                }),
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
                saveChampionPurchasedItems({
                  championKey,
                  tier,
                  position,
                  gameVersion,
                  isWin,
                  items: purchasedItemIds,
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
            }
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

      await game.save();
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
