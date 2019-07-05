import demacia from '../../common/demacia';
import Match from '../match';

async function getMatchListToBeInserted(accountId: string, start: number, count: number) {
  const data = await demacia.getMatchListByAccountId(accountId, start, start + 100);
  const matchListData = data.matches;
  if (matchListData.length === 0) {
    return Promise.resolve({ wantCount: 0, list: [] });
  }

  let first = false;
  if (matchListData.length < 100) {
    first = true;
    matchListData[matchListData.length - 1].first = true;
  }

  let insertMatchDataList = [];
  for (var i = 0; i < matchListData.length; i++) {
    const matchData = await Match.find({
      summonerAccountId: accountId,
      gameId: matchListData[i].gameId,
    }).limit(1);
    if (matchData.length === 0) {
      matchListData[i].summonerAccountId = accountId;
      insertMatchDataList.push(matchListData[i]);
    }
  }

  let wantCount = count;
  if (first) {
    wantCount = insertMatchDataList.length;
  }

  if (wantCount < insertMatchDataList.length) {
    insertMatchDataList = insertMatchDataList.slice(0, wantCount);
  }

  return { wantCount, list: insertMatchDataList };
}

export async function getMatchListExactly(accountId: string, start: number, count: number) {
  try {
    const insertMatchDataList = await getMatchListToBeInserted(accountId, start, count);

    if (insertMatchDataList.wantCount === insertMatchDataList.list.length) {
      return Promise.resolve(insertMatchDataList.list);
    }

    let list = insertMatchDataList.list;
    if (list.length <= count) {
      let i = 100;
      let totalCount = list.length;
      while (totalCount < count) {
        let nextInsertMatchList = await getMatchListToBeInserted(
          accountId,
          start + i,
          start + i + 100
        );

        if (nextInsertMatchList.wantCount === 0) {
          break;
        }

        let newList = nextInsertMatchList.list;
        if (totalCount + newList.length > count) {
          newList = newList.slice(0, count - totalCount);
        }
        list.push(...newList);
        totalCount += newList.length;

        i += 100;
      }
    }

    return Promise.resolve(list);
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getMatchListRecentlyAll(accountId: string) {
  try {
    const resultList = [];

    let i = 0;
    while (true) {
      const matchList = await getMatchListExactly(accountId, i, 100);
      resultList.push(...matchList);
      if (matchList.length < 100) {
        break;
      }
      i += 100;
    }

    return Promise.resolve(resultList);
  } catch (err) {
    return Promise.reject(err);
  }
}
