import { UnresolvedConfigInterface } from '@alfred/core/src/types';

declare function mergeConfigs(...objs: Array<UnresolvedConfigInterface | {}>): UnresolvedConfigInterface;

export = mergeConfigs;
