/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  intentionallyNotExported: [
    "src/decorators/decorators.ts:ClassDecorator",
    "src/decorators/decorators.ts:ParameterDecorator",
    "src/utils/requiredNonNullable.ts:RequiredNonNullable",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default config;
