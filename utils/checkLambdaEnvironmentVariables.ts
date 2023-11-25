export function checkRequiredEnvVariables(envVars: string[]): void {
  const missingVars = envVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
