import { differenceWith, mergeWith, unionWith, values } from 'lodash';
import joinArrays from './join-arrays';
import { uniteRules } from './join-arrays-smart';

export { default as unique } from './unique';

function customizeArray(rules) {
  return (a, b, key) => {
    switch (rules[key]) {
      case 'prepend':
        return [...b, ...a];
      case 'replace':
        return b;
      default:
        // append
        return false;
    }
  };
}

function customizeObject(rules) {
  return (a, b, key) => {
    switch (rules[key]) {
      case 'prepend':
        return mergeWith({}, b, a, joinArrays());
      case 'replace':
        return b;
      default:
        // append
        return false;
    }
  };
}

function isRule(key) {
  return ['preLoaders', 'loaders', 'postLoaders', 'rules'].indexOf(key) >= 0;
}

export function merge(...sources) {
  // This supports
  // merge([<object>] | ...<object>)
  // merge({ customizeArray: <fn>, customizeObject: <fn>})([<object>] | ...<object>)
  // where fn = (a, b, key)
  if (sources.length === 1) {
    if (Array.isArray(sources[0])) {
      return mergeWith({}, ...sources[0], joinArrays(sources[0]));
    }

    if (sources[0].customizeArray || sources[0].customizeObject) {
      return (...structures) => {
        if (Array.isArray(structures[0])) {
          return mergeWith({}, ...structures[0], joinArrays(sources[0]));
        }

        return mergeWith({}, ...structures, joinArrays(sources[0]));
      };
    }

    return sources[0];
  }

  return mergeWith({}, ...sources, joinArrays());
}

export default merge;

export const smart = merge({
  customizeArray: (a, b, key) => {
    if (isRule(key.split('.').slice(-1)[0])) {
      return unionWith(a, b, uniteRules.bind(null, {}, key));
    }

    return null;
  }
});

export const multiple = (...sources) => values(merge(sources));

// rules: { <field>: <'append'|'prepend'|'replace'> }
// All default to append but you can override here
export const strategy = (rules = {}) =>
  merge({
    customizeArray: customizeArray(rules),
    customizeObject: customizeObject(rules)
  });
export const smartStrategy = (rules = {}) =>
  merge({
    customizeArray: (a, b, key) => {
      const topKey = key.split('.').slice(-1)[0];

      if (isRule(topKey)) {
        switch (rules[key]) {
          case 'prepend':
            return [
              ...differenceWith(b, a, (newRule, seenRule) =>
                uniteRules(rules, key, newRule, seenRule, 'prepend')
              ),
              ...a
            ];
          case 'replace':
            return b;
          default:
            // append
            return unionWith(a, b, uniteRules.bind(null, rules, key));
        }
      }

      return customizeArray(rules)(a, b, key);
    },
    customizeObject: customizeObject(rules)
  });
