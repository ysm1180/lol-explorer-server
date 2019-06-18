import * as console from 'console';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as createError from 'http-errors';
import { connect, connection } from 'mongoose';
import * as logger from 'morgan';
import * as path from 'path';
import { updateAllStaticData } from './crontab/ddragon-data';
import { loadPatchFile } from './crontab/season';
import { redisClient } from './db/redis';
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

const db = connection;
db.on('error', console.error);
db.once('open', () => {
  console.log('Connected to mongod server');
});

const USER = 'ysm1180';
const PASSWORD = 'jesntaids0811';
const HOST = 'localhost';
const PORT = 27017;
const DATABASE = 'lol-explorer';

connect(
  `mongodb://${USER}:${PASSWORD}@${HOST}:${PORT}/${DATABASE}?retryWrites=true`,
  {
    useNewUrlParser: true,
  }
);

// Redis
redisClient.auth('XwUNb6ViW7knzlL2rEIZCOGybdJzEliQ', (err) => {
  if (err) {
    console.log(err);
  }
});

// Init
if (process.env.NODE_ENV === 'development') {
  loadPatchFile();
  updateAllStaticData();
}

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
