import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';
import 'sinon-mongoose';
import * as request from 'supertest';
import app from '../src/app';
import { DDragonHelper } from '../src/lib/demacia/data-dragon/ddragon-helper';
import { TestUtil } from './testutil';

describe('Static data rest api test suite', () => {
  const Champion = mongoose.model('static_champion');
  const Item = mongoose.model('static_item');
  const Spell = mongoose.model('static_spell');
  const versionMock = TestUtil.mocks.version;

  let championModelMock: sinon.SinonMock;
  let itemModelMock: sinon.SinonMock;
  let spellModelMock: sinon.SinonMock;
  let getLatestVersionMock: sinon.SinonStub;
  let getChampionData: sinon.SinonStub;
  let getItemData: sinon.SinonStub;
  let getSpellData: sinon.SinonStub;
  let getPerkAllData: sinon.SinonStub;

  beforeEach(() => {
    championModelMock = sinon.mock(Champion);
    itemModelMock = sinon.mock(Item);
    spellModelMock = sinon.mock(Spell);

    getLatestVersionMock = sinon.stub(DDragonHelper, 'getLatestVersion');
    getChampionData = sinon.stub(DDragonHelper, 'getChampionData');
    getItemData = sinon.stub(DDragonHelper, 'getItemData');
    getSpellData = sinon.stub(DDragonHelper, 'getSummonerSpellData');
    getPerkAllData = sinon.stub(DDragonHelper, 'getPerkAllData');
  });

  afterEach(() => {
    championModelMock.restore();
    itemModelMock.restore();
    spellModelMock.restore();

    getLatestVersionMock.restore();
    getChampionData.restore();
    getItemData.restore();
    getSpellData.restore();
    getPerkAllData.restore();
  });

  describe('getAllChampion', () => {
    describe('error', () => {
      it('should return status 500 when getChampionData method occurs error', (done) => {
        const championsMock = TestUtil.staticMocks.champions;

        getLatestVersionMock.returns(Promise.resolve(versionMock));
        getChampionData.throws();
        for (const key in championsMock) {
          championModelMock
            .expects('find')
            .returns(Promise.resolve([new Champion(championsMock[key])]));
        }

        request(app)
          .get(`/static/champion/all`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });

      it('should return status 500 when champion model find method occurs error', (done) => {
        getLatestVersionMock.returns(Promise.resolve(versionMock));
        championModelMock.expects('find').throwsException('Champion model find Error!');

        request(app)
          .get(`/static/champion/all`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });
    });

    describe('valid', () => {
      it('should get champion client data', (done) => {
        const championsMock = TestUtil.staticMocks.champions;

        getLatestVersionMock.returns(Promise.resolve(versionMock));
        for (const key in championsMock) {
          getChampionData
            .withArgs(versionMock, championsMock[key].key, championsMock[key].id)
            .returns(Promise.resolve(TestUtil.staticMocks.staticChampions[key]));

          championModelMock
            .expects('find')
            .returns(Promise.resolve([new Champion(championsMock[key])]));
        }

        request(app)
          .get(`/static/champion/all`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            const championList = res.body;
            for (const key in championList) {
              expect(championList[key].key).to.equal(championsMock[key].key);
              expect(championList[key].iconUrl).to.equal(
                DDragonHelper.URL_CHAMPION_ICON(
                  versionMock,
                  TestUtil.staticMocks.staticChampions[key].image.full
                )
              );
              expect(championList[key]).to.not.have.property('image');
              expect(championList[key]).to.not.have.property('recommended');

              expect(championList[key].passive).to.not.have.property('image');
              expect(championList[key].passive.iconUrl).to.equal(
                DDragonHelper.URL_CHAMPION_PASSIVE_ICON(
                  versionMock,
                  TestUtil.staticMocks.staticChampions[key].passive.image.full
                )
              );

              for (let j = 0; j < championList[key].spells.length; j++) {
                const championSpell = championList[key].spells[j];
                expect(championSpell).to.not.have.property('image');
                expect(championSpell).to.not.have.property('effect');
                expect(championSpell).to.not.have.property('effectBurn');

                expect(championSpell.iconUrl).to.equal(
                  DDragonHelper.URL_CHAMPION_SPELL_ICON(
                    versionMock,
                    TestUtil.staticMocks.staticChampions[key].spells[j].image.full
                  )
                );
              }
            }

            done();
          });
      });
    });
  });

  describe('getAllItem', () => {
    describe('error', () => {
      it('should return status 500 when getItemData method occurs error', (done) => {
        const itemsMock = TestUtil.staticMocks.items;

        getLatestVersionMock.returns(Promise.resolve(versionMock));
        getItemData.throws();
        for (const key in itemsMock) {
          itemModelMock.expects('find').returns(Promise.resolve([new Item(itemsMock[key])]));
        }

        request(app)
          .get(`/static/item/all`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });

      it('should return status 500 when item model find method occurs error', (done) => {
        getLatestVersionMock.returns(Promise.resolve(versionMock));
        itemModelMock.expects('find').throwsException('Item model find Error!');

        request(app)
          .get(`/static/item/all`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });
    });

    describe('valid', () => {
      it('should get item client data', (done) => {
        const itemsMock = TestUtil.staticMocks.items;

        getLatestVersionMock.returns(Promise.resolve(versionMock));

        for (const key in itemsMock) {
          getItemData
            .withArgs(versionMock, itemsMock[key].key)
            .returns(Promise.resolve(TestUtil.staticMocks.staticItems[key]));
          itemModelMock.expects('find').returns(Promise.resolve([new Item(itemsMock[key])]));
        }

        request(app)
          .get(`/static/item/all`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            const itemList = res.body;
            for (const key in itemList) {
              expect(itemList[key].key).to.equal(itemsMock[key].key);
              expect(itemList[key].iconUrl).to.equal(
                DDragonHelper.URL_ITEM_ICON(
                  versionMock,
                  TestUtil.staticMocks.staticItems[key].image.full
                )
              );
              expect(itemList[key]).to.not.have.property('image');
              expect(itemList[key]).to.not.have.property('effect');
              expect(itemList[key]).to.not.have.property('maps');
              expect(itemList[key]).to.not.have.property('stats');
              expect(itemList[key]).to.not.have.property('tags');
              expect(itemList[key]).to.not.have.property('depth');
            }

            done();
          });
      });
    });
  });

  describe('getAllSpell', () => {
    describe('error', () => {
      it('should return status 500 when getSummonerSpellData method occurs error', (done) => {
        const spellsMock = TestUtil.staticMocks.spells;

        getLatestVersionMock.returns(Promise.resolve(versionMock));
        getSpellData.throws();
        for (const key in spellsMock) {
          spellModelMock.expects('find').returns(Promise.resolve([new Spell(spellsMock[key])]));
        }

        request(app)
          .get(`/static/spell/all`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });

      it('should return status 500 when spell model find method occurs error', (done) => {
        getLatestVersionMock.returns(Promise.resolve(versionMock));
        spellModelMock.expects('find').throwsException('Spell model find Error!');

        request(app)
          .get(`/static/spell/all`)
          .expect(500)
          .end((err, res) => {
            expect(res.status).to.equal(500);

            done();
          });
      });
    });

    describe('valid', () => {
      it('should get summoner spell client data', (done) => {
        const spellsMock = TestUtil.staticMocks.spells;

        getLatestVersionMock.returns(Promise.resolve(versionMock));

        for (const key in spellsMock) {
          getSpellData
            .withArgs(versionMock, spellsMock[key].id)
            .returns(Promise.resolve(TestUtil.staticMocks.staticSpells[key]));
          spellModelMock.expects('find').returns(Promise.resolve([new Spell(spellsMock[key])]));
        }

        request(app)
          .get(`/static/spell/all`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            const spellList = res.body;
            for (const key in spellsMock) {
              expect(spellList[key].key).to.equal(spellsMock[key].key);
              expect(spellList[key].iconUrl).to.equal(
                DDragonHelper.URL_SPELL_ICON(
                  versionMock,
                  TestUtil.staticMocks.staticSpells[key].image.full
                )
              );
              expect(spellList[key]).to.not.have.property('image');
              expect(spellList[key]).to.not.have.property('effect');
              expect(spellList[key]).to.not.have.property('effectBurn');
              expect(spellList[key]).to.not.have.property('modes');
            }

            done();
          });
      });
    });
  });

  describe('getAllPerk', () => {
    describe('valid', () => {
      it('should get summoner perk client data', (done) => {
        getLatestVersionMock.returns(Promise.resolve(versionMock));

        getPerkAllData
          .withArgs(versionMock)
          .returns(Promise.resolve(TestUtil.staticMocks.staticPerks));

        request(app)
          .get(`/static/perk/all`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            const perkList = res.body;
            for (let i = 0; i < perkList.length; i++) {
              expect(perkList[i].baseIconUrl).to.equal(DDragonHelper.URL_PERK_ICON(versionMock));
            }

            done();
          });
      });
    });
  });
});
