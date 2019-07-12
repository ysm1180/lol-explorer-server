import { Demacia } from '../lib/demacia/demacia';
import { STRATEGY } from '../lib/demacia/ratelimiter/ratelimiter';

type ExpiredFunction = (key: string) => Promise<void>;
type ProcessFunction = (dataArray: any[], classData: IDevApiClassData) => Promise<void>;
export interface IDevApiClassData {
  demacia: Demacia;
}

export class LolStatisticsWrapper {
  private libs: Demacia[] = [];
  private keys: string[] = [];
  private sharedData: any;
  private expiredFunction: ExpiredFunction = () => Promise.resolve();
  private process: ProcessFunction = () => Promise.resolve();
  private running: (Promise<void> | null)[] = [];

  constructor() {}

  public addKey(key: string) {
    this.keys.push(key);
    this.libs.push(new Demacia(key, STRATEGY.SPREAD));
    this.running.push(null);
  }

  public removeKey(key: string) {
    const index = this.keys.indexOf(key);
    if (index !== -1) {
      this.keys.splice(index, 1);
      this.libs.splice(index, 1);
      this.running.splice(index, 1);
    }
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

  public run(index: number) {
    if (this.running[index]) {
      return this.running[index];
    }

    this.running[index] = Promise.resolve().then(() => {
      const nameList: any[] = [];
      for (let i = 0; i < this.sharedData.length; i += this.keys.length) {
        nameList.push(this.sharedData[i + index]);
      }

      const classData: IDevApiClassData = {
        demacia: this.libs[index],
      };

      return this.process(nameList, classData).catch((err) => {
        if (err.response && err.response.status === 403) {
          return this.expiredFunction(this.keys[index]);
        } else {
          return Promise.reject(err);
        }
      });
    });

    return this.running[index];
  }

  public length() {
    return this.keys.length;
  }

  public async runAll() {
    const promises = [];
    for (let i = 0; i < this.keys.length; i++) {
      promises.push(this.run(i)!);
    }
    await Promise.all(promises);
  }
}

export default new LolStatisticsWrapper();
