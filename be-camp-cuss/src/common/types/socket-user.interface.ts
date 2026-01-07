import { Socket } from 'socket.io';
import { UserPayload } from './user-context.interface';

export interface SocketWithUser extends Socket {
  user?: UserPayload;
}
