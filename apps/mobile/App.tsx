import "react-native-gesture-handler";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { enableScreens } from "react-native-screens";
import { BridgeProvider } from "./src/bridge-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

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
        <StatusBar barStyle="dark-content" />
        <BridgeProvider>
          <RootNavigator />
        </BridgeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
