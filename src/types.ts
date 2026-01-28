export type ResultSuccess<S> = {
  isSuccess: true;
  data: S;
};

export type ResultError<E> = {
  isSuccess: false;
  data: E;
};

export type Result<S, E> = ResultSuccess<S> | ResultError<E>;

export type UserImage = {
  pos: { x: number; y: number };
  width: number;
  height: number;
  indices: number[];
};

export type Point = { x: number; y: number };
