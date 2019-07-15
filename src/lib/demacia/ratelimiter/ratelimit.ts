import { STRATEGY, RateLimiter } from './ratelimiter';

export interface RateLimitOptions {
  requests: number;
  seconds: number;
  type: RATELIMIT_TYPE;
  count?: number;
}

export interface RateLimitUpdateOptions {
  requests?: number;
  seconds?: number;
  type?: RATELIMIT_TYPE;
  count?: number;
}

export enum RATELIMIT_TYPE {
  APP,
  METHOD,
  SYNC,
  BACKOFF,
}

export const RATELIMIT_TYPE_STRINGS = {
  [RATELIMIT_TYPE.METHOD]: 'method',
  [RATELIMIT_TYPE.APP]: 'app',
  [RATELIMIT_TYPE.SYNC]: 'sync',
  [RATELIMIT_TYPE.BACKOFF]: 'backoff',
};
export const RATELIMIT_INIT_SECONDS: number = 2;

export const FACTOR_REQUEST_MARGIN_BELOW_5_SEC: number = 0.75;
export const FACTOR_REQUEST_MARGIN_ABOVE_5_SEC: number = 0.9;

export class RateLimit implements RateLimitOptions {
  public get requests() {
    return this._requests;
  }

  public get seconds() {
    return this._seconds;
  }

  public get count() {
    return this._count;
  }

  public get type() {
    return this._type;
  }

  static calcMSUntilReset(limitIntervalSeconds: number, timestampLastLimitReset: number = 0) {
    const timeSinceLastResetMS = Date.now() - timestampLastLimitReset;
    let remainingInterval = limitIntervalSeconds * 1000 - timeSinceLastResetMS;
    if (remainingInterval < 0) {
      remainingInterval *= -1;
      remainingInterval %= limitIntervalSeconds * 1000;
    }
    return remainingInterval;
  }

  static compare(limit1: RateLimitOptions, limit2: RateLimitOptions) {
    const compareLimits = limit2.requests - limit1.requests;

    let compareSeconds: number = 0;
    if (compareLimits === 0) {
      compareSeconds = limit2.seconds - limit1.seconds;
    }

    return compareSeconds + compareLimits;
  }

  static getRateLimitTypeString(type: RATELIMIT_TYPE) {
    return RATELIMIT_TYPE_STRINGS[type];
  }

  private _requests: number;
  private requestsSafeBurst: number;

  private _seconds: number;
  private _count: number;
  private _type: RATELIMIT_TYPE;

  private resetTimeout: NodeJS.Timer | undefined = undefined;
  private timestampLastReset: number = Date.now();

  private limiters: RateLimiter[] = [];

  constructor({ requests, seconds, count = 0, type = RATELIMIT_TYPE.APP }: RateLimitOptions) {
    this._requests = requests;
    this._seconds = seconds;
    this._count = count;
    this._type = type;

    this.startResetTimer();

    this.requestsSafeBurst =
      this.seconds <= 5
        ? Math.floor(this.requests * FACTOR_REQUEST_MARGIN_BELOW_5_SEC)
        : Math.floor(this.requests * FACTOR_REQUEST_MARGIN_ABOVE_5_SEC);

    this.timestampLastReset = Date.now();
  }

  public addLimiter(limiter: RateLimiter) {
    this.limiters.push(limiter);
  }

  public reloadLimiters() {
    this.limiters = this.limiters.filter((limiter) => {
      return limiter.getLimits().find((limit) => limit.equals(this));
    });
  }

  private getSecondsUntilReset() {
    const remaingSeconds = (this.seconds * 1000 - (Date.now() - this.timestampLastReset)) / 1000;
    return remaingSeconds > 0 ? remaingSeconds : 0;
  }

  public check(strategy: STRATEGY) {
    return this.getRemainingRequests(strategy) !== 0;
  }

  public getMaximumRequests(strategy: STRATEGY) {
    if (this.isUsingSafetyMargin(strategy)) {
      return this.requestsSafeBurst;
    } else {
      return this.requests;
    }
  }

  public getRemainingRequests(strategy: STRATEGY) {
    let available;
    if (this.isUsingSafetyMargin(strategy)) {
      available = this.requestsSafeBurst;
    } else {
      available = this.requests;
    }

    let remaining = available - this._count;
    return remaining > 0 ? remaining : 0;
  }

  public getSpreadInterval() {
    const remainingExecutionsInIntervall = this._requests - this._count;
    return (
      RateLimit.calcMSUntilReset(this._seconds, this.timestampLastReset) /
      (remainingExecutionsInIntervall > 0 ? remainingExecutionsInIntervall : 1)
    );
  }

  private startResetTimer() {
    if (!this.resetTimeout) {
      this.resetTimeout = setTimeout(() => {
        this.reset();
      }, this._seconds * 1000);
      this.resetTimeout.unref();
    }
  }

  public toString() {
    return `${RATELIMIT_TYPE_STRINGS[this._type]} RateLimit: ${this._count}/${this._requests}:${
      this._seconds
    } | resetting in ${this.getSecondsUntilReset()}`;
  }

  public isUsingSafetyMargin(strategy: STRATEGY) {
    return (
      strategy === STRATEGY.BURST &&
      this.type !== RATELIMIT_TYPE.SYNC &&
      this.type !== RATELIMIT_TYPE.BACKOFF
    );
  }

  public increment(count: number = 0) {
    if (count > 0) {
      this._count += count;
    } else {
      this._count++;
    }
  }

  public reset() {
    if (this.type === RATELIMIT_TYPE.BACKOFF) {
      this.limiters.forEach((limiter) => {
        limiter.notifyAboutBackoffFinished();
      });
      this.dispose();
    } else {
      this._count = 0;
      this.timestampLastReset = Date.now();

      if (!this.check(STRATEGY.BURST)) {
        this.limiters.forEach((limiter) => {
          limiter.notifyAboutExceededLimitReset();
        });
      }

      this.restartTimeout();
    }
  }

  public update({
    requests = this._requests,
    seconds = this._seconds,
    type = this._type,
    count = this._count,
  }: RateLimitUpdateOptions) {
    const wasExceededBeforeUpdate = !this.check(STRATEGY.BURST);
    this.updateValues({ requests, seconds, type, count });
    const isExceededAfterUpdate = !this.check(STRATEGY.BURST);

    if (isExceededAfterUpdate || (!isExceededAfterUpdate && wasExceededBeforeUpdate)) {
      this.restartTimeout();
    }
  }

  public updateSilently(limit: RateLimitOptions) {
    this.updateValues(limit);
  }

  private updateValues(limit: RateLimitOptions) {
    this._requests = limit.requests;
    this._seconds = limit.seconds;
    this._type = limit.type;
    if (limit.count) {
      this._count = limit.count;
    }
  }

  private compareTo(comparable: RateLimitOptions): number {
    return RateLimit.compare(this, comparable);
  }

  public equals(limit: RateLimitOptions) {
    if (limit.type === RATELIMIT_TYPE.BACKOFF || limit.type === RATELIMIT_TYPE.SYNC) {
      return this.type === limit.type;
    }
    return this.compareTo(limit) === 0;
  }

  public restartTimeout() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    this.resetTimeout = undefined;
    this.startResetTimer();
  }

  public dispose() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    this.limiters.forEach((limiter) => limiter.notifyAboutRemovedLimit(this));
  }
}
