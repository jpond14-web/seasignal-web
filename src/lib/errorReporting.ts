/**
 * Lightweight error reporting utility.
 *
 * In production, replace the body of `reportError` with your preferred
 * service (Sentry, LogRocket, Datadog, etc.). For now, errors are logged
 * to the console with structured context so they can be found in server
 * logs / browser devtools.
 */

interface ErrorContext {
  /** Where the error occurred (e.g. "pushSubscription.subscribe") */
  source: string;
  /** Any extra metadata useful for debugging */
  meta?: Record<string, unknown>;
}

export function reportError(error: unknown, context: ErrorContext): void {
  const message =
    error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Structured log — easily parseable in log aggregators
  console.error(
    JSON.stringify({
      level: "error",
      message,
      source: context.source,
      meta: context.meta,
      stack,
      timestamp: new Date().toISOString(),
    })
  );

  // When Sentry is configured, uncomment:
  // Sentry.captureException(error, { tags: { source: context.source }, extra: context.meta });
}
