declare module "zustand" {
  export type PartialState<TState> = Partial<TState> | ((state: TState) => Partial<TState>);

  export type SetState<TState> = (
    partial: PartialState<TState>,
    replace?: boolean
  ) => void;

  export type GetState<TState> = () => TState;

  export type StateSelector<TState, TResult> = (state: TState) => TResult;

  export interface StoreApi<TState> {
    setState: SetState<TState>;
    getState: GetState<TState>;
    subscribe: (listener: (state: TState, prevState: TState) => void) => () => void;
    destroy: () => void;
  }

  export interface UseBoundStore<TState> {
    <TSelected>(
      selector: StateSelector<TState, TSelected>,
      equalityFn?: (a: TSelected, b: TSelected) => boolean
    ): TSelected;
    (): TState;
    getState: GetState<TState>;
    setState: SetState<TState>;
    subscribe: StoreApi<TState>["subscribe"];
    destroy: StoreApi<TState>["destroy"];
  }

  export type StateCreator<TState> = (
    set: SetState<TState>,
    get: GetState<TState>,
    api: StoreApi<TState>
  ) => TState;

  export function create<TState>(initializer: StateCreator<TState>): UseBoundStore<TState>;
}
