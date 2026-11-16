import type { ReactNode } from "react";

/**
 * Shared field wrapper: renders the label, the control and an optional hint.
 * The label is always bound to the control through `htmlFor`, so screen
 * readers announce the field name correctly.
 */
export interface FieldProps {
  /** Visible label text. */
  label: string;
  /** Id of the control the label belongs to. */
  htmlFor: string;
  /** Marks the field as required and shows the coral asterisk. */
  required?: boolean;
  /** Helper text rendered under the control. */
  hint?: string;
  /** Extra content rendered on the label row (e.g. a "forgot password" link). */
  labelAction?: ReactNode;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  labelAction,
  children,
}: FieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
          {label}
          {required && (
            <>
              {" "}
              <span className="text-coral" aria-hidden="true">
                *
              </span>
            </>
          )}
        </label>
        {labelAction}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
    </div>
  );
}
