import { ProviderInput, ProviderInterface } from './provider-interface';
export default class LebabProvider implements ProviderInterface {
    /**
     * The list of transforms to apply
     * @TODO Add more transforms
     * @private
     */
    transforms: {
        safe: string[];
        unsafe: string[];
    };
    providerName: string;
    /**
     * Should run before EslintProvider and PrettierProvider. Does not follow code
     * style convention. Only focuses on upgrading code. Not code style
     */
    priority: number;
    safe: boolean;
    /**
     * @private
     */
    getTransforms(input: ProviderInput): string[];
    /**
     * @private
     */
    transform(files: Array<string>, input: ProviderInput): Promise<void>;
    provide(input: ProviderInput): Promise<ProviderInput>;
}
//# sourceMappingURL=lebab-provider.d.ts.map