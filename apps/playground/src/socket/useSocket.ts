import { useContext } from "react";
import { SocketContext } from "./SocketProvider";

const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export { useSocket };
