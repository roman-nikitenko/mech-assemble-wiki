// Loads Google Analytics (gtag.js) ONLY when a Measurement ID is configured,
// so local dev (no VITE_GA_MEASUREMENT_ID) never loads or tracks anything.
// This is what makes GA4 start collecting the visitor numbers the admin
// Dashboard later reads back through the Data API.
export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!id) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  // Google's standard gtag bootstrap, typed for TS.
  const w = window as unknown as {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  // gtag.js only processes genuine `arguments` objects on the dataLayer. A
  // plain array — which an arrow function's `push(args)` / spread produces —
  // is silently ignored, so `config` never registers and NO /g/collect beacon
  // is ever sent (GA then shows "no data" even though the script loads fine).
  // Use a classic function and push the live `arguments` object, exactly like
  // Google's canonical snippet: function gtag(){dataLayer.push(arguments);}
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", id);
}
