function mergeStrategyTests(merge) {
  test('should allow setting to array append', () => {
    const a = {
      entry: ['foo', 'bar', 'baz']
    };
    const b = {
      entry: ['zoo']
    };
    const result = {
      entry: ['foo', 'bar', 'baz', 'zoo']
    };

    expect(
      merge({
        entry: 'append'
      })(a, b)
    ).toEqual(result);
  });

  test('should allow setting to array prepend', () => {
    const a = {
      entry: ['foo', 'bar', 'baz']
    };
    const b = {
      entry: ['zoo']
    };
    const result = {
      entry: ['zoo', 'foo', 'bar', 'baz']
    };

    expect(
      merge({
        entry: 'prepend'
      })(a, b)
    ).toEqual(result);
  });

  test('should allow setting to object append', () => {
    const a = {
      entry: {
        foo: 'bar'
      }
    };
    const b = {
      entry: {
        bar: 'baz'
      }
    };
    const result = {
      entry: {
        foo: 'bar',
        bar: 'baz'
      }
    };

    expect(
      Object.keys(
        merge({
          entry: 'append'
        })(a, b).entry
      )
    ).toEqual(Object.keys(result.entry));
  });

  test('should allow setting to object prepend', () => {
    const a = {
      entry: {
        foo: 'bar'
      }
    };
    const b = {
      entry: {
        bar: 'baz'
      }
    };
    const result = {
      entry: {
        bar: 'baz',
        foo: 'bar'
      }
    };

    expect(
      Object.keys(
        merge({
          entry: 'prepend'
        })(a, b).entry
      )
    ).toEqual(Object.keys(result.entry));
  });

  test('should allow replace strategy for arrays', () => {
    const a = {
      entry: ['foo']
    };
    const b = {
      entry: ['bar']
    };
    const result = {
      entry: ['bar']
    };

    expect(
      Object.keys(
        merge({
          entry: 'replace'
        })(a, b).entry
      )
    ).toEqual(Object.keys(result.entry));
  });

  test('should allow replace strategy for objects', () => {
    const a = {
      entry: {
        foo: 'bar'
      }
    };
    const b = {
      entry: {
        bar: 'baz'
      }
    };
    const result = {
      entry: {
        bar: 'baz'
      }
    };

    expect(
      Object.keys(
        merge({
          entry: 'replace'
        })(a, b).entry
      )
    ).toEqual(Object.keys(result.entry));
  });

  test('should merge functions returning arrays with prepend', () => {
    const a = {
      postcss() {
        return ['a'];
      }
    };
    const b = {
      postcss() {
        return ['b'];
      }
    };
    const expected = ['b', 'a'];

    expect(
      merge({
        postcss: 'prepend'
      })(a, b).postcss()
    ).toEqual(expected);
  });

  test('should merge functions returning objects with prepend', () => {
    const a = {
      postcss() {
        return {
          a: 'foo'
        };
      }
    };
    const b = {
      postcss() {
        return {
          b: 'bar'
        };
      }
    };
    const result = {
      postcss() {
        return {
          b: 'bar',
          a: 'foo'
        };
      }
    };

    expect(
      Object.keys(
        merge({
          postcss: 'prepend'
        })(a, b).postcss()
      )
    ).toEqual(Object.keys(result.postcss()));
  });

  test('should merge functions returning arrays with replace', () => {
    const a = {
      postcss() {
        return ['a'];
      }
    };
    const b = {
      postcss() {
        return ['b'];
      }
    };
    const expected = ['b'];

    expect(
      merge({
        postcss: 'replace'
      })(a, b).postcss()
    ).toEqual(expected);
  });

  test('should merge functions returning objects with replace', () => {
    const a = {
      postcss() {
        return ['a'];
      }
    };
    const b = {
      postcss() {
        return ['b'];
      }
    };
    const expected = ['b'];

    expect(
      merge({
        postcss: 'replace'
      })(a, b).postcss()
    ).toEqual(expected);
  });
}

module.exports = mergeStrategyTests;
