// @flow
import type { ProviderInput } from './ProviderInterface';
import Es6ImportsProvider from './Es6ImportsProvider';

export default async function Providers(input: ProviderInput) {
  const providers = [Es6ImportsProvider].map(Provider => new Provider())
    // Sort the providers by priority.
    // @TODO: Temporarily sort by priority number. Eventually we'll implement an listener patterh
    //        to hook into when each provider has finished. Providers will listen for when other
    //        provider have finished
    .sort((a, b) => a.priority - b.priority);

  // Invoke each provider
  providers.reduce((provider, _input) => provider.provide(_input), input);
}
