import { envConfig } from "./lib/utils.mjs";

const config = envConfig();
console.log(JSON.stringify({
  status: "idle",
  app: "healthcare-testimony",
  workerMaxPages: config.workerMaxPages,
  workerIdleMs: config.workerIdleMs
}, null, 2));
