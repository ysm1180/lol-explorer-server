export class SummonerUtil {
  static normalizeSummonerName(name: string) {
    return name.toLowerCase().replace(/ /g, '');
  }
}
