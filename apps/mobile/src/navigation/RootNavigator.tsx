import { useEffect, type ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useBridge } from "../bridge-context";
import { playHaptic } from "../haptics";
import { WebScreen } from "../screens/WebScreen";
import { tabRootPath } from "../web-config";
import { openPushHref } from "./open-path";
import type { RootTabParamList, WebStackParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();
const JobsStackNav = createNativeStackNavigator<WebStackParamList>();
const SubstitutesStackNav = createNativeStackNavigator<WebStackParamList>();
const NotificationsStackNav = createNativeStackNavigator<WebStackParamList>();
const AccountStackNav = createNativeStackNavigator<WebStackParamList>();

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: "slide_from_right" as const,
  freezeOnBlur: true,
};

function JobsStackScreen() {
  return (
    <JobsStackNav.Navigator screenOptions={stackScreenOptions}>
      <JobsStackNav.Screen
        name="Home"
        component={WebScreen}
        initialParams={{ path: tabRootPath("Jobs") }}
      />
      <JobsStackNav.Screen name="Web" component={WebScreen} />
    </JobsStackNav.Navigator>
  );
}

function SubstitutesStackScreen() {
  return (
    <SubstitutesStackNav.Navigator screenOptions={stackScreenOptions}>
      <SubstitutesStackNav.Screen
        name="Home"
        component={WebScreen}
        initialParams={{ path: tabRootPath("Substitutes") }}
      />
      <SubstitutesStackNav.Screen name="Web" component={WebScreen} />
    </SubstitutesStackNav.Navigator>
  );
}

function NotificationsStackScreen() {
  return (
    <NotificationsStackNav.Navigator screenOptions={stackScreenOptions}>
      <NotificationsStackNav.Screen
        name="Home"
        component={WebScreen}
        initialParams={{ path: tabRootPath("Notifications") }}
      />
      <NotificationsStackNav.Screen name="Web" component={WebScreen} />
    </NotificationsStackNav.Navigator>
  );
}

function AccountStackScreen() {
  return (
    <AccountStackNav.Navigator screenOptions={stackScreenOptions}>
      <AccountStackNav.Screen
        name="Home"
        component={WebScreen}
        initialParams={{ path: tabRootPath("Account") }}
      />
      <AccountStackNav.Screen name="Web" component={WebScreen} />
    </AccountStackNav.Navigator>
  );
}

function TabIcon({
  label,
  focused,
  name,
  nameOutline,
}: {
  label: string;
  focused: boolean;
  name: ComponentProps<typeof Ionicons>["name"];
  nameOutline: ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? name : nameOutline}
        size={22}
        color={focused ? "#18181b" : "#a1a1aa"}
      />
      <Text style={[styles.tabLabel, focused ? styles.tabLabelActive : null]}>{label}</Text>
    </View>
  );
}

export function RootNavigator() {
  const { setPushOpenHandler } = useBridge();

  useEffect(() => {
    setPushOpenHandler((href) => {
      if (!navigationRef.isReady()) return;
      openPushHref((action) => navigationRef.dispatch(action), href);
    });
    return () => setPushOpenHandler(null);
  }, [setPushOpenHandler]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
        screenListeners={{
          tabPress: (event) => {
            const state = navigationRef.getRootState();
            const tabRoute = state?.routes[state.index ?? 0];
            if (tabRoute?.key !== event.target) {
              void playHaptic("selection");
            }
          },
        }}
      >
        <Tab.Screen
          name="Jobs"
          component={JobsStackScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                label="채용"
                focused={focused}
                name="briefcase"
                nameOutline="briefcase-outline"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Substitutes"
          component={SubstitutesStackScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                label="대강"
                focused={focused}
                name="calendar"
                nameOutline="calendar-outline"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsStackScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                label="알림"
                focused={focused}
                name="notifications"
                nameOutline="notifications-outline"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountStackScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon label="마이" focused={focused} name="person" nameOutline="person-outline" />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingTop: 6,
    borderTopColor: "rgba(228,228,231,0.9)",
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#a1a1aa",
  },
  tabLabelActive: {
    color: "#18181b",
  },
});
