import CMF from '../src/CMF';

describe('CMF', () => {
  it('should do basic cmf', () => {
    CMF.forEach(cmf => {
      const cmfNames = Object.keys(cmf.cmfs);
      cmfNames.forEach(cmfName => {
        const correspondingCmfNode = CMF.get(cmfName);
        if (correspondingCmfNode) {
          CMF.set(
            cmfName,
            cmf.cmfs[cmfName](correspondingCmfNode, Array.from(CMF.values()))
          );
        }
      });
    });

    expect(
      Array.from(CMF.values())
        .map(cmf => cmf.files)
        .map(([config]) => config.config)
    ).toMatchSnapshot();
  });
});
