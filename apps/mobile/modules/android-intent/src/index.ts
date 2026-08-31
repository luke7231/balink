import { Platform } from "react-native";
import { requireNativeModule } from "expo";

type AndroidIntentNative = {
  openIntentUri(uri: string): Promise<boolean>;
};

const NativeModule =
  Platform.OS === "android"
    ? requireNativeModule<AndroidIntentNative>("AndroidIntent")
    : null;

/** Android `Intent.parseUri`로 intent URL을 연다. iOS·미지원은 false. */
export async function openIntentUri(uri: string): Promise<boolean> {
  if (!NativeModule) return false;
  return NativeModule.openIntentUri(uri);
}
