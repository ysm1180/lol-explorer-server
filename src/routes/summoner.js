import axios from 'axios';
import { Router } from 'express';
import { escape } from 'querystring';
import { format } from 'util';
import { LOL_API, LOL_API_KEY } from '../constants';
import Summoner from '../models/summoner';
import Match from '../models/match';

const router = Router();

router.get('/:name', function(req, res, next) {
  Summoner.findOne(
    {
      name: req.params.name,
    },
    (err, summoner) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: err,
        });
      }

      if (!summoner) {
        const url = format(
          LOL_API.GET_SUMMONER_BY_NAME,
          escape(req.params.name)
        );
        axios({
          url: url,
          method: 'get',
          headers: {
            'X-Riot-Token': LOL_API_KEY,
          },
        })
          .then(response => {
            const data = response.data;
            const summoner = new Summoner(data);
            summoner.save();
            res.json(data);
          })
          .catch(err => {
            res
              .status(err.response.status)
              .json({ error: err.response.data.status });
          });
      } else {
        res.json(summoner);
      }
    }
  );
});

router.get('/matches/:accountId/:start/:count', function(req, res, next) {
  const start = Number(req.params.start);
  const count = Number(req.params.count);

  Match.find({
    summonerAccountId: req.params.accountId,
  })
    .sort({ timestamp: -1 })
    .skip(start)
    .limit(count)
    .exec(async (err, items) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: err,
        });
      }

      let matchList = items;
      if (items.length === 0) {
        const url = format(
          LOL_API.GET_MATCH_LIST_BY_ACCOUNT_ID,
          escape(req.params.accountId)
        );
        const response = await axios({
          url: url,
          method: 'get',
          headers: {
            'X-Riot-Token': LOL_API_KEY,
          },
        });
        matchList = response.data.matches;
        for (var i = 0; i < matchList.length; i++) {
          matchList[i].summonerAccountId = req.params.accountId;
        }
        const docs = await Match.collection.insertMany(matchList);
        console.info('%d matches were stored.', docs.insertedCount);

        matchList = matchList.slice(start, start + count);
      }

      res.json(matchList);
    });
});

export default router;
