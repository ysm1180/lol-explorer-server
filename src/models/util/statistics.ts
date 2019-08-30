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
  const rivalStats = await StatisticsChampionRivalStat.findOne({
    championKey,
    rivalChampionKey,
    position,
    gameVersion,
  });
  if (rivalStats) {
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

    await rivalStats.save();
  } else {
    const rivalStats = new StatisticsChampionRivalStat({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
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
    });

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

    await rivalStats.save();
  }

  const spell = await StatisticsChampionRivalSpell.findOne({
    championKey,
    rivalChampionKey,
    position,
    gameVersion,
    spells,
  });
  if (spell) {
    spell.count++;
    if (isWin) {
      spell.win++;
    }
    await spell.save();
  } else {
    await new StatisticsChampionRivalSpell({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      spells,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }

  const { mainRuneStyle, mainRunes, subRuneStyle, subRunes, statRunes } = runeData;
  const rune = await StatisticsChampionRivalRune.findOne({
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
  if (rune) {
    rune.count++;
    if (isWin) {
      rune.win++;
    }
    await rune.save();
  } else {
    await new StatisticsChampionRivalRune({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      mainRuneStyle,
      mainRunes,
      subRuneStyle,
      subRunes,
      statRunes,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }

  if (startItems.length > 0) {
    const startItem = await StatisticsChampionRivalStartItem.findOne({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      items: startItems,
    });
    if (startItem) {
      startItem.count++;
      if (isWin) {
        startItem.win++;
      }
      await startItem.save();
    } else {
      await new StatisticsChampionRivalStartItem({
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
        items: startItems,
        count: 1,
        win: isWin ? 1 : 0,
      }).save();
    }
  }

  if (items.length >= 3) {
    const item = await StatisticsChampionRivalMainItemBuild.findOne({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      items,
    });
    if (item) {
      item.count++;
      if (isWin) {
        item.win++;
      }
      await item.save();
    } else {
      await new StatisticsChampionRivalMainItemBuild({
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
        items,
        itemCount: items.length,
        count: 1,
        win: isWin ? 1 : 0,
      }).save();
    }
  }

  if (itemBuild.length > 0) {
    const item = await StatisticsChampionRivalItemBuild.findOne({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      items: itemBuild,
    });
    if (item) {
      item.count++;
      if (isWin) {
        item.win++;
      }
      await item.save();
    } else {
      await new StatisticsChampionRivalItemBuild({
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
        items: itemBuild,
        count: 1,
        win: isWin ? 1 : 0,
      }).save();
    }
  }

  for (const finalItem of finalItems) {
    const item = await StatisticsChampionRivalFinalItem.findOne({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      item: finalItem,
    });
    if (item) {
      item.count++;
      if (isWin) {
        item.win++;
      }
      await item.save();
    } else {
      await new StatisticsChampionRivalFinalItem({
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
        item: finalItem,
        count: 1,
        win: isWin ? 1 : 0,
      }).save();
    }
  }

  if (shoes.itemId !== 0) {
    const rivalShoes = await StatisticsChampionRivalShoes.findOne({
      championKey,
      rivalChampionKey,
      position,
      gameVersion,
      shoes: shoes.itemId,
    });
    if (rivalShoes) {
      rivalShoes.count++;
      if (isWin) {
        rivalShoes.win++;
      }
      rivalShoes.averageTimestamp = (rivalShoes.averageTimestamp + shoes.timestamp) / 2;
      await rivalShoes.save();
    } else {
      await new StatisticsChampionRivalShoes({
        championKey,
        rivalChampionKey,
        position,
        gameVersion,
        count: 1,
        win: isWin ? 1 : 0,
        shoes: shoes.itemId,
        averageTimestamp: shoes.timestamp,
      }).save();
    }
  }

  if (skills.length >= 15) {
    const skillset = await StatisticsChampionRivalSkillSet.findOne({
      championKey,
      position,
      gameVersion,
      skills,
    });
    if (skillset) {
      skillset.count++;
      if (isWin) {
        skillset.win++;
      }
      await skillset.save();
    } else {
      await new StatisticsChampionRivalSkillSet({
        championKey,
        position,
        gameVersion,
        skills,
        count: 1,
        win: isWin ? 1 : 0,
      }).save();
    }
  }
}

export async function saveChampionShoes({
  championKey,
  position,
  gameVersion,
  shoes: shoesId,
  timestamp,
  isWin,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  shoes: number;
  timestamp: number;
  isWin: boolean;
}) {
  const shoes = await StatisticsChampionShoes.findOne({
    championKey,
    position,
    gameVersion,
    shoes: shoesId,
  });
  if (shoes) {
    shoes.count++;
    if (isWin) {
      shoes.win++;
    }
    shoes.averageTimestamp = (shoes.averageTimestamp + timestamp) / 2;
    await shoes.save();
  } else {
    await new StatisticsChampionShoes({
      championKey,
      position,
      gameVersion,
      count: 1,
      win: isWin ? 1 : 0,
      shoes: shoesId,
      averageTimestamp: timestamp,
    }).save();
  }
}

export async function saveChampionTimeWin({
  championKey,
  position,
  gameVersion,
  gameMinutes,
  isWin,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  gameMinutes: number;
  isWin: boolean;
}) {
  const count = await StatisticsChampionTimeWin.findOne({
    championKey,
    position,
    gameVersion,
    gameMinutes,
  });
  if (count) {
    count.count++;
    if (isWin) {
      count.win++;
    }
    await count.save();
  } else {
    await new StatisticsChampionTimeWin({
      championKey,
      position,
      gameMinutes,
      gameVersion,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionBans({
  totalBannedChampions,
  gameVersion,
}: {
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

  for (const championKey of Object.keys(championCount)) {
    const championBan = await StatisticsChampionBan.findOne({
      championKey,
      gameVersion,
    });
    if (championBan) {
      championBan.countByGame++;
      championBan.count += championCount[championKey];
      await championBan.save();
    } else {
      await new StatisticsChampionBan({
        championKey,
        gameVersion,
        count: championCount[championKey],
        countByGame: 1,
      }).save();
    }
  }
}

export async function saveChampionRune({
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
  const rune = await StatisticsChampionRune.findOne({
    championKey,
    position,
    gameVersion,
    mainRuneStyle,
    mainRunes,
    subRuneStyle,
    subRunes,
    statRunes,
  });
  if (rune) {
    rune.count++;
    if (isWin) {
      rune.win++;
    }
    await rune.save();
  } else {
    await new StatisticsChampionRune({
      championKey,
      position,
      gameVersion,
      mainRuneStyle,
      mainRunes,
      subRuneStyle,
      subRunes,
      statRunes,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionSkillSet({
  championKey,
  position,
  gameVersion,
  isWin,
  skills,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  skills: number[];
}) {
  const skillset = await StatisticsChampionSkillSet.findOne({
    championKey,
    position,
    gameVersion,
    skills,
  });
  if (skillset) {
    skillset.count++;
    if (isWin) {
      skillset.win++;
    }
    await skillset.save();
  } else {
    await new StatisticsChampionSkillSet({
      championKey,
      position,
      gameVersion,
      skills,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionItemBuild({
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const item = await StatisticsChampionItemBuild.findOne({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (item) {
    item.count++;
    if (isWin) {
      item.win++;
    }
    await item.save();
  } else {
    await new StatisticsChampionItemBuild({
      championKey,
      position,
      gameVersion,
      items,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionMainItems({
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const item = await StatisticsChampionMainItem.findOne({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (item) {
    item.count++;
    if (isWin) {
      item.win++;
    }
    await item.save();
  } else {
    await new StatisticsChampionMainItem({
      championKey,
      position,
      gameVersion,
      items,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionFinalItem({
  championKey,
  position,
  gameVersion,
  isWin,
  item,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  item: number;
}) {
  const finalItem = await StatisticsChampionFinalItem.findOne({
    championKey,
    position,
    gameVersion,
    item,
  });
  if (finalItem) {
    finalItem.count++;
    if (isWin) {
      finalItem.win++;
    }
    await finalItem.save();
  } else {
    await new StatisticsChampionFinalItem({
      championKey,
      position,
      gameVersion,
      item,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionFinalItemBuild({
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const item = await StatisticsChampionFinalItemBuild.findOne({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (item) {
    item.count++;
    if (isWin) {
      item.win++;
    }
    await item.save();
  } else {
    await new StatisticsChampionFinalItemBuild({
      championKey,
      position,
      gameVersion,
      items,
      itemCount: items.length,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionSpell({
  championKey,
  position,
  gameVersion,
  isWin,
  spells,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  spells: number[];
}) {
  const spell = await StatisticsChampionSpell.findOne({
    championKey,
    position,
    gameVersion,
    spells,
  });
  if (spell) {
    spell.count++;
    if (isWin) {
      spell.win++;
    }
    await spell.save();
  } else {
    await new StatisticsChampionSpell({
      championKey,
      position,
      gameVersion,
      spells,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}

export async function saveChampionStartItem({
  championKey,
  position,
  gameVersion,
  isWin,
  items,
}: {
  championKey: number;
  position: number;
  gameVersion: string;
  isWin: boolean;
  items: number[];
}) {
  const startItem = await StatisticsChampionStartItem.findOne({
    championKey,
    position,
    gameVersion,
    items,
  });
  if (startItem) {
    startItem.count++;
    if (isWin) {
      startItem.win++;
    }
    await startItem.save();
  } else {
    await new StatisticsChampionStartItem({
      championKey,
      position,
      gameVersion,
      items,
      count: 1,
      win: isWin ? 1 : 0,
    }).save();
  }
}
export async function saveChampionPosition({
  championKey,
  position,
  gameVersion,
  isWin,
  stats,
}: {
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
  const data = await StatisticsChampionPosition.findOne({
    championKey,
    position,
    gameVersion,
  });
  if (data) {
    data.count++;
    if (isWin) {
      data.win++;
    }
    data.averageKills = (data.averageKills + stats.kills) / 2;
    data.averageDeaths = (data.averageDeaths + stats.deaths) / 2;
    data.averageAssists = (data.averageAssists + stats.assists) / 2;
    data.averageGoldEarned = (data.averageGoldEarned + stats.goldEarned) / 2;
    data.averageDamageTaken = (data.averageDamageTaken + stats.damageTaken) / 2;
    data.averageKillPercent = (data.averageKillPercent + stats.killPercent) / 2;
    data.averageTimeCCingOthers = (data.averageTimeCCingOthers + stats.timeCCingOthers) / 2;
    data.averageTimeCrowdControlDealt =
      (data.averageTimeCrowdControlDealt + stats.timeCrowdControlDealt) / 2;
    data.averageNeutralMinionsKilled =
      (data.averageNeutralMinionsKilled + stats.neutralMinionsKilled) / 2;
    if (!data.averageNeutralMinionsKilledTeamJungle) {
      data.averageNeutralMinionsKilledTeamJungle = 0;
    }
    if (!stats.neutralMinionsKilledTeamJungle) {
      stats.neutralMinionsKilledTeamJungle = 0;
    }
    data.averageNeutralMinionsKilledTeamJungle =
      (data.averageNeutralMinionsKilledTeamJungle + stats.neutralMinionsKilledTeamJungle) / 2;
    if (!data.averageNeutralMinionsKilledEnemyJungle) {
      data.averageNeutralMinionsKilledEnemyJungle = 0;
    }
    if (!stats.neutralMinionsKilledEnemyJungle) {
      stats.neutralMinionsKilledEnemyJungle = 0;
    }
    data.averageNeutralMinionsKilledEnemyJungle =
      (data.averageNeutralMinionsKilledEnemyJungle + stats.neutralMinionsKilledEnemyJungle) / 2;
    data.averageDamageSelfMitigated =
      (data.averageDamageSelfMitigated + stats.damageSelfMitigated) / 2;
    data.averageTrueDamageDealtToChampions =
      (data.averageTrueDamageDealtToChampions + stats.trueDamageDealtToChampions) / 2;
    data.averageMagicDamageDealtToChampions =
      (data.averageMagicDamageDealtToChampions + stats.magicDamageDealtToChampions) / 2;
    data.averagePhysicalDamageDealtToChampions =
      (data.averagePhysicalDamageDealtToChampions + stats.physicalDamageDealtToChampions) / 2;
    data.averageHeal = (data.averageHeal + stats.heal) / 2;
    data.averageUnitsHealed = (data.averageUnitsHealed + stats.unitsHealed) / 2;
    await data.save();
  } else {
    await new StatisticsChampionPosition({
      championKey,
      position,
      gameVersion,
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
    }).save();
  }
}
