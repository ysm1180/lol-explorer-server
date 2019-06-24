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
        championModelMock
          .expects('find')
          .returns(Promise.resolve(championsMock.map((champion) => new Champion(champion))));

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
        for (let i = 0; i < championsMock.length; i++) {
          getChampionData
            .withArgs(versionMock, championsMock[i].key, championsMock[i].id)
            .returns(Promise.resolve(TestUtil.staticMocks.staticChampions[i]));
        }
        championModelMock
          .expects('find')
          .returns(Promise.resolve(championsMock.map((champion) => new Champion(champion))));

        request(app)
          .get(`/static/champion/all`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            const championList = res.body;
            for (let i = 0; i < championList.length; i++) {
              expect(championList[i].key).to.equal(championsMock[i].key);
              expect(championList[i].iconUrl).to.equal(
                DDragonHelper.URL_CHAMPION_ICON(
                  versionMock,
                  TestUtil.staticMocks.staticChampions[i].image.full
                )
              );
              expect(championList[i]).to.not.have.property('image');
              expect(championList[i]).to.not.have.property('recommended');

              expect(championList[i].passive).to.not.have.property('image');
              expect(championList[i].passive.iconUrl).to.equal(
                DDragonHelper.URL_CHAMPION_PASSIVE_ICON(
                  versionMock,
                  TestUtil.staticMocks.staticChampions[i].passive.image.full
                )
              );

              for (let j = 0; j < championList[i].spells.length; j++) {
                const championSpell = championList[i].spells[j];
                expect(championSpell).to.not.have.property('image');
                expect(championSpell).to.not.have.property('effect');
                expect(championSpell).to.not.have.property('effectBurn');

                expect(championSpell.iconUrl).to.equal(
                  DDragonHelper.URL_CHAMPION_SPELL_ICON(
                    versionMock,
                    TestUtil.staticMocks.staticChampions[i].spells[j].image.full
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
        itemModelMock
          .expects('find')
          .returns(Promise.resolve(itemsMock.map((item) => new Item(item))));

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

        for (let i = 0; i < itemsMock.length; i++) {
          getItemData
            .withArgs(versionMock, itemsMock[i].key)
            .returns(Promise.resolve(TestUtil.staticMocks.staticItems[i]));
        }

        itemModelMock
          .expects('find')
          .returns(Promise.resolve(itemsMock.map((item) => new Item(item))));

        request(app)
          .get(`/static/item/all`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            const itemList = res.body;
            for (let i = 0; i < itemList.length; i++) {
              expect(itemList[i].key).to.equal(itemsMock[i].key);
              expect(itemList[i].iconUrl).to.equal(
                DDragonHelper.URL_ITEM_ICON(versionMock, TestUtil.staticMocks.staticItems[i].image.full)
              );
              expect(itemList[i]).to.not.have.property('image');
              expect(itemList[i]).to.not.have.property('effect');
              expect(itemList[i]).to.not.have.property('maps');
              expect(itemList[i]).to.not.have.property('stats');
              expect(itemList[i]).to.not.have.property('tags');
              expect(itemList[i]).to.not.have.property('depth');
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
        spellModelMock
          .expects('find')
          .returns(Promise.resolve(spellsMock.map((spell) => new Spell(spell))));

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

        for (let i = 0; i < spellsMock.length; i++) {
          getSpellData
            .withArgs(versionMock, spellsMock[i].id)
            .returns(Promise.resolve(TestUtil.staticMocks.staticSpells[i]));
        }

        spellModelMock
          .expects('find')
          .returns(Promise.resolve(spellsMock.map((spell) => new Spell(spell))));

        request(app)
          .get(`/static/spell/all`)
          .expect(200)
          .end((err, res) => {
            expect(res.status).to.equal(200);

            const spellList = res.body;
            for (let i = 0; i < spellList.length; i++) {
              expect(spellList[i].key).to.equal(spellsMock[i].key);
              expect(spellList[i].iconUrl).to.equal(
                DDragonHelper.URL_SPELL_ICON(versionMock, TestUtil.staticMocks.staticSpells[i].image.full)
              );
              expect(spellList[i]).to.not.have.property('image');
              expect(spellList[i]).to.not.have.property('effect');
              expect(spellList[i]).to.not.have.property('effectBurn');
              expect(spellList[i]).to.not.have.property('modes');
            }

            done();
          });
      });
    });
  });

  describe('getAllPerk', () => {
    describe('valid', () => {
      it('should get summoner perk client data', (done) => {
        const spellsMock = TestUtil.staticMocks.spells;

        getLatestVersionMock.returns(Promise.resolve(versionMock));

        for (let i = 0; i < spellsMock.length; i++) {
          getPerkAllData.withArgs(versionMock).returns(Promise.resolve(TestUtil.staticMocks.staticPerks));
        }

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
