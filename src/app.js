import '@babel/polyfill';
import cookieParser from 'cookie-parser';
import express, { json, static as serverStatic, urlencoded } from 'express';
import createError from 'http-errors';
import { connect, connection } from 'mongoose';
import logger from 'morgan';
import { join } from 'path';
import { updateChampionData } from './crontab/champion';
import { updateSpellData } from './crontab/spell';
import { redisClient } from './db/redis';

import summonerRouter from './routes/summoner';
import gameRouter from './routes/game';

const app = express();

app.use(logger('dev'));
app.use(json());
app.use(
  urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(serverStatic(join(__dirname, 'public')));

app.use('/summoner', summonerRouter);
app.use('/game', gameRouter);

app.use((req, res, next) => {
  next(createError(404));
});

// mongo db
const db = connection;
db.on('error', console.error);
db.once('open', () => {
  console.log('Connected to mongod server');
});
connect(
  'mongodb+srv://gasi1180:jesntaids0811@gasi-cluster-v5yvl.mongodb.net/lol-explorer?retryWrites=true',
  {
    useNewUrlParser: true,
  }
);

redisClient.auth('XwUNb6ViW7knzlL2rEIZCOGybdJzEliQ', err => {
  if (err) {
    console.log(err);
  }
});

// init
updateChampionData();
updateSpellData();

export default app;
