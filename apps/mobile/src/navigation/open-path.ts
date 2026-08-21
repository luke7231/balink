import {
  CommonActions,
  StackActions,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";
import {
  isStackPath,
  isTabRootPath,
  tabForPath,
  type TabName,
} from "../web-config";
import type { RootTabParamList, WebStackParamList } from "./types";

type StackNav = NavigationProp<WebStackParamList>;

function findTabNavigation(
  navigation: NavigationProp<ParamListBase>,
): NavigationProp<RootTabParamList> | null {
  let current: NavigationProp<ParamListBase> | undefined = navigation;
  while (current) {
    const state = current.getState?.();
    const names = state?.routeNames;
    if (
      names &&
      names.includes("Jobs") &&
      names.includes("Substitutes") &&
      names.includes("Bookmarks") &&
      names.includes("Notifications") &&
      names.includes("Account")
    ) {
      return current as NavigationProp<RootTabParamList>;
    }
    current = current.getParent();
  }
  return null;
}

function findStackNavigation(
  navigation: NavigationProp<ParamListBase>,
): StackNav | null {
  let current: NavigationProp<ParamListBase> | undefined = navigation;
  while (current) {
    const state = current.getState?.();
    const names = state?.routeNames;
    if (names?.includes("Home") && names.includes("Web")) {
      return current as StackNav;
    }
    current = current.getParent();
  }
  return null;
}

function currentTabName(navigation: NavigationProp<ParamListBase>): TabName | null {
  const tabNav = findTabNavigation(navigation);
  if (!tabNav) return null;
  const state = tabNav.getState();
  const route = state.routes[state.index ?? 0];
  return (route?.name as TabName) ?? null;
}

/**
 * Route an in-app path via native tabs/stacks.
 * Returns true if the WebView should cancel the load.
 */
export function openAppPath(
  navigation: NavigationProp<ParamListBase>,
  pathWithQuery: string,
): boolean {
  const pathname = pathWithQuery.split("?")[0] || "/";
  const tab = tabForPath(pathname);
  const tabNav = findTabNavigation(navigation);
  if (!tabNav) return false;

  if (isTabRootPath(pathname)) {
    const activeTab = currentTabName(navigation);
    const stackNav = findStackNavigation(navigation);
    // Same tab stack screen → list: pop to Home so the tab-root WebView keeps scroll.
    if (activeTab === tab && stackNav?.canGoBack()) {
      stackNav.dispatch(StackActions.popToTop());
      return true;
    }
    tabNav.dispatch(
      CommonActions.navigate({
        name: tab,
        params: {
          screen: "Home",
          params: { path: pathWithQuery },
        },
      }),
    );
    return true;
  }

  if (!isStackPath(pathname)) {
    return false;
  }

  const activeTab = currentTabName(navigation);
  const stackNav = findStackNavigation(navigation);

  if (activeTab === tab && stackNav) {
    stackNav.dispatch(StackActions.push("Web", { path: pathWithQuery }));
    return true;
  }

  tabNav.dispatch(
    CommonActions.navigate({
      name: tab,
      params: {
        screen: "Web",
        params: { path: pathWithQuery },
      },
    }),
  );
  return true;
}

export function openPushHref(
  dispatch: ((action: ReturnType<typeof CommonActions.navigate>) => void) | null | undefined,
  href: string,
): void {
  if (!dispatch) return;
  const pathname = href.split("?")[0] || "/";
  const tab = tabForPath(pathname);

  if (isTabRootPath(pathname)) {
    dispatch(
      CommonActions.navigate({
        name: tab,
        params: { screen: "Home", params: { path: href } },
      }),
    );
    return;
  }

  dispatch(
    CommonActions.navigate({
      name: tab,
      params: {
        screen: "Web",
        params: { path: href },
      },
    }),
  );
}
