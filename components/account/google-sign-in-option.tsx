import { signInWithGoogle } from "@/app/account/actions";
import { GoogleSignInSubmitButton } from "@/components/account/submit-button";

export function GoogleSignInOption({ next }: { next: string }) {
  return (
    <>
      <form action={signInWithGoogle} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <GoogleSignInSubmitButton />
      </form>
      <div data-testid="auth-sso-divider" className="my-5 flex items-center gap-3 text-xs font-semibold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span>or</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}
