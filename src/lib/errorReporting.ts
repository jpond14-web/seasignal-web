import * as Sentry from "@sentry/nextjs";

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

  // Structured log for log aggregators
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

  // Send to Sentry
  Sentry.captureException(error instanceof Error ? error : new Error(message), {
    tags: { source: context.source },
    extra: context.meta,
  });
}
