// @flow
/* eslint import/prefer-default-export: off */
import opn from 'opn';

export async function openInBrowser(url: string, browser: any) {
  // Don't open new tab when running end to end tests. This prevents hundreds
  // of tabs from being opened.
  if (process.env.E2E_CLI_TEST) {
    return;
  }

  try {
    const options = typeof browser === 'string' ? { app: browser } : undefined;

    await opn(url, options);
  } catch (err) {
    console.error(`Unexpected error while opening in browser: ${browser}`);
    console.error(err);
  }
}
