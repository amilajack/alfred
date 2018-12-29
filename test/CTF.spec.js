/* eslint no-restricted-syntax: off */
import powerset from '@amilajack/powerset';
import * as CtfNodes from '../src/CTF';

describe('CTF', () => {
  const { getConfigs, default: CTF, getDependencies, ...ctfs } = CtfNodes;
  const ctfNamesCombinations = powerset(Object.keys(ctfs)).sort();

  for (const ctfCombination of ctfNamesCombinations) {
    it(`combination ${ctfCombination.join(',')}`, () => {
      expect(ctfCombination).toMatchSnapshot();
      // Get the CTFs for each combination
      const filteredCmfs = ctfCombination.map(ctfName => ctfs[ctfName]);
      const result = CTF(filteredCmfs);
      expect(getConfigs(result)).toMatchSnapshot();
      expect(getDependencies(result)).toMatchSnapshot();
    });
  }
});
