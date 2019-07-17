import { LANE, POSITION, RIFT_LANE, RIFT_ROLE } from '../../lib/demacia/constants';
import { ItemUtil } from '../../lib/demacia/util/item-util';
import { IGameModel } from '../game';
import GameChampion from '../game-champion';

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
    )!;
    const teamId = participantData.teamId;
    if (!result[teamId]) {
      result[teamId] = [];
    }

    const { lane, role } = participantData.timeline;
    const { item0, item1, item2, item3, item4, item5, item6 } = participantData.stats;
    const position = getFixedPosition(lane, role);
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

  return result;
}

export function predictPosition(
  positions: IParticipantPositionData[],
  unallocatedPositions: POSITION[]
) {
  if (unallocatedPositions.indexOf(POSITION.SUPPORT) !== -1) {
    const hasSupportItem = positions.find(
      (data) =>
        data.position === POSITION.UNKNOWN &&
        data.items.filter((item) => ItemUtil.isSupportItem(item)).length !== 0
    );
    if (hasSupportItem) {
      hasSupportItem.position = POSITION.SUPPORT;
      unallocatedPositions = unallocatedPositions.filter((p) => p !== POSITION.SUPPORT);
    }
  }

  if (unallocatedPositions.indexOf(POSITION.JUNGLE) !== -1) {
    const hasSmiteSpell = positions.find(
      (data) => data.position === POSITION.UNKNOWN && data.spells.indexOf(11) !== -1
    );
    if (hasSmiteSpell) {
      hasSmiteSpell.position = POSITION.JUNGLE;
      unallocatedPositions = unallocatedPositions.filter((p) => p !== POSITION.JUNGLE);
    }
  }

  if (unallocatedPositions.length === 1) {
    const unknown = positions.find((data) => data.position === POSITION.UNKNOWN);
    if (unknown) {
      unknown.position = unallocatedPositions[0];
    }
    unallocatedPositions = [];
  }
}
export function getPredictPositions(game: IGameModel) {
  const positions = getPositionDataByTeam(game);

  const unallocatedPositions: { [id: string]: POSITION[] } = {};
  for (const key of Object.keys(positions)) {
    if (!unallocatedPositions[key]) {
      unallocatedPositions[key] = [
        POSITION.TOP,
        POSITION.JUNGLE,
        POSITION.MID,
        POSITION.ADC,
        POSITION.SUPPORT,
      ];
    }

    const teamPosition = positions[key].map((data) => data.position);
    unallocatedPositions[key] = unallocatedPositions[key].filter((p) => !teamPosition.includes(p));
  }

  for (const [key, value] of Object.entries(unallocatedPositions)) {
    predictPosition(positions[key], value);
  }

  return positions;
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
