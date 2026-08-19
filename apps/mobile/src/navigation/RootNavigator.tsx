import { useEffect, useMemo } from "react";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useBridge } from "../bridge-context";
import { WebScreen } from "../screens/WebScreen";
import { useNativeTheme } from "../theme-context";
import { tabRootPath } from "../web-config";
import { BalinkTabBar } from "./BalinkTabBar";
import { openPushHref } from "./open-path";
import { TabPagerTransitionProvider, useTabPagerTransition } from "./tab-pager-transition";
import type { RootTabParamList, WebStackParamList } from "./types";

const Tab = createMaterialTopTabNavigator<RootTabParamList>();
const JobsStackNav = createNativeStackNavigator<WebStackParamList>();
const SubstitutesStackNav = createNativeStackNavigator<WebStackParamList>();
const BookmarksStackNav = createNativeStackNavigator<WebStackParamList>();
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

function RootTabs() {
  const { isDark } = useNativeTheme();
  const { animationEnabled } = useTabPagerTransition();

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <BalinkTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled,
        lazy: true,
        lazyPreloadDistance: 1,
        sceneStyle: {
          backgroundColor: isDark ? "#09090b" : "#ffffff",
        },
      }}
    >
      <Tab.Screen name="Jobs" component={JobsStackScreen} />
      <Tab.Screen name="Substitutes" component={SubstitutesStackScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksStackScreen} />
      <Tab.Screen name="Notifications" component={NotificationsStackScreen} />
      <Tab.Screen name="Account" component={AccountStackScreen} />
    </Tab.Navigator>
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
      <TabPagerTransitionProvider>
        <RootTabs />
      </TabPagerTransitionProvider>
    </NavigationContainer>
  );
}
