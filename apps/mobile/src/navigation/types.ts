import type { NavigatorScreenParams } from "@react-navigation/native";
import type { TabName } from "../web-config";

export type WebStackParamList = {
  Home: { path: string };
  Web: { path: string };
};

export type RootTabParamList = {
  Jobs: NavigatorScreenParams<WebStackParamList>;
  Substitutes: NavigatorScreenParams<WebStackParamList>;
  Notifications: NavigatorScreenParams<WebStackParamList>;
  Account: NavigatorScreenParams<WebStackParamList>;
};

export type { TabName };
