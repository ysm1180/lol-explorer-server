import axios from 'axios';
import { LOL_URL } from '../constants';
import { redisClient, redisGetAsync } from '../db/redis';

export async function getLastVersion() {
  let version = await redisGetAsync('LOL_LAST_VERSION');
  if (!version) {
    const res = await axios.get(LOL_URL.VERSION);
    version = res.data[0];
    redisClient.set('LOL_LAST_VERSION', version);
  }
  return version;
}
