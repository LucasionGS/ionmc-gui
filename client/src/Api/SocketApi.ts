import { io } from "socket.io-client";
import BaseApi from "./BaseApi";
import { ServerStatus } from "@shared/models";

const socket = io();

namespace SocketApi {
  const subscriptions: Record<string, any> = {};
  export function subscribeServer(id: string, callback: (data?: string, status?: ServerStatus) => void) {
    const key = `server/${id}`;
    const existing = subscriptions[key];
    if (existing) socket.off(key, existing);
    socket.emit("subscribe", id, BaseApi.getToken());
    socket.on(key, callback);
    subscriptions[key] = callback;
  }

  export function unsubscribeServer(id: String) {
    const key = `server/${id}`;
    const existing = subscriptions[key];
    socket.emit("unsubscribe", id);
    socket.off(key, existing);
  }

  export function sendServerCommand(id: string, command: string, requestStatusUpdate = false) {
    socket.emit(`server/${id}/command`, command, BaseApi.getToken(), requestStatusUpdate);
  }
}

export default SocketApi;