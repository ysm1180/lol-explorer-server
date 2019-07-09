import axios, { AxiosRequestConfig } from 'axios';
import { RateLimit, RateLimitOptions, RATELIMIT_TYPE } from './ratelimit';
import { RateLimiter, STRATEGY } from './ratelimiter';

export class RiotRateLimiter {
  private static extractPlatformIdAndMethodFromUrl(url: string) {
    let platformId: string;
    let apiMethod: string = url.toLowerCase();

    platformId = url.match(/\/\/(.*?)\./)![1];

    // matches "by-something/whatever/",  "by-something/whatever" and "by-something/whatever?moreStuff"
    let regex = /by-.*?\/(.*?)\/|by-.*?\/(.*?$)|leagues\/(.*)|entries\/(.*)|matches\/(.*)|summoners\/(.*)/g;

    let regexResult = regex.exec(url);
    const regexResultsArr = [];
    while (regexResult !== null) {
      regexResultsArr.push(regexResult);
      regexResult = regex.exec(url);
    }

    regexResultsArr.reverse().forEach((result) => {
      // find first slash -> beginning of parameter
      const slashIndex = apiMethod.indexOf('/', result.index);
      apiMethod =
        apiMethod.substring(0, slashIndex + 1) +
        apiMethod.substring(result.index + result[0].length);

      apiMethod = apiMethod.replace(result[1], '');
    });

    apiMethod = apiMethod
      .replace(/\?.*/g, '') // removing query
      .replace(/\/\d+/g, '/'); // removing possible numeric parameter following "/"

    apiMethod = apiMethod.substring(apiMethod.search(/\w\/\w/) + 1); // cut off host before first / after //
    if (!platformId || !apiMethod)
      throw new Error('Could not extract PlatformId and Method from url: ' + url);
    return { platformId, apiMethod };
  }

  public static extractRateLimitFromHeader(
    type: RATELIMIT_TYPE,
    rateLimitHeader: string
  ): RateLimitOptions[] {
    return rateLimitHeader.split(',').map((limitString) => {
      const [requests, seconds] = limitString
        .split(':')
        .map((limitString) => parseInt(limitString));
      return <RateLimitOptions>{ requests, seconds, type };
    });
  }

  public static extractRateLimitCountsFromHeader(
    type: RATELIMIT_TYPE,
    rateLimitCountHeader: string
  ): RateLimitOptions[] {
    return rateLimitCountHeader.split(',').map((limitCountString) => {
      const [count, seconds] = limitCountString
        .split(':')
        .map((limitOrCountString) => parseInt(limitOrCountString));
      return <RateLimitOptions>{ count, seconds, type };
    });
  }

  private static addRequestsCountFromHeader(
    type: RATELIMIT_TYPE,
    updatedLimits: RateLimitOptions[],
    rateLimitCountHeader: string
  ): RateLimitOptions[] {
    const limitCounts = RiotRateLimiter.extractRateLimitCountsFromHeader(
      type,
      rateLimitCountHeader
    );

    return updatedLimits.map((options) => {
      const limitCountUpdate = limitCounts.find(
        (rateLimitCount) => rateLimitCount.seconds === options.seconds
      );
      if (limitCountUpdate) {
        options.count = limitCountUpdate.count;
      }
      return options;
    });
  }

  private limitersPerPlatformId: {
    [platformId: string]: {
      [apiMethod: string]: RateLimiter;
    };
  };

  private appLimits: RateLimit[] = [];

  constructor() {
    this.limitersPerPlatformId = {};
  }

  public executing<T>({
    url,
    token,
    strategy = STRATEGY.BURST,
  }: {
    url: string;
    token: string;
    strategy: STRATEGY;
  }): Promise<T> {
    const { platformId, apiMethod } = RiotRateLimiter.extractPlatformIdAndMethodFromUrl(url);

    if (!this.limitersPerPlatformId[platformId]) {
      this.limitersPerPlatformId[platformId] = {};
    }

    if (!this.limitersPerPlatformId[platformId][apiMethod]) {
      this.limitersPerPlatformId[platformId][apiMethod] = new RateLimiter({
        limits: [RateLimiter.createSyncRateLimit()],
        strategy,
      });
    }

    return this.limitersPerPlatformId[platformId][apiMethod].scheduling<T>(
      (rateLimiter: RateLimiter) => {
        return this.executingScheduledCallback<T>(rateLimiter, {
          url,
          token,
          strategy,
        });
      }
    );
  }

  private executingScheduledCallback<T>(
    rateLimiter: RateLimiter,
    {
      url,
      token,
      strategy = STRATEGY.BURST,
    }: {
      url: string;
      token: string;
      strategy: STRATEGY;
    }
  ): Promise<T> {
    return Promise.resolve().then(() => {
      let options: AxiosRequestConfig = {
        url: url,
        method: 'GET',
        headers: { 'X-Riot-Token': token },
      };

      return axios(options)
        .then((response) => {
          let updatedLimits: RateLimitOptions[] = [];

          if (response.headers['x-app-rate-limit']) {
            const appRateLimits = RiotRateLimiter.extractRateLimitFromHeader(
              RATELIMIT_TYPE.APP,
              response.headers['x-app-rate-limit']
            );

            if (response.headers['x-app-rate-limit-count']) {
              RiotRateLimiter.addRequestsCountFromHeader(
                RATELIMIT_TYPE.APP,
                appRateLimits,
                response.headers['x-app-rate-limit-count']
              );
            }

            this.updateAppRateLimits(appRateLimits);

            if (this.appLimits) {
              this.appLimits.forEach((limit) => {
                rateLimiter.addOrUpdateLimit(limit);
              });
              updatedLimits = updatedLimits.concat(appRateLimits);
            }
          }

          if (response.headers['x-method-rate-limit']) {
            const methodRateLimits = RiotRateLimiter.extractRateLimitFromHeader(
              RATELIMIT_TYPE.METHOD,
              response.headers['x-method-rate-limit']
            );

            if (response.headers['x-method-rate-limit-count']) {
              RiotRateLimiter.addRequestsCountFromHeader(
                RATELIMIT_TYPE.METHOD,
                methodRateLimits,
                response.headers['x-method-rate-limit-count']
              );
            }
            updatedLimits = updatedLimits.concat(methodRateLimits);
          }

          if (updatedLimits.length > 0) {
            rateLimiter.updateLimits(updatedLimits);
          } else if (rateLimiter.isInitializing()) {
            rateLimiter.addOrUpdateLimit(RateLimiter.createSyncRateLimit());
          }

          rateLimiter.resetBackoff();
          return response.data;
        })
        .catch((err) => {
          if (err.response.status !== 429) {
            throw err;
          } else {
            let retryAfterMS: number = 0;
            const headers = err.response.headers;
            if (headers['retry-after']) {
              console.warn(
                'Rate limit exceeded on X-Rate-Limit-Type: ' + headers['x-rate-limit-type']
              );
              console.warn('Backing off and continue requests after: ' + headers['retry-after']);
              console.warn('Request url: ' + url);

              retryAfterMS = parseInt(headers['retry-after']) * 1000;
            } else {
              console.warn('Rate limit exceeded on underlying system for ' + url);
            }

            rateLimiter.backoff({ retryAfterMS });

            console.warn('rescheduling request on ' + rateLimiter.toString());
            return rateLimiter.rescheduling<T>((rateLimiter: RateLimiter) => {
              return this.executingScheduledCallback<T>(rateLimiter, {
                url,
                token,
                strategy,
              });
            });
          }
        });
    });
  }

  public getLimitsForPlatformId(platformId: string): { [apiMethod: string]: RateLimit[] } {
    platformId = platformId.toLowerCase();
    const limitersForPlatform = this.limitersPerPlatformId[platformId];
    if (!limitersForPlatform) {
      return {};
    }

    const limits: { [method: string]: RateLimit[] } = {};
    for (let apiMethod in limitersForPlatform) {
      limits[apiMethod] = limitersForPlatform[apiMethod].getLimits();
    }
    return limits;
  }

  public getLimits(): { [platformId: string]: { [apiMethod: string]: RateLimit[] } } {
    const limits: { [platformId: string]: { [apiMethod: string]: RateLimit[] } } = {};
    if (!this.limitersPerPlatformId) {
      return limits;
    }

    for (let platformId in this.limitersPerPlatformId) {
      const limitersForPlatform = this.limitersPerPlatformId[platformId];
      if (!limitersForPlatform) {
        return limits;
      }

      for (let apiMethod in limitersForPlatform) {
        limits[platformId][apiMethod] = limitersForPlatform[apiMethod].getLimits();
      }
    }
    return limits;
  }

  private updateAppRateLimits(updateOptions: RateLimitOptions[] = []) {
    if (updateOptions.length === 0) {
      return;
    }

    let updateOptionsCopy = updateOptions.slice();

    if (this.appLimits.length === 0) {
      this.appLimits = updateOptionsCopy.map((options) => new RateLimit(options));
    } else {
      this.appLimits = this.appLimits.filter((limit) => {
        const optionsForLimit = updateOptionsCopy.find((options, index) => {
          if (limit.seconds === options.seconds) {
            updateOptionsCopy.splice(index, 1);
            return true;
          } else return false;
        });

        if (optionsForLimit) {
          return true;
        } else {
          limit.dispose();
          return false;
        }
      });

      if (updateOptionsCopy.length > 0) {
        this.appLimits = this.appLimits.concat(
          updateOptionsCopy.map((options) => new RateLimit(options))
        );
      }
    }
  }

  public toString(url: string) {
    if (url) {
      const { platformId, apiMethod } = RiotRateLimiter.extractPlatformIdAndMethodFromUrl(url);
      if (this.limitersPerPlatformId[platformId][apiMethod]) {
        return this.limitersPerPlatformId[platformId][apiMethod].toString();
      }
    }

    return JSON.stringify(this.limitersPerPlatformId, null, 2);
  }
}
