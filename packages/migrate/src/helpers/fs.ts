import fs from 'fs';
import util from 'util';

export const copyFileAsync = util.promisify(fs.copyFile);
export const writeFileAsync = util.promisify(fs.writeFile);
export const statAsync = util.promisify(fs.stat);
export const readFileAsync = util.promisify(fs.readFile);
