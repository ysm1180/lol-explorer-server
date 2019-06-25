import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';
import 'sinon-mongoose';
import * as request from 'supertest';
import { ImportMock, StaticMockManager } from 'ts-mock-imports';
import app from '../src/app';
import * as dataDragonHelper from '../src/lib/demacia/data-dragon/ddragon-helper';
import { TestUtil } from './testutil';

describe('Summoner rest api test suite', () => {
  const Summoner = mongoose.model('summoner');
  const League = mongoose.model('league');
  const Match = mongoose.model('match');
  const Game = mongoose.model('game');

  const versionMock = TestUtil.mocks.version;
  const seasonMock = TestUtil.mocks.season;
  const summonerMock = TestUtil.mocks.summoners[0];
  let summonerModelMock: sinon.SinonMock;
  let leagueModelMock: sinon.SinonMock;
  let matchModelMock: sinon.SinonMock;
  let gameModelMock: sinon.SinonMock;

  let ddhelperMock: StaticMockManager<dataDragonHelper.DDragonHelper>;

  let summonerSaveMock: sinon.SinonStub;
  let gameSaveMock: sinon.SinonStub;
  let leagueInsertManyMock: sinon.SinonStub;
  let matchInsertManyMock: sinon.SinonStub;

  beforeEach(() => {
    summonerModelMock = sinon.mock(Summoner);
    leagueModelMock = sinon.mock(League);
    matchModelMock = sinon.mock(Match);
    gameModelMock = sinon.mock(Game);

    summonerSaveMock = sinon.stub(Summoner.prototype, 'save');
    gameSaveMock = sinon.stub(Game.prototype, 'save');
    leagueInsertManyMock = sinon.stub(League.collection, 'insertMany');
    matchInsertManyMock = sinon.stub(Match.collection, 'insertMany');

    leagueInsertManyMock.callsFake((objects) => {
      const result = [];
      for (const key in objects) {
        result.push(new League(objects[key]));
      }
      return {
        ops: result,
      };
    });

    ddhelperMock = ImportMock.mockStaticClass(dataDragonHelper, 'DDragonHelper');
  });

  afterEach(() => {
    ddhelperMock.restore();

    summonerModelMock.restore();
    leagueModelMock.restore();
    matchModelMock.restore();
    gameModelMock.restore();

    summonerSaveMock.restore();
    gameSaveMock.restore();
    leagueInsertManyMock.restore();
    matchInsertManyMock.restore();

    leagueModelMock.restore();
  });

  describe('getSummoner', () => {
    describe('error', () => {
      it('should return status 500 when summoner model findOne method occur error', (done) => {
        summonerModelMock.expects('findOne').throwsException('Summoner findOne Error!');

        request(app)
          .get(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });

      it('should return status 500 when summoner model find method occur error', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(Promise.resolve(null));
        summonerModelMock.expects('find').throwsException('Summoner find Error!');

        request(app)
          .get(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });

      describe('should return status 500 when league model find method occur error', () => {
        it('summoner data exists in database', (done) => {
          ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
          ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

          summonerModelMock
            .expects('findOne')
            .withArgs({ name: summonerMock.name })
            .returns(
              Promise.resolve(
                new Summoner({
                  id: summonerMock.id,
                  accountId: summonerMock.accountId,
                  name: summonerMock.name,
                })
              )
            );
          leagueModelMock.expects('find').throwsException('League model find Error!');

          request(app)
            .get(`/summoner/${encodeURI(summonerMock.name)}`)
            .expect(500)
            .end((err, res) => {
              expect(res.status).to.equal(500);

              done();
            });
        });

        it('summoner data does not exist in database', (done) => {
          ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
          ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

          summonerModelMock
            .expects('findOne')
            .withArgs({ name: summonerMock.name })
            .returns(Promise.resolve(null));
          summonerModelMock
            .expects('find')
            .withArgs({ id: summonerMock.id })
            .chain('limit')
            .returns(Promise.resolve([]));
          leagueModelMock.expects('find').throwsException('League model find Error!');

          request(app)
            .get(`/summoner/${encodeURI(summonerMock.name)}`)
            .expect(500)
            .end((err, res) => {
              expect(res.status).to.equal(500);

              done();
            });
        });
      });
    });

    describe('invalid', () => {
      it('should return status 404 when send invalid summoner name', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: TestUtil.mocks.invalidSummonerName })
          .returns(Promise.resolve(null));

        request(app)
          .get(`/summoner/${encodeURI(TestUtil.mocks.invalidSummonerName)}`)
          .expect(404)
          .end((err, res) => {
            expect(res.status).to.equal(404);

            done();
          });
      });
    });

    describe('valid', () => {
      it('should get summoner info when summoner data does not exist in database', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(Promise.resolve(null));
        summonerModelMock
          .expects('find')
          .withArgs({ id: summonerMock.id })
          .chain('limit')
          .returns(Promise.resolve([]));
        leagueModelMock.expects('find').returns(Promise.resolve([]));

        request(app)
          .get(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            summonerModelMock.verify();

            expect(res.body.name).to.equal(summonerMock.name);
            expect(res.body.id).to.equal(summonerMock.id);
            expect(res.body.accountId).to.equal(summonerMock.accountId);

            const seasons = res.body.seasons.map((season: { [id: string]: any }) => ({
              leagueId: season.leagueId,
              season: season.season,
            }));
            expect(seasons).to.deep.include({
              leagueId: summonerMock.league.id,
              season: seasonMock,
            });

            done();
          });
      }).timeout(20000);

      it('should get summoner info when summoner data exists in database', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(
            Promise.resolve(
              new Summoner({
                id: summonerMock.id,
                accountId: summonerMock.accountId,
                name: summonerMock.name,
              })
            )
          );
        leagueModelMock
          .expects('find')
          .withArgs({ season: seasonMock, summonerId: summonerMock.id })
          .returns(
            Promise.resolve([new League({ leagueId: summonerMock.league.id, season: seasonMock })])
          );

        request(app)
          .get(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            summonerModelMock.verify();

            expect(res.body.name).to.equal(summonerMock.name);
            expect(res.body.id).to.equal(summonerMock.id);
            expect(res.body.accountId).to.equal(summonerMock.accountId);

            const seasons = res.body.seasons.map((season: { [id: string]: any }) => ({
              leagueId: season.leagueId,
              season: season.season,
            }));
            expect(seasons).to.deep.include({
              leagueId: summonerMock.league.id,
              season: seasonMock,
            });

            done();
          });
      });

      it('should get summoner info when summoner data exists in database but nick is changed', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(Promise.resolve(null));
        summonerModelMock
          .expects('find')
          .withArgs({ id: summonerMock.id })
          .chain('limit')
          .withArgs(1)
          .returns(
            Promise.resolve([
              new Summoner({
                id: summonerMock.id,
                accountId: summonerMock.accountId,
                name: summonerMock.changedName,
              }),
            ])
          );
        leagueModelMock
          .expects('find')
          .withArgs({ season: seasonMock, summonerId: summonerMock.id })
          .returns(
            Promise.resolve([new League({ leagueId: summonerMock.league.id, season: seasonMock })])
          );

        request(app)
          .get(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            summonerModelMock.verify();

            expect(res.body.name).to.equal(summonerMock.name);
            expect(res.body.id).to.equal(summonerMock.id);
            expect(res.body.accountId).to.equal(summonerMock.accountId);

            const seasons = res.body.seasons.map((season: { [id: string]: any }) => ({
              leagueId: season.leagueId,
              season: season.season,
            }));
            expect(seasons).to.deep.include({
              leagueId: summonerMock.league.id,
              season: seasonMock,
            });

            done();
          });
      });
    });
  });

  describe('updateSummoner', () => {
    describe('error', () => {
      it('should return status 500 when summoner model findOne method occur error', (done) => {
        summonerModelMock.expects('findOne').throwsException('Summoner findOne Error!');

        request(app)
          .post(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });

      it('should return status 500 when summoner model find method occur error', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(Promise.resolve(null));
        summonerModelMock.expects('find').throwsException('Summoner find Error!');

        request(app)
          .post(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });
    });

    describe('invalid', () => {
      it('should return status 404 when send invalid summoner name', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: TestUtil.mocks.invalidSummonerName })
          .returns(Promise.resolve(null));

        request(app)
          .post(`/summoner/${encodeURI(TestUtil.mocks.invalidSummonerName)}`)
          .expect(404)
          .end((err, res) => {
            expect(res.status).to.equal(404);

            done();
          });
      });

      it('should return status 429 when retry before 120 seconds', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(
            Promise.resolve(
              new Summoner({
                name: summonerMock.name,
                id: summonerMock.id,
                accountId: summonerMock.accountId,
                updatedTs: new Date(Date.now()),
              })
            )
          );

        request(app)
          .post(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(429)
          .end((err, res) => {
            expect(res.status).to.equal(429);

            done();
          });
      });
    });

    describe('valid', () => {
      it('should update summoner info when summoner data does not exist in database', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(Promise.resolve(null));
        summonerModelMock
          .expects('find')
          .withArgs({ id: summonerMock.id })
          .chain('limit')
          .withArgs(1)
          .returns(Promise.resolve([]));
        leagueModelMock.expects('bulkWrite').callsFake(() => {
          return Promise.resolve();
        });

        request(app)
          .post(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            summonerModelMock.verify();

            expect(res.body.name).to.equal(summonerMock.name);
            expect(res.body.id).to.equal(summonerMock.id);
            expect(res.body.accountId).to.equal(summonerMock.accountId);

            const seasons = res.body.seasons.map((season: { [id: string]: any }) => ({
              leagueId: season.leagueId,
              season: season.season,
            }));
            expect(seasons).to.deep.include({
              leagueId: summonerMock.league.id,
              season: seasonMock,
            });

            done();
          });
      }).timeout(20000);

      it('should update summoner info when summoner data exists in database', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        const updatedTs = new Date(Date.now() - (60 * 2 + 1) * 1000);
        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(
            Promise.resolve(
              new Summoner({
                id: summonerMock.id,
                accountId: summonerMock.accountId,
                name: summonerMock.name,
                updatedTs: updatedTs,
              })
            )
          );
        summonerModelMock
          .expects('find')
          .withArgs({ id: summonerMock.id })
          .chain('limit')
          .withArgs(1)
          .returns(
            Promise.resolve([
              new Summoner({
                id: summonerMock.id,
                accountId: summonerMock.accountId,
                name: summonerMock.name,
                updatedTs: updatedTs,
              }),
            ])
          );
        leagueModelMock.expects('bulkWrite').callsFake(() => {
          return Promise.resolve();
        });

        request(app)
          .post(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            summonerModelMock.verify();

            expect(res.body.name).to.equal(summonerMock.name);
            expect(res.body.id).to.equal(summonerMock.id);
            expect(res.body.accountId).to.equal(summonerMock.accountId);

            const seasons = res.body.seasons.map((season: { [id: string]: any }) => ({
              leagueId: season.leagueId,
              season: season.season,
            }));
            expect(seasons).to.deep.include({
              leagueId: summonerMock.league.id,
              season: seasonMock,
            });

            done();
          });
      }).timeout(20000);

      it('should update summoner info when summoner data exists in database but nick is changed', (done) => {
        ddhelperMock.mock('getLatestVersion', Promise.resolve(versionMock));
        ddhelperMock.mock('getLatestSeason', Promise.resolve(seasonMock));

        const updatedTs = new Date(Date.now() - (60 * 2 + 1) * 1000);
        summonerModelMock
          .expects('findOne')
          .withArgs({ name: summonerMock.name })
          .returns(Promise.resolve(null));
        summonerModelMock
          .expects('find')
          .withArgs({ id: summonerMock.id })
          .chain('limit')
          .withArgs(1)
          .returns(
            Promise.resolve([
              new Summoner({
                id: summonerMock.id,
                accountId: summonerMock.accountId,
                name: summonerMock.changedName,
                updatedTs: updatedTs,
              }),
            ])
          );
        leagueModelMock.expects('bulkWrite').callsFake(() => {
          return Promise.resolve();
        });

        request(app)
          .post(`/summoner/${encodeURI(summonerMock.name)}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            summonerModelMock.verify();

            expect(res.body.name).to.equal(summonerMock.name);
            expect(res.body.id).to.equal(summonerMock.id);
            expect(res.body.accountId).to.equal(summonerMock.accountId);

            const seasons = res.body.seasons.map((season: { [id: string]: any }) => ({
              leagueId: season.leagueId,
              season: season.season,
            }));
            expect(seasons).to.deep.include({
              leagueId: summonerMock.league.id,
              season: seasonMock,
            });

            done();
          });
      }).timeout(20000);
    });
  });

  describe('getMatchList', () => {
    describe('error', () => {
      it('should return status 500 when match model find method occur error', (done) => {
        matchModelMock.expects('find').throwsException('Match find Error!');

        request(app)
          .get(`/summoner/matches/${summonerMock.accountId}/0/10`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });
    });

    describe('invalid', () => {
      it('should return status 400 when count > 100', (done) => {
        request(app)
          .get(`/summoner/matches/${summonerMock.accountId}/0/200`)
          .expect(400)
          .end((err, res) => {
            expect(res.status).to.equal(400);

            done();
          });
      });

      it('should return status 400 when count < 1', (done) => {
        request(app)
          .get(`/summoner/matches/${summonerMock.accountId}/0/0`)
          .expect(400)
          .end((err, res) => {
            expect(res.status).to.equal(400);

            done();
          });
      });

      it('should return status 400 when accountId is invalid', (done) => {
        const invalidAccountId = TestUtil.mocks.invalidAccountId;
        const limitMock = 5;

        matchModelMock
          .expects('find')
          .withArgs({ summonerAccountId: invalidAccountId })
          .chain('sort')
          .withArgs({ timestamp: -1 })
          .chain('skip')
          .withArgs(0)
          .chain('limit')
          .withArgs(limitMock)
          .returns(Promise.resolve([]));

        request(app)
          .get(`/summoner/matches/${invalidAccountId}/0/${limitMock}`)
          .expect(404)
          .end((err, res) => {
            expect(res.status).to.equal(400);

            done();
          });
      });

      it('should return status 404 when match`s gameId is invalid', (done) => {
        const matchListMock = TestUtil.mocks.matches;
        const limitMock = 2;

        matchModelMock
          .expects('find')
          .chain('sort')
          .withArgs({ timestamp: -1 })
          .chain('skip')
          .withArgs(0)
          .chain('limit')
          .withArgs(limitMock)
          .returns(
            Promise.resolve([
              new Match({ gameId: matchListMock[0].gameId }),
              new Match({ gameId: matchListMock[1].gameId }),
            ])
          );

        gameModelMock
          .expects('find')
          .withArgs({ gameId: matchListMock[0].gameId })
          .chain('limit')
          .withArgs(1)
          .returns(Promise.resolve([]));
        gameModelMock
          .expects('find')
          .withArgs({ gameId: matchListMock[1].gameId })
          .chain('limit')
          .withArgs(1)
          .returns(Promise.resolve([]));

        request(app)
          .get(`/summoner/matches/${summonerMock.accountId}/0/${limitMock}`)
          .expect(404)
          .end((err, res) => {
            expect(res.status).to.equal(404);

            done();
          });
      });
    });

    describe('valid', () => {
      it('should get match info list when match list is empty in database', (done) => {
        const limitMock = 5;

        matchModelMock
          .expects('find')
          .chain('sort')
          .withArgs({ timestamp: -1 })
          .chain('skip')
          .withArgs(0)
          .chain('limit')
          .withArgs(limitMock)
          .returns(Promise.resolve([]));

        const matchList: number[] = [];
        matchInsertManyMock.callsFake((objects) => {
          const result = [];
          for (const key in objects) {
            result.push(new Match(objects[key]));
            matchList.push(objects[key].gameId);
            gameModelMock
              .expects('find')
              .withArgs({
                gameId: objects[key].gameId,
              })
              .chain('limit')
              .withArgs(1)
              .returns(Promise.resolve([]));
          }
          return {
            ops: result,
          };
        });

        request(app)
          .get(`/summoner/matches/${summonerMock.accountId}/0/${limitMock}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body.length).to.equal(limitMock);
            for (const game of res.body) {
              expect(matchList).to.include(game.gameId);
            }

            done();
          });
      }).timeout(20000);

      it('should get match info list when match list exists in database', (done) => {
        const matchListMock = TestUtil.mocks.matches;
        const limitMock = 2;

        matchModelMock
          .expects('find')
          .chain('sort')
          .withArgs({ timestamp: -1 })
          .chain('skip')
          .withArgs(0)
          .chain('limit')
          .withArgs(limitMock)
          .returns(
            Promise.resolve([
              new Match({ gameId: matchListMock[0].gameId }),
              new Match({ gameId: matchListMock[1].gameId }),
            ])
          );

        gameModelMock
          .expects('find')
          .withArgs({ gameId: matchListMock[0].gameId })
          .chain('limit')
          .withArgs(1)
          .returns(
            Promise.resolve([new Game({ gameId: matchListMock[0].gameId, participants: [] })])
          );
        gameModelMock
          .expects('find')
          .withArgs({ gameId: matchListMock[1].gameId })
          .chain('limit')
          .withArgs(1)
          .returns(
            Promise.resolve([new Game({ gameId: matchListMock[1].gameId, participants: [] })])
          );

        request(app)
          .get(`/summoner/matches/${summonerMock.accountId}/0/${limitMock}`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);
            expect(res.body.length).to.equal(limitMock);

            for (let i = 0; i < limitMock; i++) {
              expect(res.body[i].gameId).to.equal(matchListMock[i].gameId);
            }

            done();
          });
      });
    });
  });
});
