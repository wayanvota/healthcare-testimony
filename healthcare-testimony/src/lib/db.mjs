export function dbMode(config) {
  return config?.databaseUrl ? "postgres_configured" : "local_memory";
}

export async function closeDb() {
  return true;
}
