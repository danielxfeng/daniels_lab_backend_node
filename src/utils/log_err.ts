import * as Sentry from "@sentry/node";

const logErr = (err: unknown, context?: Record<string, any>): void => {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd)
    Sentry.captureException(
      err instanceof Error ? err : new Error(String(err)),
      context ? { extra: context } : undefined
    );
  else console.error(err, context);
};

export default logErr;
