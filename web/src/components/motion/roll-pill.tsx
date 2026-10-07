import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps, ReactNode, Ref } from "react";

/**
 * The pill — design-system.md §5, bar.md §5. Full pill, uppercase 14px/500
 * label, optional 6px dot, and the rolling-label hover: the label slides up
 * out of its clip box while an identical copy rises from below
 * (300ms --ease-out); the fill shifts one step (400ms). No lift, no scale.
 *
 * Pure CSS (no client JS), so it works in Server Components.
 *
 *   <RollPill href="/signup" dot>Start free</RollPill>              → next/link
 *   <RollPill href="https://…" native>Docs</RollPill>                → plain <a>
 *   <RollPill type="submit" pending={isPending} pendingLabel="Signing in">
 *     Sign in
 *   </RollPill>                                                       → <button>
 */

type Common = {
  children: ReactNode;
  /** primary = graphite, secondary = haze, paper = white (use on haze surfaces). */
  variant?: "primary" | "secondary" | "paper";
  /** Show the 6px dot. `true` = after the label; "before" puts it first. */
  dot?: boolean | "before" | "after";
  /** Optional leading icon (e.g. the Google mark). Decorative. */
  icon?: ReactNode;
  size?: "md" | "sm";
  /** Stretch to the container width. */
  block?: boolean;
  className?: string;
};

type LinkProps = Common &
  Omit<ComponentProps<typeof Link>, "children" | "className"> & {
    href: ComponentProps<typeof Link>["href"];
    /** Render a plain <a> instead of next/link (downloads, API routes, external). */
    native?: false;
  };

type NativeAnchorProps = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    href: string;
    native: true;
    ref?: Ref<HTMLAnchorElement>;
  };

type ButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
    /** Busy state: disables the button, sets aria-busy, swaps the label. */
    pending?: boolean;
    pendingLabel?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
  };

export type RollPillProps = LinkProps | NativeAnchorProps | ButtonProps;

function Inner({ label, dot, icon }: { label: ReactNode; dot: Common["dot"]; icon?: ReactNode }) {
  const dotEl = <span className="pm-pill-dot" aria-hidden="true" />;
  return (
    <>
      {icon ? (
        <span className="pm-pill-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {dot === "before" ? dotEl : null}
      <span className="pm-pill-roll">
        <span>{label}</span>
        <span aria-hidden="true">{label}</span>
      </span>
      {dot === true || dot === "after" ? dotEl : null}
    </>
  );
}

function cx(className?: string) {
  return className ? `pm-pill ${className}` : "pm-pill";
}

export default function RollPill(props: RollPillProps) {
  if (props.href !== undefined) {
    if (props.native) {
      const { children, variant = "primary", dot, icon, size = "md", block, className, native: _n, ...rest } = props;
      void _n;
      return (
        <a
          {...rest}
          className={cx(className)}
          data-variant={variant}
          data-size={size}
          data-block={block ? "" : undefined}
        >
          <Inner label={children} dot={dot} icon={icon} />
        </a>
      );
    }
    const { children, variant = "primary", dot, icon, size = "md", block, className, native: _n, ...rest } = props;
    void _n;
    return (
      <Link
        {...rest}
        className={cx(className)}
        data-variant={variant}
        data-size={size}
        data-block={block ? "" : undefined}
      >
        <Inner label={children} dot={dot} icon={icon} />
      </Link>
    );
  }

  const {
    children,
    variant = "primary",
    dot,
    icon,
    size = "md",
    block,
    className,
    pending = false,
    pendingLabel = "Working",
    type = "button",
    disabled,
    ...rest
  } = props;
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cx(className)}
      data-variant={variant}
      data-size={size}
      data-block={block ? "" : undefined}
    >
      <Inner label={pending ? pendingLabel : children} dot={pending ? "after" : dot} icon={icon} />
    </button>
  );
}
