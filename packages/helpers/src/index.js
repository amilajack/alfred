// @flow
/* eslint import/prefer-default-export: off */
/* eslint import/no-dynamic-require: off */
import path from 'path';
import opn from 'opn';
import pkgUp from 'pkg-up';
import childProcess from 'child_process';

/**
 * Get the name of the package JSON
 * @param {string} pkgName The name of the package
 * @param {string} binName The property of the bin object that we want
 */
export async function getPkgBinPath(pkgName: string, binName: string) {
  const pkgPath = require.resolve(pkgName);
  const pkgJsonPath = await pkgUp({ cwd: pkgPath });

  const { bin } = require(pkgJsonPath);
  if (!bin) {
    throw new Error(
      `Module "${pkgName}" does not have a binary because it does not have a "bin" property in it's package.json`
    );
  }

  return path.join(
    path.dirname(pkgJsonPath),
    typeof bin === 'string' ? bin : bin[binName]
  );
}

export function execCommand(cmd: string) {
  return childProcess.execSync(cmd, { stdio: 'inherit' });
}

export async function openInBrowser(url: string, browser: any) {
  // Don't open new tab when running end to end tests. This prevents hundreds
  // of tabs from being opened.
  if (process.env.E2E_CLI_TEST) return;

  try {
    const options = typeof browser === 'string' ? { app: browser } : undefined;
    await opn(url, options);
  } catch (err) {
    console.error(`Unexpected error while opening in browser: ${browser}`);
    console.error(err);
  }
}
