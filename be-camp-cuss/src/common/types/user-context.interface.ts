export interface UserPayload {
  id: number;
  username: string;
  role: string;
}

export interface JwtPayload extends Omit<UserPayload, 'id'> {
  sub: number;
}

export interface RequestWithUser {
  user: UserPayload;
}
