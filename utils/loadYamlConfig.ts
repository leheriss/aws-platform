import { parse } from 'yaml';
import * as fs from 'fs';
import { AnySchema } from 'yup'; // Import the appropriate type for your schema

export function loadYamlConfig<T>(filePath: string, schema: AnySchema): T {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = parse(fileContents) as T;

    schema.validateSync(data);

    return data;
  } catch (e) {
    console.error(e);
    throw new Error(`Failed to load or parse YAML file: ${filePath}`);
  }
}
