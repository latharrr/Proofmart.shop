import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps, ReactNode, Ref } from "react";

/**
 * The button of the working-paper system (DESIGN.md, Components). Square
 * corners, Libre Franklin 600 at 15px, three stocks: primary (graphite ink
 * on paper), secondary (ruled outline), paper (the lighter sheet). `dot`
 * adds the pencil arrow that marks a forward action. Pure markup, so it
 * renders in Server Components. The component keeps its old name so every
 * call site still resolves.
 *
 *   <RollPill href="/signup" dot>Start free</RollPill>              → next/link
 *   <RollPill href="https://…" native>Docs</RollPill>                → plain <a>
 *   <RollPill type="submit" pending={isPending} pendingLabel="Signing in">
 *     Sign in
 *   </RollPill>                                                       → <button>
 */

type Common = {
  children: ReactNode;
  /** primary = graphite ink, secondary = ruled outline, paper = the lighter sheet. */
  variant?: "primary" | "secondary" | "paper";
  /** Show the pencil arrow. `true` = after the label; "before" puts it first. */
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
  const arrow = (
    <svg className="pm-pill-dot" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2 7.2h9.2M7.6 3.4 11.4 7.2 7.6 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
  return (
    <>
      {icon ? (
        <span className="pm-pill-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {dot === "before" ? arrow : null}
      <span className="pm-pill-roll">{label}</span>
      {dot === true || dot === "after" ? arrow : null}
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
      <Inner label={pending ? pendingLabel : children} dot={pending ? false : dot} icon={icon} />
    </button>
  );
}
