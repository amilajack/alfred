import { ConfigWithUnresolvedInterfaces } from '@alfred/types';

declare function mergeConfigs(
  ...objs: Array<ConfigWithUnresolvedInterfaces | {}>
): ConfigWithUnresolvedInterfaces;

export = mergeConfigs;
