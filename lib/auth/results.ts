export type AuthResultCode =
  | "callback_invalid"
  | "invalid_credentials"
  | "oauth_cancelled"
  | "oauth_identity_conflict"
  | "oauth_unavailable"
  | "password_invalid"
  | "recovery_requested"
  | "signed_out"
  | "signup_check_email"
  | "unverified_email"
  | "updated"
  | "unexpected";

export function mapProviderError(message: string | undefined): AuthResultCode {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("email not confirmed")) return "unverified_email";
  if (normalized.includes("invalid login credentials")) return "invalid_credentials";
  if (normalized.includes("password")) return "password_invalid";
  return "unexpected";
}

export function mapOAuthCallbackError(code: string | null, description: string | null): AuthResultCode {
  const normalized = `${code ?? ""} ${description ?? ""}`.toLowerCase();
  if (normalized.includes("access_denied") || normalized.includes("cancel")) return "oauth_cancelled";
  if (normalized.includes("identity") || normalized.includes("already") || normalized.includes("linked")) return "oauth_identity_conflict";
  return "oauth_unavailable";
}

export const AUTH_RESULT_MESSAGES: Record<AuthResultCode, string> = {
  callback_invalid: "That account link is invalid or has expired. Please request a new email.",
  invalid_credentials: "Check your email and password, then try again.",
  oauth_cancelled: "Google sign-in was cancelled. You can try again or use email and password.",
  oauth_identity_conflict: "That email is already connected to an account in a different way. Sign in using the method you used before, or reset your password.",
  oauth_unavailable: "Google sign-in could not be completed. Please try again or use email and password.",
  password_invalid: "Use a password of at least 8 characters.",
  recovery_requested: "If an account exists for that email, a recovery link has been sent.",
  signed_out: "You have been signed out. Progress stored in this browser is unchanged.",
  signup_check_email: "Check your email to verify your account, then return here to sign in.",
  unverified_email: "Please verify your email before signing in.",
  updated: "Your password has been updated.",
  unexpected: "The account request could not be completed. Please try again.",
};

export function readAuthResultCode(value: unknown): AuthResultCode | null {
  return typeof value === "string" && value in AUTH_RESULT_MESSAGES ? value as AuthResultCode : null;
}
