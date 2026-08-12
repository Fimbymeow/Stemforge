type ErrorLike = {
  code?: unknown;
  name?: unknown;
  constructor?: { name?: unknown };
};

export type SafeServerErrorDiagnostic = {
  route: string;
  operation: string;
  errorType: string;
  code: string;
  message: string;
};

export function createSafeServerErrorDiagnostic(
  route: string,
  operation: string,
  cause: unknown,
): SafeServerErrorDiagnostic {
  const error = isErrorLike(cause) ? cause : undefined;
  const code = safeIdentifier(error?.code, "unknown");
  const errorType = safeIdentifier(error?.constructor?.name ?? error?.name, "unknown");
  return {
    route: safeRoute(route),
    operation: safeIdentifier(operation, "unknown_operation"),
    errorType,
    code,
    message: safeDatabaseMessage(code),
  };
}

export function logServerOperationError(route: string, operation: string, cause: unknown) {
  console.error(
    "Orthic server operation failed.",
    createSafeServerErrorDiagnostic(route, operation, cause),
  );
}

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === "object" && value !== null;
}

function safeIdentifier(value: unknown, fallback: string) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value)
    ? value
    : fallback;
}

function safeRoute(value: string) {
  return /^\/[A-Za-z0-9_/-]{1,95}$/.test(value) ? value : "unknown_route";
}

function safeDatabaseMessage(code: string) {
  if (code === "42P01") return "A database relation required by this operation is unavailable.";
  if (code === "42703") return "A database column required by this operation is unavailable.";
  if (code === "28P01") return "Database authentication failed.";
  if (code === "3D000") return "The configured database is unavailable.";
  if (code === "ETIMEDOUT") return "The database operation timed out.";
  if (code === "ECONNREFUSED") return "The database connection was refused.";
  if (code === "ENOTFOUND") return "The database host could not be resolved.";
  if (code === "SELF_SIGNED_CERT_IN_CHAIN" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return "Database TLS verification failed.";
  }
  return "An unexpected server operation failed.";
}
