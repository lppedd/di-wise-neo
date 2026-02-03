/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  intentionallyNotExported: [
    "src/container.ts:ProviderFor",
    "src/container.ts:RegistrationOptionsFor",
    "src/decorators/decorators.ts:ClassDecorator",
    "src/decorators/decorators.ts:ParameterDecorator",
    "src/utils/requiredNonNullable.ts:RequiredNonNullable",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default config;
