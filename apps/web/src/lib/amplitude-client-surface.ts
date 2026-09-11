export type AmplitudeClient = "app" | "web";

/** Native WebView → app. Browser (including mobile Safari) → web. */
export function resolveAmplitudeClient(nativeShell: boolean): AmplitudeClient {
  return nativeShell ? "app" : "web";
}
