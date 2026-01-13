export type ResultSuccess<S> = {
    isSuccess: true;
    data: S
}

export type ResultError<E> = {
    isSuccess: false;
    data: E
}

export type Result<S, E> = ResultSuccess<S> | ResultError<E>;