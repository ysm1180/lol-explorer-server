import * as util from 'util';

const DDRAGON_URL = {
  VERSION: 'https://ddragon.leagueoflegends.com/api/versions.json',
  PROFILE_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/profileicon/%s.png',
  STATIC_CHAMPION_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/champion.json',
  STATIC_CHAMPION_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/champion/%s.json',
  CHAMPION_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/champion/%s',
  CHAMPION_PASSIVE_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/passive/%s',
  CHAMPION_SPELL_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/spell/%s',
  STATIC_SPELL_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/summoner.json',
  SPELL_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/spell/%s',
  STATIC_ITEM_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/item.json',
  ITEM_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/item/%s',
  PATCH: 'https://raw.githubusercontent.com/CommunityDragon/Data/master/patches.json',
  STATIC_PERK_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/runesReforged.json',
  BASE_PERK_ICON_URL: 'https://ddragon.leagueoflegends.com/cdn/img/',
};

export class DDragonHelper {
  static URL_VERSION(): string {
    return DDRAGON_URL.VERSION;
  }

  static URL_PROFILE_ICON(version: string, icon: number): string {
    return util.format(DDRAGON_URL.PROFILE_ICON, version, icon.toString());
  }

  static URL_CHAMPION_ICON(version: string, champion: string): string {
    return util.format(DDRAGON_URL.CHAMPION_ICON, version, champion);
  }

  static URL_CHAMPION_PASSIVE_ICON(version: string, passiveIconName: string): string {
    return util.format(DDRAGON_URL.CHAMPION_PASSIVE_ICON, version, passiveIconName);
  }

  static URL_CHAMPION_SPELL_ICON(version: string, spellIconName: string): string {
    return util.format(DDRAGON_URL.CHAMPION_SPELL_ICON, version, spellIconName);
  }

  static URL_SPELL_ICON(version: string, spellIconName: string): string {
    return util.format(DDRAGON_URL.SPELL_ICON, version, spellIconName);
  }

  static URL_ITEM_ICON(version: string, itemIconName: string) {
    return util.format(DDRAGON_URL.ITEM_ICON, version, itemIconName);
  }

  static URL_PERK_ICON(version: string): string {
    return util.format(DDRAGON_URL.BASE_PERK_ICON_URL, version);
  }

  static URL_STATIC_CHAMPIONS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_CHAMPION_ALL_DATA, version);
  }

  static URL_STATIC_CHAMPION_DATA(version: string, champion: string): string {
    return util.format(DDRAGON_URL.STATIC_CHAMPION_DATA, version, champion);
  }

  static URL_STATIC_ITEMS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_ITEM_ALL_DATA, version);
  }

  static URL_STATIC_SPELLS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_SPELL_ALL_DATA, version);
  }

  static URL_STATIC_PERKS_DATA(version: string): string {
    return util.format(DDRAGON_URL.STATIC_PERK_ALL_DATA, version);
  }

  static URL_PATCH_DATA(): string {
    return DDRAGON_URL.PATCH;
  }
}
