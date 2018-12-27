// @flow
import * as CmfNodes from '../src/CMF';

const { getConfigs, default: CMF, getDependencies } = CmfNodes;

describe('CMF', () => {
  it('should do basic cmf', () => {
    const { babel, eslint, webpack } = CmfNodes;
    expect(getConfigs(CMF([babel, eslint, webpack]))).toMatchSnapshot();
    expect(getDependencies(CMF([babel, eslint, webpack]))).toMatchSnapshot();
  });
});
