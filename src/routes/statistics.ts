import { Router } from 'express';
import demacia from '../common/demacia';
import { POSITION, RIFT_POSITION } from '../lib/demacia/constants';
import Game from '../models/game';
import Champion from '../models/static/champion';
import Spell from '../models/static/spell';
import StatisticsChampions from '../models/statistics/champion';
import StatisticsChampionStartItem from '../models/statistics/champion_start_item';
import StatisticsChampionPosition from '../models/statistics/champion_position';
import StatisticsChampionSpell from '../models/statistics/champion_spell';
import {
  getPredictPositions,
  IParticipantPositionData,
  updateChampionAnalysisByGame,
} from '../models/util/game';
import GameTimeline from '../models/game-timeline';
import { getMostFrequentLane } from '../models/util/timeline';

const router = Router();

interface ITestPosition extends IParticipantPositionData {
  positionName?: string;
  spellName?: string[];
  championName?: string;
  mostLane?: string;
}

router.get('/champion/positions/:championId', async function(req, res, next) {
  try {
    const championId = Number(req.params.championId);

    const champion = await Champion.findOne({ key: championId });
    if (!champion) {
      res.status(404).json({
        status: {
          message: 'Champion id does not exist.',
          status_code: 404,
        },
      });
    }

    const arr = await StatisticsChampionPosition.aggregate([
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
          win: {
            $sum: '$win',
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.json(arr);
  } catch (err) {
    next(err);
  }
});

router.get('/champion/spells/:championId/:positionId', async function(req, res, next) {
  try {
    const championId = Number(req.params.championId);
    const positionId = Number(req.params.positionId);

    if (positionId < POSITION.TOP || positionId > POSITION.SUPPORT) {
      res.status(400).json({
        status: {
          message: 'Position id should be gratter than 0 and less than 6.',
          status_code: 400,
        },
      });
      return;
    }

    const champion = await Champion.findOne({ key: championId });
    if (!champion) {
      res.status(404).json({
        status: {
          message: 'Champion id does not exist.',
          status_code: 404,
        },
      });
      return;
    }

    const arr = await StatisticsChampionSpell.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $group: {
          _id: '$spells',
          count: {
            $sum: '$count',
          },
          win: {
            $sum: '$win',
          },
        },
      },
      {
        $sort: {
          count: -1,
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

router.get('/champion/startitems/:championId/:positionId', async function(req, res, next) {
  try {
    const championId = Number(req.params.championId);
    const positionId = Number(req.params.positionId);

    if (positionId < POSITION.TOP || positionId > POSITION.SUPPORT) {
      res.status(400).json({
        status: {
          message: 'Position id should be gratter than 0 and less than 6.',
          status_code: 400,
        },
      });
      return;
    }

    const champion = await Champion.findOne({ key: championId });
    if (!champion) {
      res.status(404).json({
        status: {
          message: 'Champion id does not exist.',
          status_code: 404,
        },
      });
      return;
    }

    const arr = await StatisticsChampionStartItem.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $unwind: {
          path: '$items',
        },
      },
      {
        $sort: {
          items: 1,
        },
      },
      {
        $group: {
          _id: '$_id',
          items: {
            $push: '$items',
          },
          count: {
            $first: '$count',
          },
          win: {
            $first: '$win',
          },
        },
      },
      {
        $group: {
          _id: '$items',
          count: {
            $sum: '$count',
          },
          win: {
            $sum: '$win',
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.json(arr);
  } catch (err) {
    next(err);
  }
});

router.get('/champion/perks/:championId/:positionId', async function(req, res, next) {
  try {
    const championId = Number(req.params.championId);
    const positionId = Number(req.params.positionId);

    if (positionId < POSITION.TOP || positionId > POSITION.SUPPORT) {
      res.status(400).json({
        status: {
          message: 'Position id should be gratter than 0 and less than 6.',
          status_code: 400,
        },
      });
      return;
    }

    const champion = await Champion.findOne({ key: championId });
    if (!champion) {
      res.status(404).json({
        status: {
          message: 'Champion id does not exist.',
          status_code: 404,
        },
      });
      return;
    }

    const arr = await StatisticsChampions.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
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
            perkPrimaryStyle: '$stats.perkPrimaryStyle',
            perkSubStyle: '$stats.perkSubStyle',
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
          count: 1,
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

router.get('/champion/perk/:championId/:positionId/:primary/:sub', async function(req, res, next) {
  try {
    const championId = Number(req.params.championId);
    const positionId = Number(req.params.positionId);

    if (positionId < POSITION.TOP || positionId > POSITION.SUPPORT) {
      res.status(400).json({
        status: {
          message: 'Position id should be gratter than 0 and less than 6.',
          status_code: 400,
        },
      });
      return;
    }

    const champion = await Champion.findOne({ key: championId });
    if (!champion) {
      res.status(404).json({
        status: {
          message: 'Champion id does not exist.',
          status_code: 404,
        },
      });
      return;
    }

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
          count: 1,
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

    let timeline = await GameTimeline.findOne({ gameId });
    if (!timeline) {
      const data = await demacia.getMatchTimelineByGameId(gameId);
      timeline = new GameTimeline({ ...data, gameId });
      timeline.save();
    }

    let game = await Game.findOne({ gameId });
    if (!game) {
      const data = await demacia.getMatchInfoByGameId(gameId);
      game = new Game(data);
      game.save();

      updateChampionAnalysisByGame(game, timeline);
    }

    const positions: { [id: string]: ITestPosition[] } = await getPredictPositions(game, timeline);

    for (const team of Object.values(positions)) {
      for (const value of Object.values(team)) {
        value.positionName = RIFT_POSITION[value.position];
        const spells = await Spell.find().in('key', value.spells);
        value.spellName = spells.map((spell) => spell.id);
        const champion = await Champion.findOne({ key: value.championId });
        value.championName = champion!.id;
        value.mostLane = getMostFrequentLane(timeline, value.participantId);
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
