import * as console from 'console';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as createError from 'http-errors';
import * as logger from 'morgan';
import * as path from 'path';
import mongo from './db/mongo';
import redis from './db/redis';
import { DDragonHelper } from './lib/demacia/data-dragon/ddragon-helper';
import { registerStaticChamionList, registerStaticItemList, registerStaticSpellList } from './models/util/static';
import * as router from './routes';
dotenv.config();

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/summoner', router.summonerRouter);
app.use('/static', router.staticRouter);

app.use(function(
  err: createError.HttpError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (err.response) {
    res.status(err.response.status || 500).json({
      message: err.response.statusText,
      data: err.response.data,
    });
  } else {
    res.status(err.status || 500).json({
      message: err.message,
      data: err.data,
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  // Redis
  redis.connect();

  // Mongo
  mongo.on('error', (_, ...args) => {
    console.error(...args);
  });
  mongo.once('open', () => {
    console.log('Connected to mongod server');
  });
  mongo.connect();

  DDragonHelper.getLatestVersion()
    .then((version) => {
      return DDragonHelper.downloadStaticDataByVersion(version).then(() => {
        return version;
      });
    })
    .then((version) => {
      return Promise.all([
        DDragonHelper.getChampionNameList(version),
        DDragonHelper.getItemList(version),
        DDragonHelper.getSummonerSpellList(version),
      ]);
    })
    .then(([champions, items, spells]) => {
      return Promise.all([
        registerStaticChamionList(champions),
        registerStaticItemList(items),
        registerStaticSpellList(spells),
      ]);
    });
}

var port = process.env.PORT || 3000;
app.listen(port);

export default app;
