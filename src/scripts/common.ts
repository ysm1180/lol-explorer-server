import axios from 'axios';
import * as express from 'express';
import mongo from '../db/mongo';
import DevApi from '../models/statistics/api';
import { LolDemaciaRunner, RunnerProcessFn } from './api';

export class Lock {
  private tip: Promise<void>;

  constructor() {
    this.tip = Promise.resolve<void>(undefined);
  }

  public async acquire(): Promise<() => void> {
    const oldTip = this.tip;
    let resolver = () => {};
    const promise = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    this.tip = oldTip.then(() => promise);
    return oldTip.then(() => resolver);
  }
}

export class LolStatisticsWrapper {
  private runner = new LolDemaciaRunner();

  constructor() {
    const app = express();
    mongo.connect();

    const router = express.Router();
    router.post('/add/:key', async (req, res, next) => {
      console.log(`RUN PROCESS`);
      this.runner.run(req.params.key);
      res.send('OK');
    });

    app.use('/api', router);

    var port = process.env.PORT || 6666;
    app.listen(port);
  }

  public async run(initData: any, processFunction: RunnerProcessFn) {
    this.runner.setSharedData(initData);

    let data = await DevApi.find();
    const keys = data.map((k) => k.key);

    const expiredFunction = async (key: string) => {
      await axios.post('http://localhost:5555/expired', { api_key: key });
      console.log(`EXPIRED ${key}`);
    };
    this.runner.setExpiredFn(expiredFunction);
    this.runner.setProcessFunction(processFunction);

    try {
      await this.runner.runAll(keys);
      console.log('END');
    } catch (err) {
      console.log(err);
    } finally {
      return Promise.resolve();
    }
  }
}
