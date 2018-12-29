// @flow
/* eslint no-restricted-syntax: off */
import powerset from '@amilajack/powerset';
import * as CtfNodes from '../src/CTF';

const { getConfigs, default: CTF, getDependencies, ...ctfs } = CtfNodes;

describe('CTF', () => {
  const ctfNamesCombinations = powerset(Object.keys(ctfs));

  for (const ctfCombination of ctfNamesCombinations) {
    it(`should test ${ctfCombination.join(',')} ctf combination`, () => {
      expect(ctfCombination).toMatchSnapshot();
      // Get the CTFs for each combination
      const filteredCmfs = ctfCombination.map(ctfName => ctfs[ctfName]);
      expect(getConfigs(CTF(filteredCmfs))).toMatchSnapshot();
      expect(getDependencies(CTF(filteredCmfs))).toMatchSnapshot();
    });
  }
});
