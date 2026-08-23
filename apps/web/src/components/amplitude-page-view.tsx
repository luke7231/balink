"use client";

import { useEffect, useRef } from "react";
import { trackAmplitudeEvent } from "@/lib/amplitude-client";
import type {
  AmplitudeEventName,
  AmplitudeEventPropsByName,
} from "@/lib/amplitude-events";

type AmplitudePageViewProps<E extends AmplitudeEventName> = {
  event: E;
  props: AmplitudeEventPropsByName[E];
};

/** Fires a typed page-view event once per mount (SSR pages embed this client island). */
export function AmplitudePageView<E extends AmplitudeEventName>({
  event,
  props,
}: AmplitudePageViewProps<E>) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    trackAmplitudeEvent(event, props);
    // Fire once on mount with the SSR-provided payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot page view
  }, [event]);

  return null;
}
