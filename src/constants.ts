var BASE_API_URL = 'https://kr.api.riotgames.com';

export const LOL_API_KEY: string = 'RGAPI-f2417de0-bbc0-4e70-88d9-5c13547b0781';
export const LOL_API = {
  GET_SUMMONER_BY_ACCOUNT_ID: BASE_API_URL + '/lol/summoner/v4/summoners/by-account/%s',
  GET_SUMMONER_BY_ID: BASE_API_URL + '/lol/summoner/v4/summoners/%s',
  GET_SUMMONER_BY_NAME: BASE_API_URL + '/lol/summoner/v4/summoners/by-name/%s',
  GET_CHAMPION_MASTERIES:
    BASE_API_URL + '/lol/champion-mastery/v4/champion-masteries/by-summoner/%s',
  GET_MATCH_LIST_BY_ACCOUNT_ID: BASE_API_URL + '/lol/match/v4/matchlists/by-account/%s',
  GET_MATCH_INFO_BY_GAME_ID: BASE_API_URL + '/lol/match/v4/matches/%d',
  GET_SUMMONER_LEAGUE_BY_ID: BASE_API_URL + '/lol/league/v4/entries/by-summoner/%s',
};
