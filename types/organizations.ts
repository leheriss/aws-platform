export interface OrganizationConfig {
  organizationUnits: OrganizationalUnit[];
  serviceControlPolicies: ServiceControlPolicy[];
}

export interface OrganizationalUnit {
  name: string;
  parentName: string;
}

interface ServiceControlPolicy {
  name: string;
  description: string;
  targetOUNames: string[];
  contentFile: string;
}
