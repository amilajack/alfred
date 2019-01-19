// @flow
/* eslint import/prefer-default-export: off */
import opn from 'opn';

export async function openInBrowser(url: string, browser: any) {
  try {
    const options = typeof browser === 'string' ? { app: browser } : undefined;

    await opn(url, options);
  } catch (err) {
    console.error(`Unexpected error while opening in browser: ${browser}`);
    console.error(err);
  }
}
