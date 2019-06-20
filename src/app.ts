import * as console from 'console';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as createError from 'http-errors';
import * as logger from 'morgan';
import * as path from 'path';
import mongo from './db/mongo';
import { redisClient } from './db/redis';
import { DDragonHelper } from './lib/demacia/data-dragon/ddragon-helper';
import { registerStaticChamionList, registerStaticItemList, registerStaticSpellList } from './models/util/static';
import * as router from './routes';

const app = express();

app.use(logger('dev'));
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

app.use((req, res, next) => {
  next(createError(404));
});
app.use(function(
  err: createError.HttpError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    data: err.data,
  });
});

// Mongo
mongo.on('error', (_, ...args) => {
  console.error(...args);
});
mongo.once('open', () => {
  console.log('Connected to mongod server');
});
mongo.connect();

// Redis
redisClient.auth('XwUNb6ViW7knzlL2rEIZCOGybdJzEliQ', (err) => {
  if (err) {
    console.log(err);
  }
});

// Init
DDragonHelper.getLastestVersion()
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

// Run Server
var port = normalizePort(process.env.PORT || '3000');
app.listen(port);

function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

export default app;
