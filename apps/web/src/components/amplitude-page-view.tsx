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

/**
 * Fires enriched detail context once per mount.
 * Generic page views are left to Amplitude autocapture; use this only when
 * the event carries business properties autocapture cannot infer.
 */
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
