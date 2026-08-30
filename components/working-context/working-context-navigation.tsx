"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Compass, X } from "lucide-react";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { useModalFocusTrap } from "@/lib/use-modal-focus-trap";
import { formatReviewDueLabel, type WorkingContextModel } from "@/lib/working-context";

export function WorkingContextNavigation({
  pathId,
  active = false,
}: {
  pathId: string;
  active?: boolean;
}) {
  const pathname = usePathname();
  const deepFocus = pathname.startsWith("/question/") || pathname.startsWith("/practice/session/");
  const model = useWorkingContextModel(pathId);
  const [expanded, setExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!model) {
    return (
      <Link
        href="/subjects"
        aria-current={active ? "page" : undefined}
        className={`flex min-h-12 flex-1 items-center rounded-lg border-l-2 px-3 text-sm font-bold transition-colors max-lg:min-h-11 max-lg:justify-center max-lg:border-l-0 max-lg:px-1 max-lg:text-xs sm:max-lg:text-sm ${
          active
            ? "border-forge bg-forge-soft text-forge max-lg:border-b-2 max-lg:border-b-forge"
            : "border-transparent text-ink hover:bg-white hover:text-forge max-lg:border-b-0"
        }`}
      >
        <Compass aria-hidden="true" className="mr-3 size-5 max-lg:hidden" strokeWidth={2} />
        <span className="max-lg:hidden">Current Path</span>
        <span className="hidden max-lg:inline">Path</span>
      </Link>
    );
  }

  function openForViewport() {
    if (window.matchMedia("(max-width: 1023px)").matches) setSheetOpen(true);
    else setExpanded((current) => !current);
  }

  return (
    <div className="min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Current Path: ${model.skillName}`}
        aria-expanded={sheetOpen || expanded}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-current={active ? "page" : undefined}
        onClick={openForViewport}
        data-testid="working-context-trigger"
        className={`flex min-h-12 w-full items-center rounded-lg border-l-2 px-3 text-left text-sm font-bold transition-colors max-lg:min-h-11 max-lg:justify-center max-lg:rounded-b-none max-lg:border-l-0 max-lg:px-1 max-lg:text-xs sm:max-lg:text-sm ${
          active
            ? "border-forge bg-forge-soft text-forge max-lg:border-b-2 max-lg:border-b-forge"
            : "border-transparent text-ink hover:bg-white hover:text-forge max-lg:border-b-0"
        }`}
      >
        <Compass aria-hidden="true" className="mr-3 size-5 shrink-0 max-lg:mr-0" strokeWidth={2} />
        <span className="min-w-0 flex-1 max-lg:hidden">
          <span className="block break-words text-[13px] font-extrabold leading-tight">{model.skillName}</span>
          {!deepFocus ? <span className="mt-0.5 block break-words text-[11px] font-semibold leading-tight text-muted">{model.collapsedSummary}</span> : null}
        </span>
        <span className="hidden max-lg:inline">Path</span>
        <ChevronDown aria-hidden="true" className={`size-3.5 shrink-0 transition max-lg:hidden ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <section
          id={panelId}
          aria-label={`${model.skillName} working context`}
          className="mt-2 grid gap-3 rounded-lg border border-line bg-white p-3 max-lg:hidden"
          data-testid="working-context-desktop-panel"
        >
          <WorkingContextActions model={model} />
        </section>
      ) : null}

      {mounted && sheetOpen ? createPortal(
        <WorkingContextSheet
          id={panelId}
          model={model}
          triggerRef={triggerRef}
          onClose={() => setSheetOpen(false)}
        />,
        document.body,
      ) : null}
    </div>
  );
}

function WorkingContextActions({
  model,
  showHeading = true,
}: {
  model: WorkingContextModel;
  showHeading?: boolean;
}) {
  return (
    <>
      <div>
        {showHeading ? <h2 className="text-base font-extrabold">{model.skillName}</h2> : null}
        <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{model.progressSummary}</p>
      </div>
      <Link
        href={model.primaryHref}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-4 text-sm font-extrabold text-white"
      >
        {model.primaryLabel}
      </Link>
      <div>
        <p className="mb-1 px-2 text-[11px] font-extrabold uppercase tracking-wide text-muted">In this skill</p>
        <nav aria-label="Learning actions" className="grid gap-1">
          {model.notesHref ? <WorkingLink href={model.notesHref}>Notes</WorkingLink> : null}
          <WorkingLink href={model.practiceHref}>Practice</WorkingLink>
          {model.reviewHref ? <WorkingLink href={model.reviewHref}>{formatReviewDueLabel(model.reviewCount)}</WorkingLink> : null}
        </nav>
      </div>
      <nav aria-label="Context navigation" className="grid gap-1 border-t border-line pt-2">
        <ContextLink href={model.overviewHref}>View full overview</ContextLink>
        <ContextLink href={model.higherMathsHref} className="mt-1">Leave to Higher Maths</ContextLink>
      </nav>
    </>
  );
}

function WorkingLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`flex min-h-11 items-center justify-between gap-2 rounded-lg bg-paper px-3 text-sm font-bold text-ink hover:bg-forge-soft hover:text-forge ${className}`}>
      <span>{children}</span>
      <span aria-hidden="true" className="text-muted">→</span>
    </Link>
  );
}

/**
 * Deliberately plainer than WorkingLink (no rest tint, no trailing arrow) — orientation/exit
 * are wayfinding, not learning actions, and must not read as more rows in the same list.
 */
function ContextLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-muted hover:bg-forge-soft hover:text-forge ${className}`}>
      {children}
    </Link>
  );
}

function WorkingContextSheet({
  id,
  model,
  triggerRef,
  onClose,
}: {
  id: string;
  model: WorkingContextModel;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useModalFocusTrap({
    open: true,
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    triggerRef,
    onClose,
  });

  useEffect(() => {
    const trigger = triggerRef.current;
    const targets = [
      document.querySelector<HTMLElement>("main"),
      document.querySelector<HTMLElement>("[data-app-sidebar]"),
      document.querySelector<HTMLElement>("[data-global-report-dock]"),
    ].filter((item): item is HTMLElement => Boolean(item));
    const priorOverflow = document.body.style.overflow;
    for (const target of targets) {
      target.inert = true;
      target.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";
    return () => {
      for (const target of targets) {
        target.inert = false;
        target.removeAttribute("aria-hidden");
      }
      document.body.style.overflow = priorOverflow;
      window.requestAnimationFrame(() => trigger?.focus());
    };
  }, [triggerRef]);

  useEffect(() => {
    const navigation = (window as Window & { navigation?: BrowserNavigation }).navigation;
    const openedHref = window.location.href;
    const handlePopState = () => {
      onClose();
      if (window.location.href !== openedHref) window.history.forward();
    };
    window.addEventListener("popstate", handlePopState);

    let handleNavigate: ((event: BrowserNavigateEvent) => void) | null = null;
    if (navigation) {
      handleNavigate = (event: BrowserNavigateEvent) => {
        if (event.navigationType !== "traverse" || !event.cancelable) return;
        event.preventDefault();
        onClose();
      };
      navigation.addEventListener("navigate", handleNavigate);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (navigation && handleNavigate) navigation.removeEventListener("navigate", handleNavigate);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-ink/35 lg:hidden" role="presentation" data-testid="working-context-sheet-overlay">
      <section
        ref={dialogRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(82dvh,720px)] w-full overflow-y-auto rounded-t-2xl border border-line bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
        data-testid="working-context-sheet"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Working context</p>
            <h2 id={titleId} className="mt-1 text-xl font-extrabold">{model.skillName}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close working context" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-line text-muted">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="grid gap-3">
          <WorkingContextActions model={model} showHeading={false} />
        </div>
      </section>
    </div>
  );
}

type BrowserNavigateEvent = Event & {
  navigationType?: string;
  cancelable: boolean;
};

type BrowserNavigation = {
  addEventListener(type: "navigate", listener: (event: BrowserNavigateEvent) => void): void;
  removeEventListener(type: "navigate", listener: (event: BrowserNavigateEvent) => void): void;
};
