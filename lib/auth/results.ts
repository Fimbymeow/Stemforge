export type AuthResultCode =
  | "callback_invalid"
  | "invalid_credentials"
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

export const AUTH_RESULT_MESSAGES: Record<AuthResultCode, string> = {
  callback_invalid: "That account link is invalid or has expired. Please request a new email.",
  invalid_credentials: "The email address or password was not accepted.",
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
