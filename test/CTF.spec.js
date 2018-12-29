/* eslint no-restricted-syntax: off */
import powerset from '@amilajack/powerset';
import CTF, { CTFS, getConfigs, getDependencies } from '../src/CTF';

describe('CTF', () => {
  const ctfNamesCombinations = powerset(Object.keys(CTFS)).sort();

  for (const ctfCombination of ctfNamesCombinations) {
    it(`combination ${ctfCombination.join(',')}`, () => {
      expect(ctfCombination).toMatchSnapshot();
      // Get the CTFs for each combination
      const filteredCtfs = ctfCombination.map(ctfName => CTFS[ctfName]);
      const result = CTF(filteredCtfs);
      expect(getConfigs(result)).toMatchSnapshot();
      expect(getDependencies(result)).toMatchSnapshot();
    });
  }
});
