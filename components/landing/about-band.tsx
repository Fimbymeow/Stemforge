export function AboutBand() {
  return (
    <section
      id="about"
      className="grid grid-cols-[minmax(0,0.9fr)_minmax(280px,0.7fr)] items-center gap-12 border-y border-line bg-ink px-[max(20px,calc((100vw-1220px)/2))] py-[72px] text-white max-lg:grid-cols-1"
    >
      <h2 className="m-0 max-w-[680px] text-[clamp(42px,6vw,88px)] font-medium leading-[0.98]">
        Practise the skills that matter.
      </h2>
      <p className="m-0 text-[22px] leading-[1.45] text-[#d7d1c4]">
        STEM Forge is built around Qualifications Scotland courses, giving students a focused place to
        navigate topics, complete questions, view solutions and track progress.
      </p>
    </section>
  );
}
