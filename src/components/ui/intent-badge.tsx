/**
 * Labels for the "I'm here for" intent shown on the member facing profiles.
 * They are kept here (and not in `src/lib/constants.ts`) because each screen
 * uses its own wording, and changing it would change visible copy.
 */
const INTENT_LABELS_UI: Record<string, string> = {
  friendship: "صداقة ودردشة",
  serious: "تعارف جاد وزواج",
  both: "صداقة وتعارف جاد",
};

/** Returns the Arabic label of an intent, falling back to the "both" label. */
export function intentLabel(intent?: string | null): string {
  if (!intent) return INTENT_LABELS_UI.both;
  return INTENT_LABELS_UI[intent] ?? INTENT_LABELS_UI.both;
}

/** Coral pill that shows the member intent. */
export function IntentBadge({ intent }: { intent?: string | null }) {
  return (
    <span className="inline-flex items-center rounded-xl bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
      الهدف: {intentLabel(intent)}
    </span>
  );
}
