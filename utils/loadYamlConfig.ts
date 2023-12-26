import { parse } from 'yaml';
import { OrganizationConfig } from '../types';
import * as fs from 'fs';

import * as yup from 'yup';

const organizationUnitSchema = yup.object().shape({
  name: yup.string().required(),
  parentName: yup.string().required(),
});

const serviceControlPolicySchema = yup.object().shape({
  name: yup.string().required(),
  description: yup.string().required(),
  targetOUNames: yup.array().of(yup.string()).required(),
  contentFile: yup.string().required(),
});

const organizationConfigSchema = yup.object().shape({
  organizationUnits: yup.array().of(organizationUnitSchema).required(),
  serviceControlPolicies: yup.array().of(serviceControlPolicySchema).required(),
});

export function loadYamlConfig(filePath: string): OrganizationConfig {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = parse(fileContents) as OrganizationConfig;

    organizationConfigSchema.validateSync(data);

    return data;
  } catch (e) {
    console.error(e);
    throw new Error(`Failed to load or parse YAML file: ${filePath}`);
  }
}
