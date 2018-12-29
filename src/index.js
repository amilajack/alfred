import * as CtfHelpersAndNodes from './CTF';

const {
  getConfigs,
  default: CTF,
  getDependencies,
  ...ctfs
} = CtfHelpersAndNodes;
const { jestCtf } = ctfs;
ctfs.jest = jestCtf;
delete ctfs.jestCtf;

export const CTFs = ctfs;

export { getConfigs, getDependencies, default } from './CTF';
