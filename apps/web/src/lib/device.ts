export type DeviceOs = "ios" | "android" | "other";
export type DeviceFamily = "iphone" | "ipad" | "galaxy" | "android" | "other";

export type DeviceInfo = {
  os: DeviceOs;
  family: DeviceFamily;
  isIos: boolean;
  isAndroid: boolean;
  isGalaxy: boolean;
};

const EMPTY_DEVICE: DeviceInfo = {
  os: "other",
  family: "other",
  isIos: false,
  isAndroid: false,
  isGalaxy: false,
};

const IOS_IPHONE = /iPhone/i;
const IOS_IPAD = /iPad/i;
const IOS_IPOD = /iPod/i;
const ANDROID = /Android/i;
const GALAXY = /Samsung|SamsungBrowser|\bSM-[A-Za-z0-9]+|Galaxy/i;

/** Parse a User-Agent. Safe on server and client; pass `navigator.userAgent` in the browser. */
export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo {
  if (!userAgent) return EMPTY_DEVICE;

  if (IOS_IPAD.test(userAgent)) {
    return { os: "ios", family: "ipad", isIos: true, isAndroid: false, isGalaxy: false };
  }
  if (IOS_IPHONE.test(userAgent) || IOS_IPOD.test(userAgent)) {
    return { os: "ios", family: "iphone", isIos: true, isAndroid: false, isGalaxy: false };
  }
  if (ANDROID.test(userAgent)) {
    const isGalaxy = GALAXY.test(userAgent);
    return {
      os: "android",
      family: isGalaxy ? "galaxy" : "android",
      isIos: false,
      isAndroid: true,
      isGalaxy,
    };
  }

  return EMPTY_DEVICE;
}

export function isIosDevice(userAgent: string | null | undefined): boolean {
  return parseUserAgent(userAgent).isIos;
}

export function isAndroidDevice(userAgent: string | null | undefined): boolean {
  return parseUserAgent(userAgent).isAndroid;
}

export function isGalaxyDevice(userAgent: string | null | undefined): boolean {
  return parseUserAgent(userAgent).isGalaxy;
}
