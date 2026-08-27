import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playHaptic } from "../haptics";
import { useNativeTheme } from "../theme-context";
import { tabRootPath, type TabName } from "../web-config";
import { useTabPagerTransition } from "./tab-pager-transition";

const TAB_META: Record<
  TabName,
  {
    label: string;
    name: ComponentProps<typeof Ionicons>["name"];
    nameOutline: ComponentProps<typeof Ionicons>["name"];
  }
> = {
  Jobs: { label: "채용", name: "briefcase", nameOutline: "briefcase-outline" },
  Substitutes: { label: "대강", name: "calendar", nameOutline: "calendar-outline" },
  Bookmarks: { label: "북마크", name: "bookmark", nameOutline: "bookmark-outline" },
  Notifications: {
    label: "알림",
    name: "notifications",
    nameOutline: "notifications-outline",
  },
  Account: { label: "마이", name: "person", nameOutline: "person-outline" },
};

type TabRoute = MaterialTopTabBarProps["state"]["routes"][number];

/** Nested stack is Home at the tab root path (query ignored). */
function isNestedAtTabRoot(route: TabRoute, rootPath: string): boolean {
  const nested = route.state;
  if (!nested) return true;

  const index = nested.index ?? 0;
  if (index !== 0) return false;

  const current = nested.routes[index];
  if (!current || current.name !== "Home") return false;

  const path =
    (current.params as { path?: string } | undefined)?.path ?? rootPath;
  const pathname = path.split("?")[0] || "/";
  return pathname === rootPath;
}

/** Reset nested stack to Home at the tab's root web path. */
function resetTabToRoot(
  navigation: MaterialTopTabBarProps["navigation"],
  tabName: TabName,
  rootPath: string,
) {
  navigation.dispatch(
    CommonActions.navigate({
      name: tabName,
      params: {
        state: {
          index: 0,
          routes: [{ name: "Home", params: { path: rootPath } }],
        },
      },
    }),
  );
}

export function BalinkTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const { isDark } = useNativeTheme();
  const insets = useSafeAreaInsets();
  const { runWithoutPagerAnimation } = useTabPagerTransition();
  const activeColor = isDark ? "#fafafa" : "#18181b";
  const inactiveColor = isDark ? "#71717a" : "#a1a1aa";

  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          borderTopColor: isDark ? "rgba(63,63,70,0.9)" : "rgba(228,228,231,0.9)",
          backgroundColor: isDark ? "rgba(24,24,27,0.98)" : "rgba(255,255,255,0.98)",
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_META[route.name as TabName];
        if (!meta) return null;
        const tabName = route.name as TabName;
        const rootPath = tabRootPath(tabName);
        const atRoot = isNestedAtTabRoot(route, rootPath);

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={meta.label}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (event.defaultPrevented) return;

              void playHaptic("selection");

              // Already focused: we own root reset. preventDefault so native-stack's
              // tabPress → popToTop (rAF) does not race after we reset to Home.
              if (focused) {
                event.preventDefault();
                if (!atRoot) resetTabToRoot(navigation, tabName, rootPath);
                return;
              }

              const distance = Math.abs(index - state.index);
              const go = () => {
                if (atRoot) navigation.navigate(tabName);
                else resetTabToRoot(navigation, tabName, rootPath);
              };

              if (distance <= 1) go();
              else runWithoutPagerAnimation(go);
            }}
            onLongPress={() => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            }}
            style={styles.tabItem}
          >
            <Ionicons
              name={focused ? meta.name : meta.nameOutline}
              size={22}
              color={focused ? activeColor : inactiveColor}
            />
            <Text style={[styles.tabLabel, { color: focused ? activeColor : inactiveColor }]}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    minHeight: 64,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
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
