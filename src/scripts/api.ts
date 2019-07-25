import { Demacia } from '../lib/demacia/demacia';
import { STRATEGY } from '../lib/demacia/ratelimiter/ratelimiter';

type ExpiredFunction = (key: string) => Promise<void>;
type ProcessFunction = (dataArray: any[], classData: IDevApiClassData) => Promise<void>;
export interface IDevApiClassData {
  demacia: Demacia;
  key: string;
}

export class LolStatisticsWrapper {
  private sharedData: any;
  private expiredFunction: ExpiredFunction = () => Promise.resolve();
  private process: ProcessFunction = () => Promise.resolve();
  private running: { [key: string]: Promise<void> } = {};

  constructor() {}

  public removeKey(key: string) {
    delete this.running[key];
  }

  public setSharedData(data: any) {
    this.sharedData = data;
  }

  public setProcessFunction(fn: ProcessFunction) {
    this.process = fn;
  }

  public setExpiredFn(fn: ExpiredFunction) {
    this.expiredFunction = fn;
  }

  public run(key: string) {
    if (this.running[key]) {
      return this.running[key];
    }

    this.running[key] = Promise.resolve().then(() => {
      const classData: IDevApiClassData = {
        demacia: new Demacia(key, STRATEGY.SPREAD),
        key,
      };

      return this.process(this.sharedData, classData).catch((err) => {
        if (err.response && err.response.status === 403) {
          return this.expiredFunction(key);
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

export default new LolStatisticsWrapper();
