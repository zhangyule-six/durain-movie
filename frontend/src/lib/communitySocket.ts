import { io, type Socket } from "socket.io-client";
import { getActiveToken } from "./accountStorage";

let socket: Socket | null = null;

export function getCommunitySocket() {
  if (socket) return socket;
  const token = getActiveToken();
  socket = io("http://localhost:5001", {
    transports: ["websocket"],
    withCredentials: true,
    auth: token ? { token } : {},
  });
  return socket;
}

export function resetCommunitySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
