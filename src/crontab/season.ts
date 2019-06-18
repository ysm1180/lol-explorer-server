import axios from 'axios';
import * as console from 'console';
import * as fs from 'fs';
import * as path from 'path';
import { LOL_URL } from '../constants';

export async function loadPatchFile() {
  const dataFolderPath = path.resolve(__dirname, 'data');
  const patchDataPath = path.resolve(dataFolderPath, 'patch.json');

  console.log('[Patch] Check patch data file...');
  if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath);
  }

  console.log('[Patch] Downloading patch file...');
  try {
    const response = await axios.get(LOL_URL.PATCH);
    fs.writeFileSync(patchDataPath, JSON.stringify(response.data));

    console.log('[Patch] Fine.');
  } catch (err) {
    console.log('[Patch] ERROR!!!');
    console.log(err.response);
  }
}
