import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";

/**
 * 탭 안 스택이 루트(Home)일 때만 가로 스와이프 탭 전환을 켭니다.
 * 상세 화면에서는 뒤로가기 제스처와 충돌하지 않게 끕니다.
 */
export function useTabSwipeAtRoot() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  useEffect(() => {
    // WebScreen 기준: navigation = 탭 안 스택, getParent() = 탭
    const tabNav = navigation.getParent();
    if (!tabNav) return;

    const sync = () => {
      const index = navigation.getState()?.index ?? 0;
      tabNav.setOptions({ swipeEnabled: index === 0 });
    };

    sync();
    return navigation.addListener("state", sync);
  }, [navigation]);
}
