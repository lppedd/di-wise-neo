/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  intentionallyNotExported: [
    "src/decorators/decorators.ts:ClassDecorator", //
    "src/decorators/decorators.ts:ParameterDecorator",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default config;
