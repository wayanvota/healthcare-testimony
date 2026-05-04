export function llmAvailable(config) {
  return Boolean(config?.useLlm && config?.openaiApiKey);
}

export async function maybeGenerateWithLlm() {
  return {
    used: false,
    reason: "LLM generation is disabled by default. Deterministic output was used."
  };
}
