import {
  StateDatalineAttributes,
  StateDatalineAutoRemove,
  StateDatalineFragments,
  StateDatalineMergeMode,
  StateDatalineOnlyIfMissing,
  StateDatalinePaths,
  StateDatalineScript,
  StateDatalineSelector,
  StateDatalineSignals,
  StateDatalineUseViewTransition,
  DefaultExecuteScriptAttributes,
  DefaultExecuteScriptAutoRemove,
  DefaultFragmentMergeMode,
  DefaultFragmentsUseViewTransitions,
  DefaultMergeSignalsOnlyIfMissing,
  EventTypes,
  FragmentMergeModes,
} from "./consts.ts";
import type { Jsonifiable } from "npm:type-fest";

export type FragmentMergeMode = typeof FragmentMergeModes[number];
export type EventType = typeof EventTypes[number];

export type StreamOptions = Partial<{
  onError: (error: unknown) => Promise<void> | void;
  onAbort: (reason?: string) => Promise<void> | void;
  responseInit: ResponseInit;
  keepalive: boolean;
}>

export interface StateEventOptions {
  eventId?: string;
  retryDuration?: number;
}

export interface FragmentOptions extends StateEventOptions {
  [StateDatalineUseViewTransition]?: boolean;
}

export interface MergeFragmentsOptions extends FragmentOptions {
  [StateDatalineMergeMode]?: FragmentMergeMode;
  [StateDatalineSelector]?: string;
}

export interface MergeFragmentsEvent {
  event: "state-merge-fragments";
  options: MergeFragmentsOptions;
  [StateDatalineFragments]: string;
}

export interface RemoveFragmentsEvent {
  event: "state-remove-fragments";
  options: FragmentOptions;
  [StateDatalineSelector]: string;
}

export interface MergeSignalsOptions extends StateEventOptions {
  [StateDatalineOnlyIfMissing]?: boolean;
}

export interface MergeSignalsEvent {
  event: "state-merge-signals";
  options: MergeSignalsOptions;
  [StateDatalineSignals]: Record<string, Jsonifiable>;
}

export interface RemoveSignalsEvent {
  event: "state-remove-signals";
  options: StateEventOptions;
  [StateDatalinePaths]: string[];
}
type ScriptAttributes = {
  type?: "module" | "importmap" | "speculationrules" | "text/javascript";
  refererpolicy:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
  nonce?: string;
  nomodule?: boolean;
  integrity?: string;
  fetchpriority?: "high" | "low" | "auto";
  crossorigin?: "anonymous" | "use-credentials";
  blocking?: boolean;
  attributionsrc?: boolean | string;
  src?: string;
} & {
  src: string;
  defer: true;
} & {
  src: string;
  async: true;
};

export interface ExecuteScriptOptions extends StateEventOptions {
  [StateDatalineAutoRemove]?: boolean;
  [StateDatalineAttributes]?: ScriptAttributes | string[];
}

export interface ExecuteScriptEvent {
  event: "state-execute-script";
  options: ExecuteScriptOptions;
  [StateDatalineScript]: string;
}

export const sseHeaders = {
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
  "Content-Type": "text/event-stream",
} as const;

export type MultilineDatalinePrefix =
  | typeof StateDatalineScript
  | typeof StateDatalineFragments
  | typeof StateDatalineSignals;

export type StateEventOptionsUnion =
  | MergeFragmentsOptions
  | FragmentOptions
  | MergeSignalsOptions
  | StateEventOptions
  | ExecuteScriptOptions;

export type StateEvent =
  | MergeFragmentsEvent
  | RemoveFragmentsEvent
  | MergeSignalsEvent
  | RemoveSignalsEvent
  | ExecuteScriptEvent;

export const DefaultMapping = {
  [StateDatalineMergeMode]: DefaultFragmentMergeMode,
  [StateDatalineUseViewTransition]: DefaultFragmentsUseViewTransitions,
  [StateDatalineOnlyIfMissing]: DefaultMergeSignalsOnlyIfMissing,
  [StateDatalineAttributes]: {
    [DefaultExecuteScriptAttributes.split(" ")[0]]:
      DefaultExecuteScriptAttributes.split(" ")[1],
  },
  [StateDatalineAutoRemove]: DefaultExecuteScriptAutoRemove,
} as const;