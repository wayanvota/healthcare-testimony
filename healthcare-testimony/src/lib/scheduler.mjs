export function startScheduler(config) {
  return {
    enabled: Boolean(config?.enableScheduler),
    status: config?.enableScheduler ? "configured" : "disabled"
  };
}
