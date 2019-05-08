import axios from 'axios';
import { Router } from 'express';
import { format } from 'util';
import { LOL_API, LOL_API_KEY } from '../constants';
import Game from '../models/game';

const router = Router();

router.get('/:gameId', function(req, res, next) {
  const gameId = Number(req.params.gameId);
  Game.findOne({ gameId: gameId }, (err, game) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: err,
      });
    }

    if (!game) {
      const url = format(LOL_API.GET_MATCH_INFO_BY_GAME_ID, gameId);
      axios({
        url: url,
        method: 'get',
        headers: {
          'X-Riot-Token': LOL_API_KEY,
        },
      }).then(response => {
        const gameData = response.data;
        game = new Game(gameData);
        game.save();

        res.json(game);
      });
    } else {
      res.json(game);
    }
  });
});

export default router;
