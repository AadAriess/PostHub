export interface IAuthPayload {
  userId: number;
  email: string;
}

export interface IContext {
  payload?: IAuthPayload;
}
