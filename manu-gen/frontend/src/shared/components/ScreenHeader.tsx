import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "./ScreenHeader.module.css";

/**
 * Unified top navigation for every screen.
 *
 * ## Variant × Layout matrix
 *
 * | variant        | layout used          | Example screen                    |
 * |----------------|----------------------|-----------------------------------|
 * | `"light"`      | `"inline"`           | Create / edit forms               |
 * | `"light"`      | `"stack"`            | (reserved, not used today)        |
 * | `"light"`      | `"detailToolbar"`    | (reserved, not used today)        |
 * | `"detailBand"` | `"detailToolbar"`    | Job detail (tinted toolbar)       |
 * | `"hero"`       | *(ignored)*          | Customer order detail (dark band) |
 *
 * `variant="hero"` renders its own layout; `layout` is ignored.
 *
 * ## Back label conventions
 *
 * | Screen                | `backLabel`        | `backAriaLabel`              |
 * |-----------------------|--------------------|------------------------------|
 * | Create/edit forms     | Parent list name   | —                            |
 * | Entity detail (light) | Parent list name   | —                            |
 * | Order detail (hero)   | `"Back"`           | `"Back to customer orders"`  |
 */

export type ScreenHeaderLayout = "inline" | "stack" | "detailToolbar";
export type ScreenHeaderVariant = "light" | "hero" | "detailBand";

export interface ScreenHeaderProps {
  /** Visible text after chevron (e.g. "Jobs", "Pipelines", "Back"). */
  backLabel: string;
  /** Overrides the generated `aria-label` ("Back to {backLabel}") — use when `backLabel` is generic like "Back". */
  backAriaLabel?: string;
  onBack: () => void;
  /** Page heading. Pass a **string** for automatic `<h1>` wrapping; a **ReactNode fragment** is rendered inside a `<div>` — do not pass block headings. */
  title: ReactNode;
  /** Mono metadata line (job number · tray code, order ref, etc.). Used by `stack` and `hero`. */
  meta?: ReactNode;
  /** Right-side actions: Cancel/Save buttons, Print, etc. Ignored by `hero`. */
  actions?: ReactNode;
  /** Controls light-variant inner structure. Ignored when `variant="hero"`. */
  layout?: ScreenHeaderLayout;
  variant?: ScreenHeaderVariant;
  /** `hero` only: content placed in the right column (e.g. KPI strip). */
  heroTopAside?: ReactNode;
  /** `hero` only: content below the title (status row, secondary info). */
  children?: ReactNode;
  /** Merged onto the outer `<header>` element (e.g. print-hide class). */
  className?: string;
}

export function ScreenHeader({
  backLabel,
  backAriaLabel,
  onBack,
  title,
  meta,
  actions,
  layout = "inline",
  variant = "light",
  heroTopAside,
  children,
  className,
}: ScreenHeaderProps): React.JSX.Element {
  if (import.meta.env.DEV) {
    if (variant === "hero" && layout !== "inline") {
      console.warn(
        `[ScreenHeader] variant="hero" ignores layout="${layout}". Remove the layout prop or use variant="light".`,
      );
    }
    if (variant === "detailBand" && layout !== "detailToolbar") {
      console.warn(
        `[ScreenHeader] variant="detailBand" expects layout="detailToolbar", got "${layout}".`,
      );
    }
  }

  const chevronSize = variant === "hero" ? 18 : 14;
  const chevronStroke = variant === "hero" ? 2 : 1.5;

  const back = (
    <button
      type="button"
      onClick={onBack}
      className={styles.backButton}
      aria-label={backAriaLabel ?? `Back to ${backLabel}`}
    >
      <ChevronLeft size={chevronSize} strokeWidth={chevronStroke} aria-hidden />
      {backLabel}
    </button>
  );

  if (variant === "hero") {
    const hasMeta = meta !== undefined && meta !== null;
    const hasAside = heroTopAside !== undefined && heroTopAside !== null;

    if (hasAside) {
      return (
        <header className={[styles.shellHero, className].filter(Boolean).join(" ")}>
          <div className={styles.heroGrid}>
            <div className={styles.heroMain}>
              {back}
              {hasMeta && <div className={styles.heroMeta}>{meta}</div>}
              <h1 className={styles.heroTitle}>{title}</h1>
              {children}
            </div>
            <div className={styles.heroAside}>{heroTopAside}</div>
          </div>
        </header>
      );
    }

    return (
      <header className={[styles.shellHero, className].filter(Boolean).join(" ")}>
        {back}
        {hasMeta && <div className={styles.heroMeta}>{meta}</div>}
        <h1 className={styles.heroTitle}>{title}</h1>
        {children}
      </header>
    );
  }

  const titleEl =
    typeof title === "string" ? (
      <h1 className={styles.title}>{title}</h1>
    ) : (
      <div className={styles.title} role="heading" aria-level={1}>
        {title}
      </div>
    );

  if (layout === "stack") {
    return (
      <header className={[styles.shellStack, className].filter(Boolean).join(" ")}>
        {back}
        <div className={styles.center}>
          {meta !== undefined && meta !== null && <p className={styles.meta}>{meta}</p>}
          {titleEl}
        </div>
        {actions !== undefined && actions !== null && (
          <div className={styles.actions}>{actions}</div>
        )}
      </header>
    );
  }

  if (layout === "detailToolbar") {
    const band = variant === "detailBand";
    return (
      <header
        className={[
          styles.shellDetailToolbar,
          band ? styles.shellDetailBand : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {back}
        <div className={styles.detailToolbarFill}>
          <div className={styles.detailToolbarLeft}>{title}</div>
          {actions !== undefined && actions !== null && (
            <div className={styles.detailToolbarActions}>{actions}</div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className={[styles.shellInline, className].filter(Boolean).join(" ")}>
      {back}
      {titleEl}
      {actions !== undefined && actions !== null && (
        <div className={styles.actions}>{actions}</div>
      )}
    </header>
  );
}
