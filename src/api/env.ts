/**
 * Read environment variables from CF Worker bindings.
 */
export function getEnv(
  env: Record<string, string | undefined>,
  name: string,
): string | undefined {
  return env[name]
}
