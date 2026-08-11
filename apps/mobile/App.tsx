import "react-native-gesture-handler";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { enableScreens } from "react-native-screens";
import { BridgeProvider } from "./src/bridge-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { NativeThemeProvider, useNativeTheme } from "./src/theme-context";

enableScreens(true);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NativeThemeProvider>
          <ThemedApp />
        </NativeThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  const { isDark } = useNativeTheme();
  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <BridgeProvider>
        <RootNavigator />
      </BridgeProvider>
    </>
  );
}
