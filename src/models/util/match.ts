import demacia from '../../common/demacia';
import Match from '../match';

export async function getMatchListToBeInserted(
  accountId: string,
  start: number,
  count: number,
  timestamp: number
) {
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
    if (timestamp === -1 || (timestamp !== -1 && matchListData[i].timestamp < timestamp)) {
      let matchData = [];
      matchData = await Match.find({
        summonerAccountId: accountId,
        gameId: matchListData[i].gameId,
      }).limit(1);

      if (matchData.length === 0) {
        matchListData[i].summonerAccountId = accountId;
        insertMatchDataList.push(matchListData[i]);
      }
    }

    if (insertMatchDataList.length >= count) {
      break;
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

export async function getMatchListExactly(
  accountId: string,
  start: number,
  count: number,
  lastTimestamp: number = -1
) {
  try {
    const insertMatchDataList = await getMatchListToBeInserted(
      accountId,
      start,
      count,
      lastTimestamp
    );

    if (insertMatchDataList.wantCount === insertMatchDataList.list.length) {
      return Promise.resolve(insertMatchDataList.list);
    }

    let list = insertMatchDataList.list;
    if (list.length <= count) {
      let i = 100;
      let totalCount = list.length;
      while (totalCount < count) {
        console.log('next');
        let nextInsertMatchList = await getMatchListToBeInserted(
          accountId,
          start + i,
          count,
          lastTimestamp
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
    const fiexdCount = 100;
    while (true) {
      const insertMatchDataList = await getMatchListToBeInserted(accountId, i, fiexdCount, -1);

      resultList.push(...insertMatchDataList.list);
      if (
        insertMatchDataList.list.length < fiexdCount ||
        (insertMatchDataList.wantCount !== fiexdCount &&
          insertMatchDataList.wantCount === insertMatchDataList.list.length)
      ) {
        break;
      }
      i += 100;
    }

    return Promise.resolve(resultList);
  } catch (err) {
    return Promise.reject(err);
  }
}
