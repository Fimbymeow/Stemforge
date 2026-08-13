"use client";

import { useEffect, useState } from "react";
import { availableLearnerCourses, MAX_FIRST_NAME_LENGTH } from "@/lib/learner-preferences";
import { useLearnerPreferences } from "@/components/learner-preferences/use-learner-preferences";

export function AccountLearnerPreferences() {
  const { loaded, source, preferences, save, error } = useLearnerPreferences();
  const [firstName, setFirstName] = useState("");
  const [selectedCourseSlugs, setSelectedCourseSlugs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const courses = availableLearnerCourses();

  useEffect(() => {
    setFirstName(preferences.firstName ?? "");
    setSelectedCourseSlugs(preferences.selectedCourseSlugs);
  }, [preferences]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const saved = await save({ ...preferences, firstName, namePromptDismissed: true, selectedCourseSlugs });
    setMessage(saved ? "Your learner preferences were saved." : null);
    setBusy(false);
  }

  if (!loaded) return null;
  if (source === "unavailable") return <section className="mt-5 rounded-xl border border-line bg-white p-4"><h2 className="m-0 text-lg font-extrabold">Learner preferences</h2><p role="status" className="mb-0 mt-2 text-sm text-muted">Learner preferences are temporarily unavailable. Nothing was changed.</p></section>;
  return (
    <section data-testid="account-learner-preferences" className="mt-5 rounded-xl border border-line bg-white p-4">
      <h2 className="m-0 text-lg font-extrabold">Learner preferences</h2>
      <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">Personalise how Orthic greets you and which available courses appear first.</p>
      <form className="mt-4 grid gap-4" onSubmit={submit}>
        <label className="text-sm font-bold">First name
          <input
            className="mt-1 min-h-11 w-full max-w-sm rounded-lg border border-line bg-white px-3 font-medium outline-none focus:border-forge focus:ring-2 focus:ring-forge/20"
            value={firstName}
            maxLength={MAX_FIRST_NAME_LENGTH}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <span className="mt-1 block text-xs font-normal text-muted">Optional. Clear this field if you prefer the generic greeting.</span>
        </label>
        {courses.length > 1 ? (
          <fieldset>
            <legend className="text-sm font-bold">Your courses</legend>
            <div className="mt-2 grid gap-2">
              {courses.map((course) => (
                <label key={course.slug} className="flex min-h-11 items-center gap-3 text-sm font-semibold">
                  <input type="checkbox" checked={selectedCourseSlugs.includes(course.slug)} onChange={(event) => setSelectedCourseSlugs((current) => event.target.checked ? [...new Set([...current, course.slug])] : current.filter((slug) => slug !== course.slug))} />
                  {course.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <div><p className="text-sm font-bold">Current course</p><p className="mb-0 mt-1 text-sm text-muted">{courses[0]?.name ?? "No course is currently available."}</p></div>
        )}
        <div><button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:opacity-60">Save preferences</button></div>
      </form>
      {message ? <p role="status" className="mb-0 mt-3 text-sm font-semibold text-forge">{message}</p> : null}
      {error ? <p role="status" className="mb-0 mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
