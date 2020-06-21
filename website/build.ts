import path from 'path';
import { execSync } from 'child_process';

execSync('yarn build && yarn typedoc --out website/static/api', {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
