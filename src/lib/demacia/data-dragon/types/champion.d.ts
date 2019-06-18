import { ImageDataDragon } from './image';

export interface IChampionRawData {
  id: string;
  key: string;
  name: string;
  image: ImageDataDragon;
  skins: {
    id: string;
    num: number;
    name: string;
    chromas: boolean;
  }[];
  lore: string;
  blurb: string;
  allytips: string[];
  enemytips: string[];
  tags: string[];
  parttype: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  stats: {
    hp: number;
    hpperlevel: number;
    mp: number;
    mpperlevel: number;
    movespeed: number;
    armor: number;
    armorperlevel: number;
    spellblock: number;
    spellblockperlevel: number;
    attackrange: number;
    hpregen: number;
    hpregenperlevel: number;
    mpregen: number;
    mpregenperlevel: number;
    crit: number;
    critperlevel: number;
    attackdamage: number;
    attackdamageperlevel: number;
    attacksppedperlevel: number;
    attackspeed: number;
  };
  spells: {
    id: string;
    name: string;
    description: string;
    tooltip: string;
    leveltip: {
      label: string[];
      effect: string[];
    };
    maxrank: number;
    cooldown: number[];
    cooldownBurn: string;
    cost: number[];
    image: ImageDataDragon;
  }[];
  passive: {
    name: string;
    description: string;
    image: ImageDataDragon;
  };
  recommended: Object[];
}

export interface IChampionDataDragon {
  type: string;
  format: string;
  version: string;
  data: { [champName: string]: IChampionRawData };
}
