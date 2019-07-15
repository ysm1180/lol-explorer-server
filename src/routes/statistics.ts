import { Router } from 'express';
import demacia from '../common/demacia';
import { RIFT_POSITION } from '../lib/demacia/constants';
import Game from '../models/game';
import Champion from '../models/static/champion';
import Spell from '../models/static/spell';
import StatisticsChampions from '../models/statistics/champion';
import { getPredictPositions, IParticipantPositionData, updateChampionAnalysisByGame } from '../models/util/game';

const router = Router();

interface ITestPosition extends IParticipantPositionData {
  positionName?: string;
  spellName?: string[];
  championName?: string;
}

router.get('/champion/:championId', async function(req, res, next) {
  try {
    const championId = Number(req.params.championId);
    const arr = await StatisticsChampions.aggregate([
      {
        $match: {
          championKey: championId,
        },
      },
      {
        $unwind: {
          path: '$stats',
        },
      },
      {
        $facet: {
          totalCount: [
            {
              $count: 'value',
            },
          ],
          pipelineResults: [
            {
              $project: {
                _id: 1,
                championKey: 1,
                stats: 1,
                isWin: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$pipelineResults',
        },
      },
      {
        $unwind: {
          path: '$totalCount',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$pipelineResults',
              {
                totalCount: '$totalCount.value',
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            perk0: '$stats.perk0',
            perk1: '$stats.perk1',
            perk2: '$stats.perk2',
            perk3: '$stats.perk3',
            perk4: '$stats.perk4',
            statPerk0: '$stats.statPerk0',
            statPerk1: '$stats.statPerk1',
            statPerk2: '$stats.statPerk2',
          },
          count: {
            $sum: 1,
          },
          win: {
            $sum: {
              $cond: {
                if: {
                  $eq: ['$isWin', true],
                },
                then: 1,
                else: 0,
              },
            },
          },
          totalCount: {
            $min: '$totalCount',
          },
        },
      },
      {
        $project: {
          pick_rate: {
            $multiply: [
              {
                $divide: ['$count', '$totalCount'],
              },
              100,
            ],
          },
          win_rate: {
            $multiply: [
              {
                $divide: ['$win', '$count'],
              },
              100,
            ],
          },
        },
      },
      {
        $match: {
          pick_rate: {
            $gt: 10,
          },
        },
      },
      {
        $sort: {
          pick_rate: -1,
          win_rate: -1,
        },
      },
      {
        $limit: 2,
      },
    ]);

    res.json(arr);
  } catch (err) {
    next(err);
  }
});

router.get('/positions/:gameId', async function(req, res, next) {
  try {
    const gameId = Number(req.params.gameId);
    let game = await Game.findOne({ gameId });
    if (!game) {
      const data = await demacia.getMatchInfoByGameId(gameId);
      game = new Game(data);
      game.save();

      updateChampionAnalysisByGame(game);
    }

    const positions: { [id: string]: ITestPosition[] } = getPredictPositions(game);

    for (const team of Object.values(positions)) {
      for (const value of Object.values(team)) {
        value.positionName = RIFT_POSITION[value.position];
        const spells = await Spell.find().in('key', value.spells);
        value.spellName = spells.map((spell) => spell.id);
        const champion = await Champion.findOne({ key: value.championId });
        value.championName = champion!.id;
        delete value.spells;
        delete value.position;
      }
    }

    res.json(positions);
  } catch (err) {
    next(err);
  }
});

export default router;
