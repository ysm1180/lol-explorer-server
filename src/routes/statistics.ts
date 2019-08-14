import { Router } from 'express';
import demacia from '../common/demacia';
import { POSITION, RIFT_POSITION } from '../lib/demacia/constants';
import Game from '../models/game';
import GameTimeline from '../models/game-timeline';
import Champion from '../models/static/champion';
import Spell from '../models/static/spell';
import StatisticsChampionPosition from '../models/statistics/champion_position';
import StatisticsChampionRivalStat from '../models/statistics/champion_rival_stat';
import StatisticsChampionRune from '../models/statistics/champion_rune';
import StatisticsChampionSpell from '../models/statistics/champion_spell';
import StatisticsChampionStartItem from '../models/statistics/champion_start_item';
import { getPredictPositions, IParticipantPositionData, updateChampionAnalysisByGame } from '../models/util/game';
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

router.get('/champion/easys/:championId/:positionId', async function(req, res, next) {
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

    const arr = await StatisticsChampionRivalStat.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $group: {
          _id: '$rivalChampionKey',
          count: {
            $sum: '$count',
          },
          win: {
            $sum: '$win',
          },
        },
      },
      {
        $project: {
          count: 1,
          win: 1,
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
          count: { $gt: 10 },
          win_rate: { $gte: 50 },
        },
      },
      {
        $sort: {
          win_rate: -1,
        },
      },
      {
        $limit: 6,
      },
    ]);

    res.json(arr);
  } catch (err) {
    next(err);
  }
});

router.get('/champion/counters/:championId/:positionId', async function(req, res, next) {
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

    const arr = await StatisticsChampionRivalStat.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $group: {
          _id: '$rivalChampionKey',
          count: {
            $sum: '$count',
          },
          win: {
            $sum: '$win',
          },
        },
      },
      {
        $project: {
          count: 1,
          win: 1,
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
          count: { $gt: 10 },
          win_rate: { $lt: 50 },
        },
      },
      {
        $sort: {
          win_rate: 1,
        },
      },
      {
        $limit: 6,
      },
    ]);

    res.json(arr);
  } catch (err) {
    next(err);
  }
});

router.get('/champion/runes/:championId/:positionId', async function(req, res, next) {
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

    const arr = await StatisticsChampionRune.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $group: {
          _id: {
            mainRuneStyle: '$mainRuneStyle',
            mainRune: {
              $arrayElemAt: ['$mainRunes', 0],
            },
            subRuneStyle: '$subRuneStyle',
          },
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

router.get('/champion/rune/:championId/:positionId/:mainRune/:subRuneStyle', async function(
  req,
  res,
  next
) {
  try {
    const championId = Number(req.params.championId);
    const positionId = Number(req.params.positionId);
    const mainRune = Number(req.params.mainRune);
    const subRuneStyle = Number(req.params.subRuneStyle);

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

    const arr = await StatisticsChampionRune.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
          'mainRunes.0': mainRune,
          subRuneStyle: subRuneStyle,
        },
      },
      {
        $group: {
          _id: {
            mainRunes: '$mainRunes',
            subRunes: '$subRunes',
            statRunes: '$statRunes',
          },
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
