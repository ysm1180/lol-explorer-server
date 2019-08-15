import { IGameApiData, IGameTimelineApiData, ILeagueApiData, ILeagueSummonerApiData, IMatchApiData, ISummonerApiData } from './models';
import { STRATEGY } from './ratelimiter/ratelimiter';
import { RiotRateLimiter } from './ratelimiter/riot-ratelimiter';
import { SummonerUtil } from './util/summoner-util';

export class Demacia {
  private baseUrl: string;
  private rateLimiter: RiotRateLimiter;

  constructor(private apiKey: string, private strategy: STRATEGY = STRATEGY.SPREAD) {
    this.rateLimiter = new RiotRateLimiter(this.apiKey);
    this.baseUrl = 'https://kr.api.riotgames.com/lol';
  }

  public setStrategy(strategy: STRATEGY) {
    this.strategy = strategy;
  }

  public getSummonerByAccountId(accountId: string) {
    return this.call<ISummonerApiData>(
      `${this.baseUrl}/summoner/v4/summoners/by-account/${accountId}`
    );
  }

  public getSummonerById(id: string) {
    return this.call<ISummonerApiData>(`${this.baseUrl}/summoner/v4/summoners/${escape(id)}`);
  }

  public getSummonerByName(name: string) {
    name = SummonerUtil.normalizeSummonerName(name);
    return this.call<ISummonerApiData>(
      `${this.baseUrl}/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`
    );
  }

  public getLeagueBySummonerId(id: string) {
    return this.call<ILeagueApiData[]>(
      `${this.baseUrl}/league/v4/entries/by-summoner/${escape(id)}`
    );
  }

  public getMatchListByAccountId(
    accountId: string,
    beginIndex: number = 0,
    endIndex: number = 100,
  ) {
    return this.call<{ matches: IMatchApiData[] }>(
      `${
        this.baseUrl
      }/match/v4/matchlists/by-account/${accountId}?beginIndex=${beginIndex}&endIndex=${endIndex}`
    );
  }

  public getMatchQueueListByAccountId(
    accountId: string,
    season: number,
    queue: number,
    beginIndex: number = 0,
    endIndex: number = 100,
  ) {
    return this.call<{ matches: IMatchApiData[] }>(
      `${
        this.baseUrl
      }/match/v4/matchlists/by-account/${accountId}?season=${season}&queue=${queue}&beginIndex=${beginIndex}&endIndex=${endIndex}`
    );
  }

  public getMatchInfoByGameId(gameId: number) {
    return this.call<IGameApiData>(`${this.baseUrl}/match/v4/matches/${gameId}`);
  }

  public getMatchTimelineByGameId(gameId: number) {
    return this.call<IGameTimelineApiData>(`${this.baseUrl}/match/v4/timelines/by-match/${gameId}`);
  }

  public getChallengerSummonerList(queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR') {
    return this.call<ILeagueSummonerApiData>(
      `${this.baseUrl}/league/v4/challengerleagues/by-queue/${queue}`
    );
  }

  public getMasterSummonerList(queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR') {
    return this.call(`${this.baseUrl}/league/v4/masterleagues/by-queue/${queue}`) as Promise<
      ILeagueSummonerApiData
    >;
  }

  public getGrandMasterSummonerList(queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR') {
    return this.call<ILeagueSummonerApiData>(
      `${this.baseUrl}/league/v4/grandmasterleagues/by-queue/${queue}`
    );
  }

  public getSummonerListByLeague(
    queue: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR',
    tier: string,
    division: string,
    page: number = 1
  ) {
    return this.call<ILeagueApiData[]>(
      `${this.baseUrl}/league/v4/entries/${queue}/${tier}/${division}?page=${page}`
    );
  }

  private async call<T>(url: string): Promise<T> {
    try {
      const result = await this.rateLimiter.executing<T>({
        url,
        strategy: this.strategy,
      });
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
