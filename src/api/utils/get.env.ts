// Check if the env variables exist, if not log the error
export function mustGetEnv(key: string): string {
  const value = process.env[key];

  if (!value) throw new Error(`Missing enviornment variable ${key}`);
  return value;
}
