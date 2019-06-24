import { Demacia } from '../lib/demacia/demacia';

let apiKey = process.env.LOL_API_KEY;
if (!apiKey) {
  apiKey = '';
}

export default new Demacia(apiKey);
