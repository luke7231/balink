import { useEffect, useMemo, type ComponentProps } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useBridge } from "../bridge-context";
import { playHaptic } from "../haptics";
import { WebScreen } from "../screens/WebScreen";
import { useNativeTheme } from "../theme-context";
import { tabRootPath } from "../web-config";
import { openPushHref } from "./open-path";
import type { RootTabParamList, WebStackParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();
const JobsStackNav = createNativeStackNavigator<WebStackParamList>();
const SubstitutesStackNav = createNativeStackNavigator<WebStackParamList>();
const BookmarksStackNav = createNativeStackNavigator<WebStackParamList>();
const NotificationsStackNav = createNativeStackNavigator<WebStackParamList>();
const AccountStackNav = createNativeStackNavigator<WebStackParamList>();

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

const TAB_SHIFT_PX = 12;

function tabSceneStyle({
  current,
}: {
  current: { progress: Animated.Value };
}) {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-TAB_SHIFT_PX, 0, TAB_SHIFT_PX],
          }),
        },
      ],
    },
  };
}

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

function BookmarksStackScreen() {
  return (
    <BookmarksStackNav.Navigator screenOptions={stackScreenOptions}>
      <BookmarksStackNav.Screen
        name="Home"
        component={WebScreen}
        initialParams={{ path: tabRootPath("Bookmarks") }}
      />
      <BookmarksStackNav.Screen name="Web" component={WebScreen} />
    </BookmarksStackNav.Navigator>
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
  const { isDark } = useNativeTheme();
  const activeColor = isDark ? "#fafafa" : "#18181b";
  const inactiveColor = isDark ? "#71717a" : "#a1a1aa";
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? name : nameOutline}
        size={22}
        color={focused ? activeColor : inactiveColor}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? activeColor : inactiveColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function RootNavigator() {
  const { setPushOpenHandler } = useBridge();
  const { isDark } = useNativeTheme();
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: isDark ? "#09090b" : "#ffffff",
        card: isDark ? "#18181b" : "#ffffff",
        border: isDark ? "#3f3f46" : "#e4e4e7",
        text: isDark ? "#fafafa" : "#18181b",
      },
    };
  }, [isDark]);

  useEffect(() => {
    setPushOpenHandler((href) => {
      if (!navigationRef.isReady()) return;
      openPushHref((action) => navigationRef.dispatch(action), href);
    });
    return () => setPushOpenHandler(null);
  }, [setPushOpenHandler]);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          animation: "fade",
          sceneStyleInterpolator: tabSceneStyle,
          transitionSpec: {
            animation: "timing",
            config: {
              duration: 180,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          },
          tabBarStyle: [
            styles.tabBar,
            {
              borderTopColor: isDark ? "rgba(63,63,70,0.9)" : "rgba(228,228,231,0.9)",
              backgroundColor: isDark ? "rgba(24,24,27,0.98)" : "rgba(255,255,255,0.98)",
            },
          ],
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
          name="Bookmarks"
          component={BookmarksStackScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                label="북마크"
                focused={focused}
                name="bookmark"
                nameOutline="bookmark-outline"
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
  },
});
