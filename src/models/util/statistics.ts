import StatisticsChampionBan from '../statistics/champion_ban';
import StatisticsChampionPosition from '../statistics/champion_position';
import StatisticsChampionItemBuild from '../statistics/champion_item_build';
import StatisticsChampionMainItem from '../statistics/champion_main_item';
import StatisticsChampionFinalItem from '../statistics/champion_final_item';
import StatisticsChampionFinalItemBuild from '../statistics/champion_final_item_build';
import StatisticsChampionRivalItemBuild from '../statistics/champion_rival_item_build';
import StatisticsChampionRivalMainItemBuild from '../statistics/champion_rival_main_item_build';
import StatisticsChampionRivalFinalItem from '../statistics/champion_rival_final_item';
import StatisticsChampionRivalRune from '../statistics/champion_rival_rune_build';
import StatisticsChampionRivalShoes from '../statistics/champion_rival_shoes';
import StatisticsChampionRivalSpell from '../statistics/champion_rival_spell_build';
import StatisticsChampionRivalStartItem from '../statistics/champion_rival_start_item';
import StatisticsChampionRivalStat from '../statistics/champion_rival_stat';
import StatisticsChampionRivalSkillSet from '../statistics/champion_rival_skill_set';
import StatisticsChampionRune from '../statistics/champion_rune';
import StatisticsChampionShoes from '../statistics/champion_shoes';
import StatisticsChampionSkillSet from '../statistics/champion_skill_set';
import StatisticsChampionSpell from '../statistics/champion_spell';
import StatisticsChampionStartItem from '../statistics/champion_start_item';
import StatisticsChampionTimeWin from '../statistics/champion_time_win';

export async function saveChampionRivalData({
  data,
  championKey,
  rivalChampionKey,
  position,
  gameVersion,
  isWin,
  runeData,
  items,
  finalItems,
  itemBuild,
  spells,
  startItems,
  shoes,
  stats,
  skills,
}: {
  data: {
    stat?: { [key: string]: any };
    rune?: { [key: string]: any };
    spell?: { [key: string]: any };
    skill?: { [key: string]: any };
    startItem?: { [key: string]: any };
    mainItem?: { [key: string]: any };
    itemBuild?: { [key: string]: any };
    finalItem?: { [key: string]: any };
    shoes?: { [key: string]: any };
  };
  championKey: number;
  rivalChampionKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  runeData: {
    mainRuneStyle: number;
    mainRunes: number[];
    subRuneStyle: number;
    subRunes: number[];
    statRunes: number[];
  };
  finalItems: number[];
  items: number[];
  itemBuild: number[];
  spells: number[];
  startItems: number[];
  shoes: {
    itemId: number;
    timestamp: number;
  };
  stats: {
    csPerMinutes?: { [duration: string]: number };
    goldPerMinutes?: { [duration: string]: number };
    soloKills: number;
    kills: number;
    deaths: number;
    assists: number;
    damageDealtToChampions: number;
    damageTaken: number;
    goldEarned: number;
    killPercent: number;
  };
  skills: number[];
}) {
  if (!data.stat) {
    data.stat = {};
  }
  if (!data.spell) {
    data.spell = {};
  }
  if (!data.rune) {
    data.rune = {};
  }
  if (!data.startItem) {
    data.startItem = {};
  }
  if (!data.skill) {
    data.skill = {};
  }
  if (!data.mainItem) {
    data.mainItem = {};
  }
  if (!data.itemBuild) {
    data.itemBuild = {};
  }
  if (!data.finalItem) {
    data.finalItem = {};
  }
  if (!data.shoes) {
    data.shoes = {};
  }

  const setStat = (rivalStats: any) => {
    rivalStats.count++;
    if (isWin) {
      rivalStats.win++;
    }
    rivalStats.totalSoloKills += stats.soloKills;
    rivalStats.averageKills = (rivalStats.averageKills + stats.kills) / 2;
    rivalStats.averageDeaths = (rivalStats.averageDeaths + stats.deaths) / 2;
    rivalStats.averageAssists = (rivalStats.averageAssists + stats.assists) / 2;
    rivalStats.averageDamageDealtToChampions =
      (rivalStats.averageDamageDealtToChampions + stats.damageDealtToChampions) / 2;
    rivalStats.averageDamageTaken = (rivalStats.averageDamageTaken + stats.damageTaken) / 2;
    rivalStats.averageGoldEarned = (rivalStats.averageGoldEarned + stats.goldEarned) / 2;
    rivalStats.averageKillPercent = (rivalStats.averageKillPercent + stats.killPercent) / 2;
    if (!rivalStats.csPerMinutes) {
      rivalStats.csPerMinutes = {};
    }
    if (!rivalStats.goldPerMinutes) {
      rivalStats.goldPerMinutes = {};
    }
    if (stats.csPerMinutes) {
      for (const key of Object.keys(stats.csPerMinutes)) {
        if (rivalStats.csPerMinutes[key]) {
          rivalStats.csPerMinutes[key] =
            (rivalStats.csPerMinutes[key] + stats.csPerMinutes[key]) / 2;
        } else {
          rivalStats.csPerMinutes[key] = stats.csPerMinutes[key];
        }
      }
    }
    if (stats.goldPerMinutes) {
      for (const key of Object.keys(stats.goldPerMinutes)) {
        if (rivalStats.goldPerMinutes[key]) {
          rivalStats.goldPerMinutes[key] =
            (rivalStats.goldPerMinutes[key] + stats.goldPerMinutes[key]) / 2;
        } else {
          rivalStats.goldPerMinutes[key] = stats.goldPerMinutes[key];
        }
      }
    }
    return rivalStats;
  };
  let key = JSON.stringify({
    championKey,
    rivalChampionKey,
    position,
    gameVersion,
  });
  if (data.stat && !data.stat[key]) {
    const rivalStats = await StatisticsChampionRivalStat.findOne(
      {
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
      },
      { _id: 0 }
    ).lean();

    if (!rivalStats) {
      data.stat[key] = {
        count: 1,
        win: isWin ? 1 : 0,
        totalSoloKills: stats.soloKills,
        averageKills: stats.kills,
        averageDeaths: stats.deaths,
        averageAssists: stats.assists,
        averageDamageDealtToChampions: stats.damageDealtToChampions,
        averageDamageTaken: stats.damageTaken,
        averageGoldEarned: stats.goldEarned,
        averageKillPercent: stats.killPercent,
        csPerMinutes: {},
        goldPerMinutes: {},
      };

      if (stats.csPerMinutes) {
        for (const time of Object.keys(stats.csPerMinutes)) {
          data.stat[key].csPerMinutes[time] = stats.csPerMinutes[time];
        }
      }
      if (stats.goldPerMinutes) {
        for (const time of Object.keys(stats.goldPerMinutes)) {
          data.stat[key].goldPerMinutes[time] = stats.goldPerMinutes[time];
        }
      }
    } else {
      data.stat[key] = setStat(rivalStats);
    }
  } else {
    data.stat[key] = setStat(data.stat[key]);
  }

  const setSpell = (spell: any) => {
    spell.count++;
    if (isWin) {
      spell.win++;
    }
    return spell;
  };
  key = JSON.stringify({
    championKey,
    rivalChampionKey,
    position,
    gameVersion,
    spells,
  });
  if (data.spell && !data.spell[key]) {
    const rivalSpell = await StatisticsChampionRivalSpell.findOne(
      {
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
        spells,
      },
      { _id: 0 }
    ).lean();

    if (!rivalSpell) {
      data.spell[key] = {
        count: 1,
        win: isWin ? 1 : 0,
      };
    } else {
      data.spell[key] = setSpell(rivalSpell);
    }
  } else {
    data.spell[key] = setSpell(data.spell[key]);
  }
  const { mainRuneStyle, mainRunes, subRuneStyle, subRunes, statRunes } = runeData;

  const setRune = (rune: any) => {
    rune.count++;
    if (isWin) {
      rune.win++;
    }
    return rune;
  };
  key = JSON.stringify({
    championKey,
    rivalChampionKey,
    position,
    gameVersion,
    mainRuneStyle,
    mainRunes,
    subRuneStyle,
    subRunes,
    statRunes,
  });
  if (data.rune && !data.rune[key]) {
    const rivalRune = await StatisticsChampionRivalRune.findOne(
      {
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
        mainRuneStyle,
        mainRunes,
        subRuneStyle,
        subRunes,
        statRunes,
      },
      { _id: 0 }
    ).lean();
    if (!rivalRune) {
      data.rune[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data.rune[key] = setRune(rivalRune);
    }
  } else {
    data.rune[key] = setRune(data.rune[key]);
  }

  if (startItems.length > 0) {
    const setStartItem = (startItem: any) => {
      startItem.count++;
      if (isWin) {
        startItem.win++;
      }
      return startItem;
    };
    key = JSON.stringify({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      startItems,
    });
    if (data.startItem && !data.startItem[key]) {
      const startItem = await StatisticsChampionRivalStartItem.findOne(
        {
          championKey,
          rivalChampionKey,
          position,
          gameVersion,
          items: startItems,
        },
        { _id: 0 }
      ).lean();
      if (!startItem) {
        data.startItem[key] = { count: 1, win: isWin ? 1 : 0 };
      } else {
        data.startItem[key] = setStartItem(startItem);
      }
    } else {
      data.startItem[key] = setStartItem(data.startItem[key]);
    }
  }

  if (items.length >= 3) {
    const setMainItem = (mainItem: any) => {
      mainItem.count++;
      if (isWin) {
        mainItem.win++;
      }
      return mainItem;
    };
    key = JSON.stringify({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      items,
    });
    if (data.mainItem && !data.mainItem[key]) {
      const item = await StatisticsChampionRivalMainItemBuild.findOne(
        {
          championKey,
          rivalChampionKey,
          position,
          gameVersion,
          items,
        },
        { _id: 0 }
      ).lean();
      if (!item) {
        data.mainItem[key] = { count: 1, win: isWin ? 1 : 0 };
      } else {
        data.mainItem[key] = setMainItem(item);
      }
    } else {
      data.mainItem[key] = setMainItem(data.mainItem[key]);
    }
  }

  if (itemBuild.length > 0) {
    const setItemBuild = (itemBuild: any) => {
      itemBuild.count++;
      if (isWin) {
        itemBuild.win++;
      }
      return itemBuild;
    };
    key = JSON.stringify({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      itemBuild,
    });
    if (data.itemBuild && !data.itemBuild[key]) {
      const rivalItemBuild = await StatisticsChampionRivalItemBuild.findOne(
        {
          championKey,
          rivalChampionKey,
          position,
          gameVersion,
          items: itemBuild,
        },
        { _id: 0 }
      ).lean();
      if (!rivalItemBuild) {
        data.itemBuild[key] = { count: 1, win: isWin ? 1 : 0 };
      } else {
        data.itemBuild[key] = setItemBuild(rivalItemBuild);
      }
    } else {
      data.itemBuild[key] = setItemBuild(data.itemBuild[key]);
    }
  }

  const setFinalItem = (finalItem: any) => {
    finalItem.count++;
    if (isWin) {
      finalItem.win++;
    }
    return finalItem;
  };
  for (const finalItem of finalItems) {
    key = JSON.stringify({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      finalItem,
    });
    if (data.finalItem && !data.finalItem[key]) {
      const rivalfinalItem = await StatisticsChampionRivalFinalItem.findOne(
        {
          championKey,
          rivalChampionKey,
          position,
          gameVersion,
          item: finalItem,
        },
        { _id: 0 }
      ).lean();
      if (!rivalfinalItem) {
        data.finalItem[key] = { count: 1, win: isWin ? 1 : 0 };
      } else {
        data.finalItem[key] = setFinalItem(rivalfinalItem);
      }
    } else {
      data.finalItem[key] = setFinalItem(data.finalItem[key]);
    }
  }

  if (shoes.itemId !== 0) {
    const setShoes = (rivalShoes: any) => {
      rivalShoes.count++;
      if (isWin) {
        rivalShoes.win++;
      }
      rivalShoes.averageTimestamp = (rivalShoes.averageTimestamp + shoes.timestamp) / 2;

      return rivalShoes;
    };
    key = JSON.stringify({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      shoes: shoes.itemId,
    });
    if (data.shoes && !data.shoes[key]) {
      const rivalShoes = await StatisticsChampionRivalShoes.findOne(
        {
          championKey,
          rivalChampionKey,
          position,
          gameVersion,
          shoes: shoes.itemId,
        },
        { _id: 0 }
      ).lean();
      if (!rivalShoes) {
        data.shoes[key] = { count: 1, win: isWin ? 1 : 0, averageTimestamp: shoes.timestamp };
      } else {
        data.shoes[key] = setShoes(rivalShoes);
      }
    } else {
      data.shoes[key] = setShoes(data.shoes[key]);
    }
  }

  if (skills.length >= 15) {
    const setSkillSet = (skillset: any) => {
      skillset.count++;
      if (isWin) {
        skillset.win++;
      }
      return skillset;
    };
    key = JSON.stringify({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      skills,
    });
    if (data.skill && !data.skill[key]) {
      const skillset = await StatisticsChampionRivalSkillSet.findOne(
        {
          championKey,
          position,
          gameVersion,
          skills,
        },
        { _id: 0 }
      ).lean();
      if (!skillset) {
        data.skill[key] = { count: 1, win: isWin ? 1 : 0 };
      } else {
        data.skill[key] = setSkillSet(skillset);
      }
    } else {
      data.skill[key] = setSkillSet(data.skill[key]);
    }
  }

  return data;
}

export async function saveChampionShoes({
  data,
  championKey,
  position,
  gameVersion,
  shoes: shoesId,
  timestamp,
  isWin,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  shoes: number;
  timestamp: number;
  isWin: boolean;
}) {
  const setShoes = (shoes: any) => {
    shoes.count++;
    if (isWin) {
      shoes.win++;
    }
    shoes.averageTimestamp = (shoes.averageTimestamp + timestamp) / 2;

    return shoes;
  };
  let key = JSON.stringify({ championKey, position, gameVersion, shoes: shoesId });
  if (!data[key]) {
    const shoes = await StatisticsChampionShoes.findOne(
      {
        championKey,
        position,
        gameVersion,
        shoes: shoesId,
      },
      { _id: 0 }
    ).lean();
    if (!shoes) {
      data[key] = { count: 1, win: isWin ? 1 : 0, averageTimestamp: timestamp };
    } else {
      data[key] = setShoes(shoes);
    }
  } else {
    data[key] = setShoes(data[key]);
  }

  return data;
}

export async function saveChampionTimeWin({
  data,
  championKey,
  position,
  gameVersion,
  gameMinutes,
  isWin,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  gameMinutes: number;
  isWin: boolean;
}) {
  const setTimeWin = (time: any) => {
    time.count++;
    if (isWin) {
      time.win++;
    }
    return time;
  };
  let key = JSON.stringify({ championKey, position, gameVersion, gameMinutes });
  if (!data[key]) {
    const count = await StatisticsChampionTimeWin.findOne(
      {
        championKey,
        position,
        gameVersion,
        gameMinutes,
      },
      { _id: 0 }
    ).lean();
    if (!count) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setTimeWin(count);
    }
  } else {
    data[key] = setTimeWin(data[key]);
  }

  return data;
}

export async function saveChampionBans({
  data,
  totalBannedChampions,
  gameVersion,
}: {
  data: any;
  totalBannedChampions: number[];
  gameVersion: string;
}) {
  const championCount: { [id: string]: number } = {};
  for (const championId of totalBannedChampions) {
    if (!championCount[championId]) {
      championCount[championId] = 1;
    } else {
      championCount[championId]++;
    }
  }

  const setChampionBan = (championKey: string, championBan: any) => {
    championBan.countByGame++;
    championBan.count += championCount[championKey];
    return championBan;
  };
  for (const championKey of Object.keys(championCount)) {
    let key = JSON.stringify({ championKey, gameVersion });
    if (!data[key]) {
      const championBan = await StatisticsChampionBan.findOne(
        {
          championKey,
          gameVersion,
        },
        { _id: 0 }
      ).lean();
      if (!championBan) {
        data[key] = { count: championCount[championKey], countByGame: 1 };
      } else {
        data[key] = setChampionBan(championKey, championBan);
      }
    } else {
      data[key] = setChampionBan(championKey, data[key]);
    }
  }
  return data;
}

export async function saveChampionRune({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  mainRuneStyle,
  mainRunes,
  subRuneStyle,
  subRunes,
  statRunes,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  mainRuneStyle: number;
  mainRunes: number[];
  subRuneStyle: number;
  subRunes: number[];
  statRunes: number[];
}) {
  const setRune = (rune: any) => {
    rune.count++;
    if (isWin) {
      rune.win++;
    }
    return rune;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    mainRuneStyle,
    mainRunes,
    subRuneStyle,
    subRunes,
    statRunes,
  });
  if (!data[key]) {
    const rune = await StatisticsChampionRune.findOne(
      {
        championKey,
        position,
        gameVersion,
        mainRuneStyle,
        mainRunes,
        subRuneStyle,
        subRunes,
        statRunes,
      },
      { _id: 0 }
    ).lean();
    if (!rune) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setRune(rune);
    }
  } else {
    data[key] = setRune(data[key]);
  }

  return data;
}

export async function saveChampionSkillSet({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  skills,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  skills: number[];
}) {
  const setSkillset = (skillset: any) => {
    skillset.count++;
    if (isWin) {
      skillset.win++;
    }
    return skillset;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    skills,
  });
  if (!data[key]) {
    const skillset = await StatisticsChampionSkillSet.findOne(
      {
        championKey,
        position,
        gameVersion,
        skills,
      },
      { _id: 0 }
    ).lean();
    if (!skillset) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setSkillset(skillset);
    }
  } else {
    data[key] = setSkillset(data[key]);
  }

  return data;
}

export async function saveChampionItemBuild({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const setItemBuild = (itemBuild: any) => {
    itemBuild.count++;
    if (isWin) {
      itemBuild.win++;
    }
    return itemBuild;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (!data[key]) {
    const item = await StatisticsChampionItemBuild.findOne(
      {
        championKey,
        position,
        gameVersion,
        items,
      },
      { _id: 0 }
    ).lean();
    if (!item) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setItemBuild(item);
    }
  } else {
    data[key] = setItemBuild(data[key]);
  }

  return data;
}

export async function saveChampionMainItems({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const setMainItem = (mainItem: any) => {
    mainItem.count++;
    if (isWin) {
      mainItem.win++;
    }
    return mainItem;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (!data[key]) {
    const item = await StatisticsChampionMainItem.findOne(
      {
        championKey,
        position,
        gameVersion,
        items,
      },
      { _id: 0 }
    ).lean();
    if (!item) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setMainItem(item);
    }
  } else {
    data[key] = setMainItem(data[key]);
  }

  return data;
}

export async function saveChampionFinalItem({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  item,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  item: number;
}) {
  const setFinalItem = (finalItem: any) => {
    finalItem.count++;
    if (isWin) {
      finalItem.win++;
    }
    return finalItem;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    item,
  });
  if (!data[key]) {
    const finalItem = await StatisticsChampionFinalItem.findOne(
      {
        championKey,
        position,
        gameVersion,
        item,
      },
      { _id: 0 }
    ).lean();
    if (!finalItem) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setFinalItem(finalItem);
    }
  } else {
    data[key] = setFinalItem(data[key]);
  }

  return data;
}

export async function saveChampionFinalItemBuild({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const setFinalItemBuild = (item: any) => {
    item.count++;
    if (isWin) {
      item.win++;
    }
    return item;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (!data[key]) {
    const item = await StatisticsChampionFinalItemBuild.findOne(
      {
        championKey,
        position,
        gameVersion,
        items,
      },
      { _id: 0 }
    ).lean();
    if (!item) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setFinalItemBuild(item);
    }
  } else {
    data[key] = setFinalItemBuild(data[key]);
  }

  return data;
}

export async function saveChampionSpell({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  spells,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  spells: number[];
}) {
  const setSpell = (spell: any) => {
    spell.count++;
    if (isWin) {
      spell.win++;
    }
    return spell;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    spells,
  });
  if (!data[key]) {
    const spell = await StatisticsChampionSpell.findOne(
      {
        championKey,
        position,
        gameVersion,
        spells,
      },
      { _id: 0 }
    ).lean();
    if (!spell) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setSpell(spell);
    }
  } else {
    data[key] = setSpell(data[key]);
  }

  return data;
}

export async function saveChampionStartItem({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const setStartItem = (item: any) => {
    item.count++;
    if (isWin) {
      item.win++;
    }
    return item;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (!data[key]) {
    const startItem = await StatisticsChampionStartItem.findOne(
      {
        championKey,
        position,
        gameVersion,
        items,
      },
      { _id: 0 }
    ).lean();
    if (!startItem) {
      data[key] = { count: 1, win: isWin ? 1 : 0 };
    } else {
      data[key] = setStartItem(startItem);
    }
  } else {
    data[key] = setStartItem(data[key]);
  }

  return data;
}
export async function saveChampionPosition({
  data,
  championKey,
  position,
  gameVersion,
  isWin,
  stats,
}: {
  data: any;
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    damageTaken: number;
    goldEarned: number;
    killPercent: number;
    timeCCingOthers: number;
    timeCrowdControlDealt: number;
    neutralMinionsKilled: number;
    neutralMinionsKilledTeamJungle: number;
    neutralMinionsKilledEnemyJungle: number;
    damageSelfMitigated: number;
    trueDamageDealtToChampions: number;
    magicDamageDealtToChampions: number;
    physicalDamageDealtToChampions: number;
    heal: number;
    unitsHealed: number;
  };
}) {
  const setPositionStat = (positionStat: any) => {
    positionStat.count++;
    if (isWin) {
      positionStat.win++;
    }
    positionStat.averageKills = (positionStat.averageKills + stats.kills) / 2;
    positionStat.averageDeaths = (positionStat.averageDeaths + stats.deaths) / 2;
    positionStat.averageAssists = (positionStat.averageAssists + stats.assists) / 2;
    positionStat.averageGoldEarned = (positionStat.averageGoldEarned + stats.goldEarned) / 2;
    positionStat.averageDamageTaken = (positionStat.averageDamageTaken + stats.damageTaken) / 2;
    positionStat.averageKillPercent = (positionStat.averageKillPercent + stats.killPercent) / 2;
    positionStat.averageTimeCCingOthers =
      (positionStat.averageTimeCCingOthers + stats.timeCCingOthers) / 2;
    positionStat.averageTimeCrowdControlDealt =
      (positionStat.averageTimeCrowdControlDealt + stats.timeCrowdControlDealt) / 2;
    positionStat.averageNeutralMinionsKilled =
      (positionStat.averageNeutralMinionsKilled + stats.neutralMinionsKilled) / 2;
    if (!positionStat.averageNeutralMinionsKilledTeamJungle) {
      positionStat.averageNeutralMinionsKilledTeamJungle = 0;
    }
    if (!stats.neutralMinionsKilledTeamJungle) {
      stats.neutralMinionsKilledTeamJungle = 0;
    }
    positionStat.averageNeutralMinionsKilledTeamJungle =
      (positionStat.averageNeutralMinionsKilledTeamJungle + stats.neutralMinionsKilledTeamJungle) /
      2;
    if (!positionStat.averageNeutralMinionsKilledEnemyJungle) {
      positionStat.averageNeutralMinionsKilledEnemyJungle = 0;
    }
    if (!stats.neutralMinionsKilledEnemyJungle) {
      stats.neutralMinionsKilledEnemyJungle = 0;
    }
    positionStat.averageNeutralMinionsKilledEnemyJungle =
      (positionStat.averageNeutralMinionsKilledEnemyJungle +
        stats.neutralMinionsKilledEnemyJungle) /
      2;
    positionStat.averageDamageSelfMitigated =
      (positionStat.averageDamageSelfMitigated + stats.damageSelfMitigated) / 2;
    positionStat.averageTrueDamageDealtToChampions =
      (positionStat.averageTrueDamageDealtToChampions + stats.trueDamageDealtToChampions) / 2;
    positionStat.averageMagicDamageDealtToChampions =
      (positionStat.averageMagicDamageDealtToChampions + stats.magicDamageDealtToChampions) / 2;
    positionStat.averagePhysicalDamageDealtToChampions =
      (positionStat.averagePhysicalDamageDealtToChampions + stats.physicalDamageDealtToChampions) /
      2;
    positionStat.averageHeal = (positionStat.averageHeal + stats.heal) / 2;
    positionStat.averageUnitsHealed = (positionStat.averageUnitsHealed + stats.unitsHealed) / 2;
    return positionStat;
  };
  let key = JSON.stringify({
    championKey,
    position,
    gameVersion,
  });
  if (!data[key]) {
    const positionStat = await StatisticsChampionPosition.findOne(
      {
        championKey,
        position,
        gameVersion,
      },
      { _id: 0 }
    ).lean();
    if (!positionStat) {
      data[key] = {
        count: 1,
        win: isWin ? 1 : 0,
        averageKills: stats.kills,
        averageDeaths: stats.deaths,
        averageAssists: stats.assists,
        averageGoldEarned: stats.goldEarned,
        averageDamageTaken: stats.damageTaken,
        averageKillPercent: stats.killPercent,
        averageTimeCCingOthers: stats.timeCCingOthers,
        averageTimeCrowdControlDealt: stats.timeCrowdControlDealt,
        averageNeutralMinionsKilled: stats.neutralMinionsKilled,
        averageNeutralMinionsKilledTeamJungle: stats.neutralMinionsKilledTeamJungle,
        averageNeutralMinionsKilledEnemyJungle: stats.neutralMinionsKilledEnemyJungle,
        averageDamageSelfMitigated: stats.damageSelfMitigated,
        averageTrueDamageDealtToChampions: stats.trueDamageDealtToChampions,
        averageMagicDamageDealtToChampions: stats.magicDamageDealtToChampions,
        averagePhysicalDamageDealtToChampions: stats.physicalDamageDealtToChampions,
        averageHeal: stats.heal,
        averageUnitsHealed: stats.unitsHealed,
      };
    } else {
      data[key] = setPositionStat(positionStat);
    }
  } else {
    data[key] = setPositionStat(data[key]);
  }

  return data;
}
