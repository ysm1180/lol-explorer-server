import { RateLimit, RateLimitOptions, RATELIMIT_TYPE, RATELIMIT_INIT_SECONDS } from './ratelimit';

export enum STRATEGY {
  BURST,
  SPREAD,
}

export type RateLimiterOptions = {
  limits: RateLimit[];
  strategy?: STRATEGY;
};

export const RATELIMIT_BACKOFF_DURATION_MS_DEFAULT = 1000;

export class RateLimiter {
  public static createSyncRateLimit(): RateLimit {
    return new RateLimit({
      requests: 1,
      seconds: RATELIMIT_INIT_SECONDS,
      type: RATELIMIT_TYPE.SYNC,
    });
  }

  private static createBackoffRateLimit(seconds: number) {
    return new RateLimit({
      requests: 0,
      seconds: seconds,
      type: RATELIMIT_TYPE.BACKOFF,
    });
  }

  private limits: RateLimit[];
  private strategy: STRATEGY;

  private backoffDurationMS: number = RATELIMIT_BACKOFF_DURATION_MS_DEFAULT;
  private backoffUntilTimestamp: number = 0;

  private _isPaused: boolean = false;

  private intervalProcessQueue: NodeJS.Timer | null = null;
  private intervalNextSpreadExecution: NodeJS.Timer | null = null;

  private queue: Array<{
    fn: (limiter: RateLimiter) => any;
    resolve: (value?: PromiseLike<any> | any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor({ limits, strategy = STRATEGY.BURST }: RateLimiterOptions) {
    if (!limits || !Array.isArray(limits) || limits.length === 0) {
      throw new Error('At least one RateLimit has to be provided!');
    }
    this.limits = limits;
    this.strategy = strategy;

    limits.forEach((limit) => limit.addLimiter(this));
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public addOrUpdateLimit(limit: RateLimit) {
    const limitIndex = this.indexOfLimit(limit);
    if (limitIndex === -1) {
      limit.addLimiter(this);
      this.limits.push(limit);
      return limit;
    } else if (limit.type === RATELIMIT_TYPE.BACKOFF || limit.type === RATELIMIT_TYPE.SYNC) {
      const foundLimit = this.limits[limitIndex];
      foundLimit.updateSilently(limit);
      foundLimit.restartTimeout();

      if (limit.type === RATELIMIT_TYPE.SYNC) {
        this.clearTimeoutAndInterval();
      }

      return foundLimit;
    }
    return null;
  }

  public removeLimit(limit: RateLimit) {
    const index = this.indexOfLimit(limit);
    if (index !== -1) {
      const removedLimit = this.limits.splice(index, 1)[0];
      removedLimit.reloadLimiters();
      return removedLimit;
    }
    return null;
  }

  public updateLimits(limitsOptions: RateLimitOptions[]) {
    this.pause();

    this.limits
      .filter((limit) => !limitsOptions.find((options) => limit.equals(options)))
      .forEach((options) => this.removeLimit(options));

    if (this.isInitializing()) {
      this.limits.forEach((limit) => {
        const update = limitsOptions.find((options) => limit.equals(options));
        if (update) {
          limit.update(update);
        }
      });
    }

    limitsOptions
      .filter((options) => this.indexOfLimit(options) === -1)
      .forEach((options) => {
        this.addOrUpdateLimit(new RateLimit(options));
      });

    this.unpause();
  }

  public indexOfLimit(limit: RateLimit | RateLimitOptions): number {
    let index = -1;
    this.limits.find((_limit, i) => {
      if (_limit.equals(limit)) {
        index = i;
        return true;
      } else return false;
    });
    return index;
  }

  notifyAboutBackoffFinished() {
    this.backoffUntilTimestamp = 0;
    this.addOrUpdateLimit(RateLimiter.createSyncRateLimit());
  }

  notifyAboutLimitUpdate() {
    if (this.isStrategySpread()) {
      this.refresh();
    }
  }

  notifyAboutExceededLimitReset() {
    this.addOrUpdateLimit(RateLimiter.createSyncRateLimit());
  }

  public notifyAboutRemovedLimit(rateLimit: RateLimit) {
    this.removeLimit(rateLimit);
  }

  public isStrategyBurst() {
    return this.strategy === STRATEGY.BURST;
  }

  public isStrategySpread() {
    return this.strategy === STRATEGY.SPREAD;
  }

  public checkBurstRateLimit(): boolean {
    const exceededLimit = this.limits.find((limit) => !limit.check(this.strategy));
    return !exceededLimit;
  }

  public checkSpreadRateLimit(): boolean {
    return this.queue.length === 0 && !this.intervalNextSpreadExecution && this.limits.length > 0;
  }

  public getLimits(): RateLimit[] {
    return this.limits;
  }

  public getLimitString(): string {
    return this.limits.map((limit) => limit.toString()).join('\r\n');
  }

  public toString(): string {
    let rateLimiterSetupInfo = `RateLimiter with ${this.getStrategyString()} - Limits: \r\n${this.getLimitString()}`;
    let spreadLimitExecutionInfo = `${
      this.isStrategySpread() ? `next execution in ${this.getSpreadInterval() / 1000} seconds` : ''
    }`;
    let backoffInfo = `${
      this.backoffUntilTimestamp
        ? `| backing off until ${new Date(this.backoffUntilTimestamp)}`
        : ''
    }`;

    return `${rateLimiterSetupInfo} | ${spreadLimitExecutionInfo} | ${backoffInfo}`;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getStrategy() {
    return this.strategy;
  }

  public getStrategyString() {
    switch (this.strategy) {
      case STRATEGY.SPREAD:
        return 'SPREAD Strategy';
      case STRATEGY.BURST:
        return 'BURST Strategy';
      default:
        return 'UNKNOWN Strategy';
    }
  }

  private pause() {
    this._isPaused = true;
    this.clearTimeoutAndInterval();
  }

  public setStrategy(strategy: STRATEGY) {
    this.strategy = strategy;
    this.refresh();
  }

  public scheduling<T>(fn: (limiter: RateLimiter) => Promise<T>, isReschedule = false) {
    if (this.isStrategyBurst()) {
      return this.schedulingWithBurst<T>(fn, isReschedule);
    }
    if (this.isStrategySpread()) {
      return this.schedulingWithSpread<T>(fn, isReschedule);
    }
    return Promise.reject(new Error('Unknown stretagy'));
  }

  public rescheduling<T>(fn: (limiter: RateLimiter) => Promise<T>) {
    return this.scheduling<T>(fn, true);
  }

  public backoff({ retryAfterMS }: { retryAfterMS: number }) {
    if (retryAfterMS === 0) {
      retryAfterMS = this.backoffDurationMS;
      this.backoffDurationMS *= 2;
    } else {
      this.backoffDurationMS = RATELIMIT_BACKOFF_DURATION_MS_DEFAULT;
    }
    if (retryAfterMS <= 1000) retryAfterMS = 2000;
    this.backoffUntilTimestamp = Date.now() + retryAfterMS;

    this.addOrUpdateLimit(RateLimiter.createBackoffRateLimit(retryAfterMS / 1000));
    this.addOrUpdateLimit(RateLimiter.createSyncRateLimit());
  }

  public resetBackoff() {
    this.backoffDurationMS = RATELIMIT_BACKOFF_DURATION_MS_DEFAULT;
    this.backoffUntilTimestamp = 0;
  }

  private schedulingWithBurst<T>(fn: (limiter: RateLimiter) => Promise<T>, isReschedule = false) {
    return new Promise<T>((resolve, reject) => {
      if (!this.isPaused && this.checkBurstRateLimit()) {
        this.execute(fn, resolve, reject);
      } else {
        this.addToQueue(fn, resolve, reject, isReschedule);
      }
    });
  }

  private schedulingWithSpread<T>(fn: (limiter: RateLimiter) => Promise<T>, isReschedule = false) {
    return new Promise<T>((resolve, reject) => {
      if (!this.isPaused && this.checkSpreadRateLimit()) {
        this.refresh();
        this.execute(fn, resolve, reject);
      } else {
        this.addToQueue(fn, resolve, reject, isReschedule);
      }
    });
  }

  public addToQueue(
    fn: (limiter: RateLimiter) => any,
    resolve: (value?: PromiseLike<any> | any) => void,
    reject: (reason?: any) => void,
    isReschedule: boolean = false
  ) {
    if (isReschedule) {
      this.queue.unshift({ fn, resolve, reject });
    } else {
      this.queue.push({ fn, resolve, reject });
    }

    if (
      (this.isStrategySpread() && !this.intervalNextSpreadExecution) ||
      (this.isStrategyBurst() && !this.intervalProcessQueue)
    ) {
      this.refresh();
    }

    return this.queue;
  }

  private processSpreadLimitInterval() {
    if (this.queue.length !== 0) {
      const { fn, resolve, reject } = this.queue.shift()!;
      this.execute(fn, resolve, reject);
    } else {
      this.pause();
    }
  }

  private refresh() {
    if (this.isStrategyBurst()) {
      this.refreshBurstLimiter();
    } else if (this.isStrategySpread()) {
      this.refreshSpreadLimiter();
    }
  }

  private clearTimeoutAndInterval() {
    if (this.intervalProcessQueue) {
      clearInterval(this.intervalProcessQueue);
    }
    this.intervalProcessQueue = null;

    if (this.intervalNextSpreadExecution) {
      clearInterval(this.intervalNextSpreadExecution);
    }
    this.intervalNextSpreadExecution = null;
  }

  private refreshBurstLimiter() {
    this.clearTimeoutAndInterval();

    this.processBurstQueue();

    if (this.queue.length !== 0) {
      const factorForEqualRights = Math.floor(Math.random() * 100);
      this.intervalProcessQueue = setInterval(() => {
        this.processBurstQueue();
      }, 1000 + factorForEqualRights);
      this.intervalProcessQueue.unref();
    }
  }

  private refreshSpreadLimiter() {
    this.clearTimeoutAndInterval();

    this.intervalNextSpreadExecution = setInterval(() => {
      this.processSpreadLimitInterval();
    }, this.getSpreadInterval());
    this.intervalNextSpreadExecution.unref();
  }

  private execute<T>(
    fn: (limiter: RateLimiter) => Promise<T>,
    onSuccess: (value?: PromiseLike<T> | T) => void,
    onError: (reason?: any) => void
  ) {
    try {
      this.limits.forEach((limit) => limit.increment());
      onSuccess(fn(this));
    } catch (e) {
      onError(e);
    }
  }

  public processBurstQueue() {
    if (this.checkBurstRateLimit()) {
      let limitWithLowestRequestsRemaining = this.limits[0];
      for (let i = 1; i < this.limits.length; i++) {
        const limit = this.limits[i];
        limitWithLowestRequestsRemaining =
          limitWithLowestRequestsRemaining.getRemainingRequests(STRATEGY.BURST) <
          limit.getRemainingRequests(STRATEGY.BURST)
            ? limitWithLowestRequestsRemaining
            : limit;
      }

      const queueSplice = this.queue.splice(
        0,
        limitWithLowestRequestsRemaining.getRemainingRequests(STRATEGY.BURST)
      );

      if (limitWithLowestRequestsRemaining.type === RATELIMIT_TYPE.SYNC) {
        queueSplice.forEach(({ fn, resolve, reject }) => {
          this.scheduling(fn, true)
            .then(resolve)
            .catch((err) => {
              // if (err.statusCode >= 500){
              // in case we get an error from the synching call, we need to be able to move on
              // we do so by backing off with the default value and moving on from there
              // while still rejecting the original function, to delegate the error to the user
              this.backoff({ retryAfterMS: 0 });
              // }
              reject(err);
            });
        });
      }
      queueSplice.forEach(({ fn, resolve, reject }) => {
        this.scheduling(fn, true)
          .then(resolve)
          .catch(reject);
      });
    } 
  }

  public getQueue() {
    return this.queue;
  }

  private unpause() {
    this._isPaused = false;
    this.refresh();
  }

  private getSpreadInterval(): number {
    return this.limits.reduce((longestInterval: number, limit: RateLimit) => {
      const interval = limit.getSpreadInterval();
      if (longestInterval === 0) return interval;
      return longestInterval > interval ? longestInterval : interval;
    }, 0);
  }

  public isInitializing() {
    return !!this.limits.find((limit) => limit.type === RATELIMIT_TYPE.SYNC);
  }
}
