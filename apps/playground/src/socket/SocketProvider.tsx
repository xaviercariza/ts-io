/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, createContext, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";

const createSocketConnection = (serverUrl: string) => {
  const socket: Socket<any, any> = io(serverUrl, {
    autoConnect: false,
  });

  return socket;
};

type SocketProviderProps = {
  children: ReactNode;
};

const SocketContext = createContext<ReturnType<
  typeof createSocketConnection
> | null>(null);

const SocketProvider = ({ children }: SocketProviderProps) => {
  const socket = useRef(createSocketConnection(import.meta.env.VITE_API_URL));

  useEffect(() => {
    const socketInstance = socket.current;
    socketInstance.connect();
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
