import { Socket } from 'socket.io';
import { UserPayload } from '../../common/types/user-context.interface';

export interface SocketWithUser extends Socket {
  user?: UserPayload;
}
