import axios from 'axios';
import { IGameApiData, ILeagueApiData, IMatchApiData, ISummonerApiData } from './models';
import { SummonerUtil } from './util/summoner-util';

export class Demacia {
  private apiUrl: string;

  constructor(private apiKey: string) {
    this.apiUrl = 'https://kr.api.riotgames.com/lol';
  }

  public getSummonerByAccountId(accountId: string) {
    return this.callLolApi<ISummonerApiData>(
      `${this.apiUrl}/summoner/v4/summoners/by-account/${accountId}`
    );
  }

  public getSummonerById(id: string) {
    return this.callLolApi<ISummonerApiData>(`${this.apiUrl}/summoner/v4/summoners/${escape(id)}`);
  }

  public getSummonerByName(name: string) {
    name = SummonerUtil.normalizeSummonerName(name);
    return this.callLolApi<ISummonerApiData>(
      `${this.apiUrl}/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`
    );
  }

  public getLeagueBySummonerId(id: string) {
    return this.callLolApi<ILeagueApiData[]>(
      `${this.apiUrl}/league/v4/entries/by-summoner/${escape(id)}`
    );
  }

  public getMatchListByAccountId(accountId: string) {
    return this.callLolApi<{ matches: IMatchApiData[] }>(
      `${this.apiUrl}/match/v4/matchlists/by-account/${accountId}`
    );
  }

  public getMatchInfoByGameId(gameId: number) {
    return this.callLolApi<IGameApiData>(`${this.apiUrl}/match/v4/matches/${gameId}`);
  }

  private parseToRateLimit(str: string): { [key: string]: number } {
    const result: { [key: string]: number } = {};

    const limits = str.split(',');
    limits.forEach((limitStr) => {
      const splitedStr = limitStr.split(':');
      const callCount = Number(splitedStr[0]);
      const seconds = splitedStr[1];
      result[seconds] = callCount;
    });

    return result;
  }

  private convertToRateLimitDisplay(rateLimits: { [key: string]: number }): string {
    const strs: string[] = [];
    for (const second in rateLimits) {
      strs.push(`${rateLimits[second]} calls per ${second} seconds`);
    }
    return strs.join(', ');
  }

  private callLolApi<T>(url: string, params: Object = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      axios({
        url: url,
        method: 'get',
        params: params,
        headers: {
          'X-Riot-Token': this.apiKey,
        },
      })
        .then((response) => {
          const headers = response.headers;
          const appRateLimit = this.parseToRateLimit(headers['x-app-rate-limit']);
          const appRateLimitCount = this.parseToRateLimit(headers['x-app-rate-limit-count']);
          const methodRateLimit = this.parseToRateLimit(headers['x-method-rate-limit']);
          const methodRateLimitCount = this.parseToRateLimit(headers['x-method-rate-limit-count']);

          let warning = false;
          for (var second in appRateLimit) {
            if (appRateLimit[second] <= appRateLimitCount[second]) {
              console.warn('*************** Closed to application rate limit ***************');
              console.warn(`     Limit : ${this.convertToRateLimitDisplay(appRateLimit)}`);
              console.warn(`     Current : ${this.convertToRateLimitDisplay(appRateLimitCount)}`);
              warning = true;
            }
          }

          for (var second in methodRateLimit) {
            if (methodRateLimit[second] <= methodRateLimitCount[second]) {
              console.warn('*************** Closed to method rate limit ***************');
              console.warn(`     Limit : ${this.convertToRateLimitDisplay(methodRateLimit)}`);
              console.warn(
                `     Current : ${this.convertToRateLimitDisplay(methodRateLimitCount)}`
              );
              warning = true;
            }
          }

          if (warning) {
            setTimeout(() => {
              resolve(response.data);
            }, 1000);
          } else {
            resolve(response.data);
          }
        })
        .catch((err) => {
          if (err.response.status === 429) {
            const headers = err.response.headers;
            let rateLimitType: string = headers['x-rate-limit-type'];
            let rateLimit = '';
            let rateLimitCount = '';
            let retryAfterSecond = 1;
            if (rateLimitType === 'application') {
              rateLimit = headers['x-app-rate-limit'];
              rateLimitCount = headers['x-app-rate-limit-count'];
              retryAfterSecond = Number(headers['retry-after']);
            } else if (rateLimitType === 'method') {
              rateLimit = headers['x-method-rate-limit'];
              rateLimitCount = headers['x-method-rate-limit-count'];
              retryAfterSecond = Number(headers['retry-after']);
            } else if (rateLimitType === 'service') {
              // inspect app rate
              rateLimit = headers['x-app-rate-limit'];
              rateLimitCount = headers['x-app-rate-limit-count'];
              retryAfterSecond = Number(headers['retry-after']);
            } else {
              rateLimitType = 'underlying-service';
              // inspect app rate
              rateLimit = headers['x-app-rate-limit'];
              rateLimitCount = headers['x-app-rate-limit-count'];
            }

            console.warn(
              `********************** Exceed ${rateLimitType.toUpperCase()} Rate Limit **********************`
            );
            if (rateLimit) {
              console.warn(
                `     Limit : ${this.convertToRateLimitDisplay(this.parseToRateLimit(rateLimit))}`
              );
            }
            if (rateLimitCount) {
              console.warn(
                `     Current : ${this.convertToRateLimitDisplay(
                  this.parseToRateLimit(rateLimitCount)
                )}`
              );
            }

            console.warn(`     Retry to call after ${retryAfterSecond} seconds`);
            setTimeout(() => {
              this.callLolApi<T>(url, params)
                .then((data) => {
                  console.log('     Success to recall by 429 Error');
                  resolve(data);
                })
                .catch((err) => {
                  reject(err);
                });
            }, retryAfterSecond * 1000);
          } else {
            reject(err);
          }
        });
    });
  }
}

export interface IAjaxGet<T> {
  url: string;
  params?: Object;
  data?: T;
}
