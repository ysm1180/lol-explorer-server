import { Router } from 'express';
import demacia from '../common/demacia';
import { POSITION, RIFT_POSITION } from '../lib/demacia/constants';
import { DDragonHelper } from '../lib/demacia/data-dragon/ddragon-helper';
import Game from '../models/game';
import GameTimeline from '../models/game-timeline';
import Champion from '../models/static/champion';
import Spell from '../models/static/spell';
import StatisticsChampionBan from '../models/statistics/champion_ban';
import StatisticsChampionItem from '../models/statistics/champion_final_item_build';
import StatisticsChampionPosition from '../models/statistics/champion_position';
import StatisticsChampionRivalStat from '../models/statistics/champion_rival_stat';
import StatisticsChampionRune from '../models/statistics/champion_rune';
import StatisticsChampionShoes from '../models/statistics/champion_shoes';
import StatisticsChampionSpell from '../models/statistics/champion_spell';
import StatisticsChampionStartItem from '../models/statistics/champion_start_item';
import StatisticsGame from '../models/statistics/game';
import { getPredictPositions, IParticipantPositionData, updateChampionAnalysisByGame } from '../models/util/game';
import { getMostFrequentLane } from '../models/util/timeline';

const router = Router();

interface ITestPosition extends IParticipantPositionData {
  positionName?: string;
  spellName?: string[];
  championName?: string;
  mostLane?: string;
}

router.get('/champion/bans/:championId/:count', async function(req, res, next) {
  try {
    const championId = Number(req.params.championId);
    const count = Number(req.params.count);

    const champion = await Champion.findOne({ key: championId });
    if (!champion) {
      res.status(404).json({
        status: {
          message: 'Champion id does not exist.',
          status_code: 404,
        },
      });
    }

    const versions = (await DDragonHelper.getVersions()).slice(0, count).reverse();
    const result = [];
    for (const version of versions) {
      let gameVersion = version
        .split('.')
        .slice(0, 2)
        .join('.');
      const gameCount = await StatisticsGame.countDocuments({ gameVersion });
      const arr = await StatisticsChampionBan.aggregate([
        {
          $match: {
            championKey: championId,
            gameVersion,
          },
        },
        {
          $project: {
            _id: 0,
            count: 1,
            gameVersion: 1,
          },
        },
      ]);
      if (arr.length === 0) {
        arr.push({
          gameVersion,
          count: 0,
          totalCount: gameCount,
        });
      } else {
        arr[0].totalCount = gameCount;
      }

      result.push(arr[0]);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

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
        $match: {
          count: {
            $gt: 100,
          },
        },
      },
      {
        $sort: {
          count: -1,
          win: -1,
        },
      },
    ]);

    res.json(arr);
  } catch (err) {
    next(err);
  }
});

router.get('/champion/:championId/:positionId', async function(req, res, next) {
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

    const versions = (await DDragonHelper.getVersions()).slice(0, 2).reverse();
    const trends = [];
    for (const version of versions) {
      let gameVersion = version
        .split('.')
        .slice(0, 2)
        .join('.');
      const gameCount = await StatisticsGame.countDocuments({ gameVersion });
      const arr = await StatisticsChampionPosition.aggregate([
        {
          $match: {
            championKey: championId,
            position: positionId,
            gameVersion,
          },
        },
        {
          $project: {
            _id: 0,
            count: 1,
            win: 1,
            gameVersion: 1,
          },
        },
      ]);
      arr[0].totalCount = gameCount;

      trends.push(arr[0]);
    }

    const spells = await StatisticsChampionSpell.aggregate([
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
        $project: {
          _id: 0,
          spells: '$_id',
          count: 1,
          win: 1,
        },
      },
      {
        $sort: {
          count: -1,
          win: -1,
        },
      },
    ]);

    const startItems = await StatisticsChampionStartItem.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
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
        $project: {
          _id: 0,
          items: '$_id',
          count: 1,
          win: 1,
        },
      },
      {
        $sort: {
          count: -1,
          win: -1,
        },
      },
    ]);

    const easys = await StatisticsChampionRivalStat.aggregate([
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
          _id: 0,
          rivalChampionKey: '$_id',
          count: 1,
          win: 1,
          winRate: {
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
          count: { $gt: 50 },
          winRate: { $gte: 50 },
        },
      },
      {
        $sort: {
          winRate: -1,
        },
      },
    ]);

    const counters = await StatisticsChampionRivalStat.aggregate([
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
          _id: 0,
          rivalChampionKey: '$_id',
          count: 1,
          win: 1,
          winRate: {
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
          count: { $gt: 50 },
          winRate: { $lt: 50 },
        },
      },
      {
        $sort: {
          winRate: 1,
        },
      },
    ]);

    const runeGroups = await StatisticsChampionRune.aggregate([
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
        $project: {
          _id: 0,
          mainRuneStyle: '$_id.mainRuneStyle',
          mainRune: '$_id.mainRune',
          subRuneStyle: '$_id.subRuneStyle',
          count: 1,
          win: 1,
        },
      },
      {
        $sort: {
          count: -1,
          win: -1,
        },
      },
    ]);

    for (const runeGroup of runeGroups) {
      const mainRune = runeGroup.mainRune;
      const subRuneStyle = runeGroup.subRuneStyle;

      const runeDetail = await StatisticsChampionRune.aggregate([
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
          $project: {
            _id: 0,
            mainRunes: '$_id.mainRunes',
            subRunes: '$_id.subRunes',
            statRunes: '$_id.statRunes',
            count: 1,
            win: 1,
          },
        },
        {
          $sort: {
            count: -1,
            win: -1,
          },
        },
      ]);

      runeGroup.details = runeDetail;
    }

    const shoes = await StatisticsChampionShoes.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $group: {
          _id: {
            shoes: '$shoes',
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
        $project: {
          _id: 0,
          shoes: '$_id.shoes',
          count: 1,
          win: 1,
        },
      },
      {
        $sort: {
          count: -1,
          win: -1,
        },
      },
    ]);

    res.json({
      trends,
      spells,
      startItems,
      easys,
      counters,
      runeGroups,
      shoes,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/champion/recommend/:championId/:positionId', async function(req, res, next) {
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

    const runeTotalCount: number = (await StatisticsChampionRune.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: '$count',
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]))[0].count;
    const mostFrequencyRunes = await StatisticsChampionRune.aggregate([
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
            mainRunes: '$mainRunes',
            subRuneStyle: '$subRuneStyle',
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
        $project: {
          _id: 0,
          mainRuneStyle: '$_id.mainRuneStyle',
          subRuneStyle: '$_id.subRuneStyle',
          mainRunes: '$_id.mainRunes',
          subRunes: '$_id.subRunes',
          statRunes: '$_id.statRunes',
          count: 1,
          win: 1,
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);
    const mostWinRunes = await StatisticsChampionRune.aggregate([
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
            mainRunes: '$mainRunes',
            subRuneStyle: '$subRuneStyle',
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
        $match: {
          count: { $gt: runeTotalCount * 0.03 },
        },
      },
      {
        $project: {
          _id: 0,
          mainRuneStyle: '$_id.mainRuneStyle',
          subRuneStyle: '$_id.subRuneStyle',
          mainRunes: '$_id.mainRunes',
          subRunes: '$_id.subRunes',
          statRunes: '$_id.statRunes',
          count: 1,
          win: 1,
          winRate: {
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
          winRate: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);

    const spellTotalCount: number = (await StatisticsChampionSpell.aggregate([
      {
        $match: {
          championKey: championId,
          position: positionId,
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: '$count',
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]))[0].count;
    const mostFrequencySpells = await StatisticsChampionSpell.aggregate([
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
        $project: {
          _id: 0,
          spells: '$_id',
          count: 1,
          win: 1,
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);
    const mostWinSpells = await StatisticsChampionSpell.aggregate([
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
        $match: {
          count: { $gt: spellTotalCount * 0.03 },
        },
      },
      {
        $project: {
          _id: 0,
          spells: '$_id',
          count: 1,
          win: 1,
          winRate: {
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
          winRate: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);

    res.json({
      runes: {
        frequency: mostFrequencyRunes[0],
        win: mostWinRunes[0],
      },
      spells: {
        frequency: mostFrequencySpells[0],
        win: mostWinSpells[0],
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/items', async function(req, res, next) {
  try {
    let itemBuilds = (await StatisticsChampionItem.aggregate([
      {
        $group: {
          _id: {
            items: '$items',
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
        $project: {
          items: '$_id.items',
          count: 1,
          win: 1,
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 100,
      },
    ])) as { count: number; items: number[] }[];

    const version = await DDragonHelper.getLatestVersion();
    const staticItems = await DDragonHelper.getItemList(version);
    const result = [];
    for (const item of itemBuilds) {
      const names = [];
      for (const itemId of item.items) {
        names.push(staticItems[itemId].name);
      }
      result.push(item.count + ' : ' + names.join(' > '));
    }

    res.json(result);
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
