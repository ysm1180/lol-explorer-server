import { IGameModel } from '../game';
import GameChampion from '../game-champion';

export async function updateSummonerChampionAnalysisByGame(summonerAccountId: string, game: IGameModel) {
  try {
    const summoner = game.participantIdentities.find(
      (pi) => pi.player.accountId === summonerAccountId
    );
    if (summoner) {
      const participant = game.participants.find((p) => {
        return p.participantId === summoner.participantId;
      });

      if (participant) {
        const gameChampions = await GameChampion.find({
          summonerAccountId: summonerAccountId,
          platformId: game.platformId,
          championKey: participant.championId,
          queueId: game.queueId,
          mapId: game.mapId,
          seasonId: game.seasonId,
          gameVersion: game.gameVersion,
        }).limit(1);

        if (gameChampions.length === 0) {
          const gameChampion = new GameChampion({
            summonerAccountId: summonerAccountId,
            platformId: game.platformId,
            championKey: participant.championId,
            queueId: game.queueId,
            mapId: game.mapId,
            seasonId: game.seasonId,
            gameVersion: game.gameVersion,
            wins: participant.stats.win ? 1 : 0,
            losses: participant.stats.win ? 0 : 1,
            averageKills: participant.stats.kills,
            averageDeaths: participant.stats.deaths,
            averageAssists: participant.stats.assists,
            averageCS:
              participant.stats.totalMinionsKilled + participant.stats.neutralMinionsKilled,
            averageEarnedGold: participant.stats.goldEarned,
            averageGameDuration: game.gameDuration,
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

          await gameChampion.save();
        }
      }
    }

    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}
