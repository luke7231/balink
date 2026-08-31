import type { DeviceInfo } from "@/lib/device";

/** Apple Sign In — required for App Store review when other social logins exist. */
export function isAppleLoginEnabled(): boolean {
  return true;
}

/** Hide Apple login on Android (Galaxy). iPhone and desktop keep the button. */
export function isAppleLoginVisibleOnDevice(device: DeviceInfo): boolean {
  return isAppleLoginEnabled() && !device.isAndroid;
}
