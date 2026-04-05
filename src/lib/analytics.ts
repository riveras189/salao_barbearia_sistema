export function trackAnalyticsEvent(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("analytics", {
      detail: {
        event,
        payload,
      },
    })
  );
}
