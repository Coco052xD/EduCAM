import type { ActionState } from "@/lib/actions/auth";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null;
  return <div role="status" aria-live="polite" className={`alert ${state.error ? "alert-error" : "alert-success"}`}>{state.error ?? state.success}</div>;
}
