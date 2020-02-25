import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const apiDocsDir = path.join(__dirname, './static/api');
const pkgsDir = path.join(__dirname, '../packages');

fs.readdirSync(pkgsDir)
  .map(pkg => {
    const pkgDir = path.join(pkgsDir, pkg);
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    const { name: pkgName } = JSON.parse(
      fs.readFileSync(pkgJsonPath).toString()
    );
    return [pkgName, pkgDir];
  })
  .forEach(([pkgName, pkgDir]) => {
    const docDir = path.join(apiDocsDir, pkgName);
    execSync(
      `yarn workspace ${pkgName} typedoc --out ${docDir} --ignoreCompilerErrors`,
      {
        stdio: 'inherit',
        cwd: pkgDir
      }
    );
  });
