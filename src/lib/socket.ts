import { io, Socket } from "socket.io-client";

// Define the URL of the backend server.
// For now, it points to localhost:8745 where the backend runs.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8745";

let socket: Socket | null = null;

export const connectSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("vinimay_token");
  
  if (!token) {
    console.warn("Attempted to connect socket without a token.");
    return null;
  }

  // If a socket already exists and is connected with the same token, return it
  if (socket?.connected && socket.auth && (socket.auth as any).token === token) {
    return socket;
  }
  
  // If socket exists but token changed or disconnected, disconnect the old one
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
