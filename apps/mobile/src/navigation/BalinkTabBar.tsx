import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playHaptic } from "../haptics";
import { useNativeTheme } from "../theme-context";
import type { TabName } from "../web-config";
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
              if (event.defaultPrevented || focused) return;

              void playHaptic("selection");
              const distance = Math.abs(index - state.index);
              const go = () => navigation.navigate(route.name, route.params);

              // 옆 칸: 스와이프와 같은 슬라이드 / 두 칸 이상: 중간 훑지 않고 바로 이동
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
