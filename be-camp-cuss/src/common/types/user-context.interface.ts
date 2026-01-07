export interface UserPayload {
  userId: number;
  username: string;
  role: string;
}

export interface JwtPayload extends Omit<UserPayload, 'userId'> {
  sub: number;
}

export interface RequestWithUser {
  user: UserPayload;
}
