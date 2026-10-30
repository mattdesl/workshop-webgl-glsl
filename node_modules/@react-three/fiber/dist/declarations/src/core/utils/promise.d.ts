export declare const isPromiseLike: <T>(value: T | PromiseLike<T>) => value is PromiseLike<T>;
/** A promise tagged with its state, the protocol React's `use` reads */
export type TrackedPromise<T> = Promise<T> & ({
    status: 'pending';
} | {
    status: 'fulfilled';
    value: T;
} | {
    status: 'rejected';
    reason: unknown;
});
export declare const fulfilled: <T>(value: T) => TrackedPromise<T>;
export declare const rejected: <T>(reason: unknown) => TrackedPromise<T>;
/** A pending promise, settled once from outside. Its `status` updates the moment it settles */
export declare const deferred: <T>() => {
    promise: TrackedPromise<T>;
    resolve: (_value: T) => void;
    reject: (_reason: unknown) => void;
};
