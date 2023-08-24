import dotenv from "dotenv"; dotenv.config(); // Load .env file
import { io } from "./express"; // Start the Express server. You can import { app } from "./express" if you want to use it in other files
import { Server, User } from "./sequelize";
import ServerManager from "./ServerManager";

io.on("connection", (socket) => {
  socket.on("subscribe", async (id: string, token: string) => {
    const user = await User.fromToken(token).catch(() => null);
    if (!user) return;
    const server = await Server.findByPk(id);
    if (!server) return;
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return;
    }
    socket.join(`server/${id}`);
    console.log("Subscribed to server", id);

    socket.on(`server/${id}/command`, async (command: string) => {
      const user = await User.fromToken(token).catch(() => null);
      if (!user) return;
      if (server.userId !== user.id && !await user.hasPermission("SERVER.COMMAND")) {
        return;
      }
      const mcserver = ServerManager.getRunningServerById(server.id);
      if (!mcserver) return;
      try {
        // mcserver.executeCustomCommand(command);
        mcserver.process.write(command + "\n");
      } catch (error) {
        console.error(error);
      }
    });

    socket.once("disconnect", () => {
      console.log("Unsubscribed to server", id);
      socket.leave(`server/${id}`);
      socket.removeAllListeners();
    });
  });

  socket.on("unsubscribe", (id: string) => {
    socket.leave(`server/${id}`);
    console.log("Unsubscribed to server", id);
  });
});