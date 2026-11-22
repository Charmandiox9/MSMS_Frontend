import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  buildSchema,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "graphql";

// The backend generates this schema from NestJS decorators; never edit it by hand.
const editorial = process.argv[2] === "--editorial";
const feature = editorial ? "editorial" : "assistantship";
const schemaPath =
  process.argv[editorial ? 3 : 2] ??
  fileURLToPath(new URL("../../backend/src/schema.gql", import.meta.url));
const schema = buildSchema(readFileSync(schemaPath, "utf8"));
const scalar = {
  String: "string",
  ID: "string",
  Int: "number",
  Float: "number",
  Boolean: "boolean",
  DateTime: "string",
};
function typeName(type) {
  if (isNonNullType(type)) return nonNullable(type.ofType);
  return `${nonNullable(type)} | null`;
}
function nonNullable(type) {
  if (isListType(type)) return `Array<${typeName(type.ofType)}>`;
  if (isScalarType(type)) {
    if (!scalar[type.name]) throw new Error(`Unsupported scalar: ${type.name}`);
    return scalar[type.name];
  }
  return type.name;
}
const typePattern = editorial
  ? /^Editorial/
  : /^(Assistantship|RegisterAssistantship|SaveAssistantshipTariff)/;
const types = Object.values(schema.getTypeMap()).filter((type) => typePattern.test(type.name));
const declarations = types.map((type) => {
  if (isEnumType(type))
    return `export type ${type.name} = ${type
      .getValues()
      .map((value) => JSON.stringify(value.name))
      .join(" | ")};`;
  if (!isObjectType(type) && !isInputObjectType(type))
    throw new Error(`Unsupported type: ${type.name}`);
  const fields = Object.values(type.getFields()).map((field) => {
    const optional =
      isInputObjectType(type) &&
      (!isNonNullType(field.type) || field.defaultValue !== undefined);
    return `  ${field.name}${optional ? "?" : ""}: ${typeName(field.type)};`;
  });
  return `export interface ${type.name} {\n${fields.join("\n")}\n}`;
});
const output = new URL(
  editorial ? "../src/features/editorial/schema-types.ts" : "../src/app/[locale]/(dashboard)/dashboard/assistantships/schema-types.ts",
  import.meta.url,
);
writeFileSync(
  output,
  `// Generated from the backend GraphQL schema. Run pnpm run generate:${feature}-types.\n\n${declarations.join("\n\n")}\n`,
);
process.stdout.write(
  `Generated ${types.length} ${feature} GraphQL types.\n`,
);
