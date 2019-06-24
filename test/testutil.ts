export class TestUtil {
  static get mocks() {
    return {
      invalidSummonerName: 'inv$al$id$ni$ck$m$e',
      invalidAccountId: 'invalidaccountid',
      summoners: [
        {
          id: 'ThjVA5AAOrJ_-c-eVRJW46UYFLP6oydTqysRDp3V_jQEr6Q',
          accountId: 'ISDTqnyyzzBxcn3hvArlta29sUZFgZtK7lSBtaXK8tPZ57w',
          name: '가시수트라',
          changedName: '가시수트라1',
          league: { id: 'a43af340-8306-11e9-8f9c-c81f66e41892' },
        },
      ],
      version: '9.1.1',
      season: 13,
      matches: [
        {
          gameId: 12345,
        },
        {
          gameId: 12346,
        },
      ],
    };
  }

  static get staticMocks() {
    return {
      champions: [
        {
          key: 266,
          id: 'Aatrox',
        },
      ],
      staticChampions: [
        {
          key: '266',
          image: {
            full: 'Aatrox.png',
          },
          spells: [
            {
              effect: [null],
              effectBurn: [null],
              image: {
                full: 'AatroxQ.png',
              },
            },
            {
              effect: [null],
              effectBurn: [null],
              image: {
                full: 'AatroxW.png',
              },
            },
          ],
          passive: {
            image: {
              full: 'Aatrox_Passive.png',
            },
          },
          recommended: [{}],
        },
      ],
      items: [
        {
          key: 1004,
        },
      ],
      staticItems: [
        {
          image: {
            full: '1004.png',
          },
          tags: [],
          maps: {},
          stats: {},
        },
      ],
      spells: [
        {
          key: 21,
          id: 'SummonerBarrier',
        },
      ],
      staticSpells: [
        {
          effect: [null, [95], [20], [0], [0], [0], [0], [0], [0], [0], [0]],
          effectBurn: [null, '95', '20', '0', '0', '0', '0', '0', '0', '0', '0'],
          key: '21',
          modes: [],
          image: {
            full: 'SummonerBarrier.png',
          },
        },
      ],
      staticPerks: [{}, {}, {}],
    };
  }
}
