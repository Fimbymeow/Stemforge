import { signInWithGoogle } from "@/app/account/actions";
import { SubmitButton } from "@/components/account/submit-button";

export function GoogleSignInOption({ next }: { next: string }) {
  return (
    <>
      <form action={signInWithGoogle} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <SubmitButton idle="Continue with Google" pending="Opening Google…" className="min-h-12 w-full rounded-lg border border-ink bg-white px-6 text-sm font-extrabold text-ink disabled:cursor-wait disabled:opacity-60" />
      </form>
      <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span>or use email</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}
