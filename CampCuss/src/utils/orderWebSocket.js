export class OrderWebSocket {
  constructor(token, onMessage, onError, onOpen, onClose) {
    this.token = token;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.socket = null;
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const url = `https://camp-cuss.craftbytes.space/orders?token=${this.token}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = e => {
      console.log('🟢 WebSocket: connected');
      this.onOpen?.(e);
    };

    this.socket.onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        this.onMessage?.(data);
      } catch (err) {
        console.error('❌ WebSocket message parse error:', err);
        this.onError?.(err);
      }
    };

    this.socket.onerror = err => {
      console.error('🔴 WebSocket error:', err);
      this.onError?.(err);
    };

    this.socket.onclose = e => {
      console.log('🟠 WebSocket closed:', e.code, e.reason);
      this.onClose?.(e);
    };
  }

  sendMessage(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
