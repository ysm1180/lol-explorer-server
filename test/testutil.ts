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

  static get staticMocks(): {
    champions: { [key: string]: { key: number; id: string } };
    staticChampions: {
      [key: string]: {
        key: string;
        image: { full: string };
        spells: { effect: any[]; effectBurn: any[]; image: { full: string } }[];
        passive: { image: { full: string } };
        recommended: any;
      };
    };
    items: { [key: string]: { key: number } };
    staticItems: { [key: string]: { image: { full: string }; tags: any; maps: any; stats: any } };
    spells: { [key: string]: { key: number; id: string } };
    staticSpells: {
      [key: string]: {
        key: string;
        image: { full: string };
        effect: any[];
        effectBurn: any[];
        modes: any;
      };
    };
    staticPerks: any[];
  } {
    return {
      champions: {
        '266': {
          key: 266,
          id: 'Aatrox',
        },
      },
      staticChampions: {
        '266': {
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
      },
      items: {
        '1004': {
          key: 1004,
        },
      },
      staticItems: {
        '1004': {
          image: {
            full: '1004.png',
          },
          tags: [],
          maps: {},
          stats: {},
        },
      },
      spells: {
        '21': {
          key: 21,
          id: 'SummonerBarrier',
        },
      },
      staticSpells: {
        '21': {
          effect: [null, [95], [20], [0], [0], [0], [0], [0], [0], [0], [0]],
          effectBurn: [null, '95', '20', '0', '0', '0', '0', '0', '0', '0', '0'],
          key: '21',
          modes: [],
          image: {
            full: 'SummonerBarrier.png',
          },
        },
      },
      staticPerks: [{}, {}, {}],
    };
  }
}
