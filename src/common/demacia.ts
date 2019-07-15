import { Demacia } from '../lib/demacia/demacia';
import { STRATEGY } from '../lib/demacia/ratelimiter/ratelimiter';

let apiKey = process.env.LOL_API_KEY;
if (!apiKey) {
  apiKey = '';
}

export default new Demacia(apiKey, STRATEGY.BURST);
