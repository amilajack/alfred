interface ProviderResponse {
  providerName: string;
  stdBuffer: Buffer;
}

interface ProviderInterface {
  provide: () => ProviderResponse;
}
