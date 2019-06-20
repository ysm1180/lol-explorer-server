import axios from 'axios';
import * as console from 'console';
import * as fs from 'fs';
import * as path from 'path';
import { DDragonHelper } from './demacia/data-dragon/ddragon-helper';

function parseToRateLimit(str: string): { [key: string]: number } {
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

function convertToRateLimitDisplay(rateLimits: { [key: string]: number }): string {
  const strs: string[] = [];
  for (const second in rateLimits) {
    strs.push(`${rateLimits[second]} calls per ${second} seconds`);
  }
  return strs.join(', ');
}

export interface IAjaxGet<T> {
  url: string;
  params?: Object;
  data?: T;
}

export function sequentialCallLolApis<T>(itemsOfArray: IAjaxGet<T>[][]) {
  return itemsOfArray.reduce((prevPromise: Promise<{ save: boolean; data: T }[]>, items) => {
    return prevPromise
      .then((chainResults: { save: boolean; data: T }[]) => {
        const promises: Promise<{ save: boolean; data: T }>[] = [];
        items.forEach((item) => {
          let promise;
          if (item.url !== '') {
            promise = callLolApi<T>(item.url, item.params).then((game) => {
              return {
                save: true,
                data: game,
              };
            });
          } else {
            promise = Promise.resolve(<T>item.data).then((game) => {
              return {
                save: false,
                data: game,
              };
            });
          }
          promises.push(promise);
        });
        return Promise.all(promises).then((currentResults) => {
          return [...chainResults, ...currentResults];
        });
      })
      .catch((err) => Promise.reject(err));
  }, Promise.resolve([]));
}

export function callLolApi<T>(url: string, params: Object = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    axios({
      url: url,
      method: 'get',
      params: params,
      headers: {
        'X-Riot-Token': LOL_API_KEY,
      },
    })
      .then((response) => {
        const headers = response.headers;
        const appRateLimit = parseToRateLimit(headers['x-app-rate-limit']);
        const appRateLimitCount = parseToRateLimit(headers['x-app-rate-limit-count']);
        const methodRateLimit = parseToRateLimit(headers['x-method-rate-limit']);
        const methodRateLimitCount = parseToRateLimit(headers['x-method-rate-limit-count']);

        let warning = false;
        for (var second in appRateLimit) {
          if (appRateLimit[second] <= appRateLimitCount[second]) {
            console.warn('*************** Closed to application rate limit ***************');
            console.warn(`     Limit : ${convertToRateLimitDisplay(appRateLimit)}`);
            console.warn(`     Current : ${convertToRateLimitDisplay(appRateLimitCount)}`);
            warning = true;
          }
        }

        for (var second in methodRateLimit) {
          if (methodRateLimit[second] <= methodRateLimitCount[second]) {
            console.warn('*************** Closed to method rate limit ***************');
            console.warn(`     Limit : ${convertToRateLimitDisplay(methodRateLimit)}`);
            console.warn(`     Current : ${convertToRateLimitDisplay(methodRateLimitCount)}`);
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
            console.warn(`     Limit : ${convertToRateLimitDisplay(parseToRateLimit(rateLimit))}`);
          }
          if (rateLimitCount) {
            console.warn(
              `     Current : ${convertToRateLimitDisplay(parseToRateLimit(rateLimitCount))}`
            );
          }

          console.warn(`     Retry to call after ${retryAfterSecond} seconds`);
          setTimeout(() => {
            callLolApi<T>(url, params)
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

export async function getLastVersion() {
  let version = await redisGetAsync('LOL_LAST_VERSION');
  if (!version) {
    const res = await axios.get(DDragonHelper.URL_VERSION());
    version = res.data[0];
    redisClient.set('LOL_LAST_VERSION', version, 'EX', 43200);
  }
  return version;
}

export async function getLastSeason() {
  let season = await redisGetAsync('LOL_LAST_SEASON_ID');
  if (!season) {
    try {
      const dataFolderPath = path.resolve(__dirname, 'data');
      const patchDataPath = path.resolve(dataFolderPath, 'patch.json');
      const jsonData = JSON.parse(fs.readFileSync(patchDataPath, { encoding: 'utf8' }));
      const patchData = jsonData.patches;

      const utcNow = new Date(new Date().toUTCString()).getTime();
      while (patchData.length) {
        const last = patchData.pop();
        if (last.start < utcNow) {
          season = last.season;
          break;
        }
      }

      redisClient.set('LOL_LAST_SEASON_ID', season, 'EX', 43200);
    } catch (err) {
      console.error(err);
    }
  }
  return Number(season);
}
