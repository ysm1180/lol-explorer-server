import { Demacia } from '../lib/demacia/demacia';
import { STRATEGY } from '../lib/demacia/ratelimiter/ratelimiter';

export type RunnerExpiredFn = (key: string) => Promise<void>;
export type RunnerProcessFn = (dataArray: any[], runnerData: IRunnerData) => Promise<void>;

export interface IRunnerData {
  demacia: Demacia;
  key: string;
}

export class LolDemaciaRunner {
  private sharedData: any;
  private expiredFunction: RunnerExpiredFn = () => Promise.resolve();
  private process: RunnerProcessFn = () => Promise.resolve();
  private running: { [key: string]: Promise<void> } = {};

  constructor() {}

  private removeKey(key: string) {
    delete this.running[key];
  }

  public setSharedData(data: any) {
    this.sharedData = data;
  }

  public setProcessFunction(fn: RunnerProcessFn) {
    this.process = fn;
  }

  public setExpiredFn(fn: RunnerExpiredFn) {
    this.expiredFunction = fn;
  }

  public run(key: string) {
    if (this.running[key]) {
      return this.running[key];
    }

    this.running[key] = Promise.resolve().then(() => {
      const classData: IRunnerData = {
        demacia: new Demacia(key, STRATEGY.SPREAD),
        key,
      };

      return this.process(this.sharedData, classData).catch((err) => {
        if (err.response && err.response.status === 403) {
          return this.expiredFunction(key).then(() => this.removeKey(key));
        } else {
          return Promise.reject(err);
        }
      });
    });

    return this.running[key];
  }

  public runAll(keys: string[]) {
    const promises = [];
    for (let i = 0; i < keys.length; i++) {
      promises.push(this.run(keys[i])!);
    }

    return Promise.all(promises).catch((err) => {
      console.log('[CRITICAL ERROR!]');
      console.log(err);
      return Promise.reject(err);
    });
  }
}

export default new LolDemaciaRunner();
