export type AmplitudeAppEnv = "dev" | "prd";

export function resolveAmplitudeAppEnv(
  vercelEnv?: string | null,
): AmplitudeAppEnv {
  return vercelEnv === "production" ? "prd" : "dev";
}

export function resolveAmplitudeApiKey(input: {
  vercelEnv?: string | null;
  devApiKey?: string | null;
  prdApiKey?: string | null;
}): { env: AmplitudeAppEnv; apiKey: string | undefined } {
  const env = resolveAmplitudeAppEnv(input.vercelEnv);
  const raw = env === "prd" ? input.prdApiKey : input.devApiKey;
  const apiKey = raw?.trim() || undefined;
  return { env, apiKey };
}
