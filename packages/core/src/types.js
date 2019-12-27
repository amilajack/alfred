export type AlfredConfig = {
  extends?: Array<string> | string,
  npmClient: 'npm' | 'yarn',
  skills: Array<string | [string, Object]>,
  root: string,
  showConfigs: boolean
};
