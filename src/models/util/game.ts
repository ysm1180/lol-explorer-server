import { LANE, POSITION, RIFT_LANE, RIFT_POSITION, RIFT_ROLE } from '../../lib/demacia/constants';
import { ItemUtil } from '../../lib/demacia/util/item-util';
import { IGameModel } from '../game';
import GameChampion from '../game-champion';
import StatisticsChampionPositions from '../statistics/champion_position';

export interface IParticipantPositionData {
  participantId: number;
  position: POSITION;
  championId: number;
  spells: number[];
  items: number[];
  lane: string;
  role: string;
}

export function getFixedPosition(
  lane: 'TOP' | 'MID' | 'MIDDLE' | 'BOTTOM' | 'NONE' | 'JUNGLE',
  role: string
) {
  let position = POSITION.UNKNOWN;
  if (RIFT_LANE[lane] === LANE.TOP_LANE && role === RIFT_ROLE.SOLO) {
    position = POSITION.TOP;
  } else if (RIFT_LANE[lane] === LANE.MID_LANE && role === RIFT_ROLE.SOLO) {
    position = POSITION.MID;
  } else if (RIFT_LANE[lane] === LANE.JUNGLE && role === RIFT_ROLE.NONE) {
    position = POSITION.JUNGLE;
  } else if (RIFT_LANE[lane] === LANE.BOT_LANE && role === RIFT_ROLE.DUO_CARRY) {
    position = POSITION.ADC;
  } else if (RIFT_LANE[lane] === LANE.BOT_LANE && role === RIFT_ROLE.DUO_SUPPORT) {
    position = POSITION.SUPPORT;
  }

  return position;
}

export function getPositionDataByTeam(game: IGameModel) {
  const result: {
    [teamId: string]: IParticipantPositionData[];
  } = {};

  for (let i = 0; i < game.participantIdentities.length; i++) {
    const participantId = game.participantIdentities[i].participantId;
    const participantData = game.participants.find(
      (participant) => participant.participantId === participantId
    );
    if (participantData) {
      const teamId = participantData.teamId;
      if (!result[teamId]) {
        result[teamId] = [];
      }

      const { lane, role } = participantData.timeline;
      const { item0, item1, item2, item3, item4, item5, item6 } = participantData.stats;
      const duplicated = result[teamId].find((data) => data.lane === lane && data.role === role);
      let position = POSITION.UNKNOWN;
      if (duplicated) {
        duplicated.position = POSITION.UNKNOWN;
      } else {
        position = getFixedPosition(lane, role);
      }
      result[teamId].push({
        lane,
        role,
        participantId,
        position,
        championId: participantData.championId,
        spells: [participantData.spell1Id, participantData.spell2Id],
        items: [item0, item1, item2, item3, item4, item5, item6],
      });
    }
  }

  return result;
}

export async function getPlayRateByRole(championId: number) {
  const data = await StatisticsChampionPositions.aggregate([
    {
      $match: {
        championKey: championId,
      },
    },
    {
      $group: {
        _id: '$position',
        count: {
          $sum: '$count',
        },
      },
    },
  ]);

  let totalCount = 0;
  const playRate: { [position: string]: number } = {};
  for (let i = 0; i < data.length; i++) {
    totalCount += data[i].count;
  }

  for (let i = 0; i < data.length; i++) {
    playRate[data[i]._id] = data[i].count / totalCount;
  }

  return playRate;
}

async function getRoles(
  championRoles: { [id: string]: { [position: string]: number } },
  champions: number[],
  fixed: {
    top?: number;
    jungle?: number;
    mid?: number;
    adc?: number;
    support?: number;
  }
) {
  const permuteAll = (input: any[], used: any[]) => {
    const permArr: any[][] = [];
    for (let i = 0; i < input.length; i++) {
      const el = input.splice(i, 1)[0];
      used.push(el);
      if (input.length == 0) {
        return [used.slice()];
      }
      permArr.push(...permuteAll(input, used));
      input.splice(i, 0, el);
      used.pop();
    }
    return permArr;
  };

  let bestRoles: { [positionId: string]: number } = {} as any;
  if (fixed.top && fixed.jungle && fixed.mid && fixed.adc && fixed.support) {
    bestRoles = {
      [POSITION.TOP]: fixed.top,
      [POSITION.JUNGLE]: fixed.jungle,
      [POSITION.MID]: fixed.mid,
      [POSITION.ADC]: fixed.adc,
      [POSITION.SUPPORT]: fixed.support,
    };
  } else {
    bestRoles = {
      [POSITION.TOP]: champions[0],
      [POSITION.JUNGLE]: champions[1],
      [POSITION.MID]: champions[2],
      [POSITION.ADC]: champions[3],
      [POSITION.SUPPORT]: champions[4],
    };
    let bestPlayPercents = {
      [champions[0]]: championRoles[champions[0]][POSITION.TOP],
      [champions[1]]: championRoles[champions[1]][POSITION.JUNGLE],
      [champions[2]]: championRoles[champions[2]][POSITION.MID],
      [champions[3]]: championRoles[champions[3]][POSITION.ADC],
      [champions[4]]: championRoles[champions[4]][POSITION.SUPPORT],
    };
    let bestMetric = Object.values(bestPlayPercents).reduce((prev, cur) => prev + cur, 0) / 5;
    const championPermutation = permuteAll(champions, []);
    for (let i = 0; i < championPermutation.length; i++) {
      const _champions = championPermutation[i];
      if (fixed.top && fixed.top !== _champions[0]) {
        continue;
      }
      if (fixed.jungle && fixed.jungle !== _champions[1]) {
        continue;
      }
      if (fixed.mid && fixed.mid !== _champions[2]) {
        continue;
      }
      if (fixed.adc && fixed.adc !== _champions[3]) {
        continue;
      }
      if (fixed.support && fixed.support !== _champions[4]) {
        continue;
      }

      const percents = [
        championRoles[_champions[0]][POSITION.TOP],
        championRoles[_champions[1]][POSITION.JUNGLE],
        championRoles[_champions[2]][POSITION.MID],
        championRoles[_champions[3]][POSITION.ADC],
        championRoles[_champions[4]][POSITION.SUPPORT],
      ];
      const metric = percents.reduce((prev, cur) => prev + cur, 0) / 5;
      if (metric > bestMetric) {
        bestMetric = metric;
        bestRoles = {
          [POSITION.TOP]: _champions[0],
          [POSITION.JUNGLE]: _champions[1],
          [POSITION.MID]: _champions[2],
          [POSITION.ADC]: _champions[3],
          [POSITION.SUPPORT]: _champions[4],
        };
        bestPlayPercents = {
          [_champions[0]]: championRoles[_champions[0]][POSITION.TOP],
          [_champions[1]]: championRoles[_champions[1]][POSITION.JUNGLE],
          [_champions[2]]: championRoles[_champions[2]][POSITION.MID],
          [_champions[3]]: championRoles[_champions[3]][POSITION.ADC],
          [_champions[4]]: championRoles[_champions[4]][POSITION.SUPPORT],
        };
      }
    }
  }

  return bestRoles;
}

export async function predictPosition(
  positions: IParticipantPositionData[],
  fixedPositions: { [position: string]: number }
) {
  const championRoles: { [id: string]: { [position: string]: number } } = {};
  for (const data of positions) {
    const championPlayRate = await getPlayRateByRole(data.championId);
    if (!Object.values(fixedPositions).includes(data.championId)) {
      for (const fixedPositionId of Object.keys(fixedPositions)) {
        const playRate = championPlayRate[fixedPositionId];
        championPlayRate[fixedPositionId] = -1;
        let distributeRate = 0;
        if (playRate > 0) {
          const values = Object.values(championPlayRate);
          const rolesLeft = values.reduce((acc, cur) => {
            return cur > 0 ? acc + 1 : acc;
          }, 0);
          if (rolesLeft > 0) {
            distributeRate = playRate / rolesLeft;
          }
        }

        for (const positionId of Object.keys(championPlayRate)) {
          if (championPlayRate[positionId] > 0) {
            championPlayRate[positionId] += distributeRate;
          }
        }
      }
    }
    championRoles[data.championId] = championPlayRate;
  }

  const champions = positions.map((data) => data.championId);
  const fixed: { [position: string]: number } = {};
  for (const fixedPositionKey of Object.keys(fixedPositions)) {
    const positionId = Number(fixedPositionKey) as POSITION;
    fixed[RIFT_POSITION[positionId].toLowerCase()] = fixedPositions[fixedPositionKey];
  }

  const bestRoles = await getRoles(championRoles, champions, fixed);
  const result: { [participantId: string]: POSITION } = {};
  for (const [key, value] of Object.entries(bestRoles)) {
    for (const data of positions) {
      if (value === data.championId) {
        result[data.participantId] = Number(key);
      }
    }
  }

  return result;
}

export async function getPredictPositions(game: IGameModel) {
  const positionsByTeam = getPositionDataByTeam(game);

  for (const [, positions] of Object.entries(positionsByTeam)) {
    const fixedPostion: { [id: string]: number } = {};
    for (const data of positions) {
      if (data.position !== POSITION.UNKNOWN) {
        fixedPostion[data.position] = data.championId;
      }
    }

    if (!fixedPostion[POSITION.JUNGLE]) {
      const hasSmiteSpell = positions.filter(
        (data) => data.position === POSITION.UNKNOWN && data.spells.indexOf(11) !== -1
      );
      if (hasSmiteSpell.length === 1) {
        hasSmiteSpell[0].position = POSITION.JUNGLE;
        fixedPostion[POSITION.JUNGLE] = hasSmiteSpell[0].championId;
      }
    }

    if (!fixedPostion[POSITION.SUPPORT]) {
      const hasSupportItem = positions.filter(
        (data) =>
          data.position === POSITION.UNKNOWN &&
          data.items.filter((item) => ItemUtil.isSupportItem(item)).length !== 0
      );
      if (hasSupportItem.length === 1) {
        hasSupportItem[0].position = POSITION.SUPPORT;
        fixedPostion[POSITION.SUPPORT] = hasSupportItem[0].championId;
      }
    }

    const bestPosition = await predictPosition(positions, fixedPostion);
    for (let i = 0; i < positions.length; i++) {
      positions[i].position = bestPosition[positions[i].participantId];
    }
  }

  return positionsByTeam;
}

export function getPositions(game: IGameModel) {
  const positions = getPredictPositions(game);

  const temp = [];
  for (const value of Object.values(positions)) {
    temp.push(...value);
  }

  const result: { [id: string]: POSITION } = {};
  for (let i = 0; i < temp.length; i++) {
    result[temp[i].participantId] = temp[i].position;
  }

  return result;
}

export async function updateChampionAnalysisByGame(game: IGameModel) {
  try {
    const summoners = game.participantIdentities;
    const positions = getPositions(game);
    for (let i = 0; i < summoners.length; i++) {
      const participant = game.participants.find((p) => {
        return p.participantId === summoners[i].participantId;
      });
      const accountId = summoners[i].player.accountId;
      const gameVersion = () => {
        const temp = game.gameVersion.split('.');
        return `${temp[0]}.${temp[1]}`;
      };
      if (participant) {
        const gameChampions = await GameChampion.find({
          summonerAccountId: accountId,
          platformId: game.platformId,
          championKey: participant.championId,
          queueId: game.queueId,
          mapId: game.mapId,
          seasonId: game.seasonId,
          gameVersion: gameVersion(),
          predictPosition: positions[participant.participantId],
        }).limit(1);

        if (gameChampions.length === 0) {
          const gameChampion = new GameChampion({
            summonerAccountId: accountId,
            platformId: game.platformId,
            championKey: participant.championId,
            queueId: game.queueId,
            mapId: game.mapId,
            seasonId: game.seasonId,
            gameVersion: gameVersion(),
            wins: participant.stats.win ? 1 : 0,
            losses: participant.stats.win ? 0 : 1,
            averageKills: participant.stats.kills,
            averageDeaths: participant.stats.deaths,
            averageAssists: participant.stats.assists,
            averageCS:
              participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled,
            averageEarnedGold: participant.stats.goldEarned,
            averageGameDuration: game.gameDuration,
            doubleKills: participant.stats.doubleKills,
            tripleKills: participant.stats.tripleKills,
            quadraKills: participant.stats.quadraKills,
            pentaKills: participant.stats.pentaKills,
            predictPosition: positions[participant.participantId],
          });

          await gameChampion.save();
        } else {
          const gameChampion = gameChampions[0];

          gameChampion.wins += participant.stats.win ? 1 : 0;
          gameChampion.losses += participant.stats.win ? 0 : 1;
          gameChampion.averageKills = (gameChampion.averageKills + participant.stats.kills) / 2;
          gameChampion.averageDeaths = (gameChampion.averageDeaths + participant.stats.deaths) / 2;
          gameChampion.averageAssists =
            (gameChampion.averageAssists + participant.stats.assists) / 2;
          gameChampion.averageCS =
            (gameChampion.averageCS +
              participant.stats.totalMinionsKilled +
              participant.stats.neutralMinionsKilled) /
            2;
          gameChampion.averageEarnedGold =
            (gameChampion.averageEarnedGold + participant.stats.goldEarned) / 2;
          gameChampion.averageGameDuration =
            (gameChampion.averageGameDuration + game.gameDuration) / 2;
          gameChampion.doubleKills = participant.stats.doubleKills;
          gameChampion.tripleKills = participant.stats.tripleKills;
          gameChampion.quadraKills = participant.stats.quadraKills;
          gameChampion.pentaKills = participant.stats.pentaKills;

          await gameChampion.save();
        }
      }
    }

    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}
