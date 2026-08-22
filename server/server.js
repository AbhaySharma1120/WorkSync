import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.js";

import User from "./models/User.js";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// ========================================
// ENVIRONMENT VARIABLES
// ========================================

dotenv.config();

// ========================================
// EXPRESS APP
// ========================================

const app = express();

// ========================================
// HTTP SERVER
// ========================================

const httpServer = createServer(app);

// ========================================
// ALLOWED FRONTEND URLS
// ========================================

/*
  Local development:
  http://localhost:5173

  Production:
  Add your deployed frontend URL
  inside CLIENT_URL in .env.

  Example:

  CLIENT_URL=https://worksync.vercel.app

  You can also provide multiple URLs:

  CLIENT_URL=http://localhost:5173,https://worksync.vercel.app
*/

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ========================================
// CORS CHECK
// ========================================

const corsOptions = {
  origin: (origin, callback) => {
    /*
      Requests from Postman, mobile apps,
      server-to-server requests, etc.
      may not contain an Origin header.
    */

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(`Blocked by CORS: ${origin}`);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

// ========================================
// SOCKET.IO SERVER
// ========================================

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    credentials: true,
  },
});

// ========================================
// DATABASE
// ========================================

connectDB();

// ========================================
// EXPRESS MIDDLEWARE
// ========================================

app.use(cors(corsOptions));

app.use(
  express.json({
    limit: "1mb",
  }),
);

// ========================================
// SHARE SOCKET.IO WITH CONTROLLERS
// ========================================

app.set("io", io);

// ========================================
// ONLINE USERS STORAGE
// ========================================

/*
  Structure:

  onlineUsers = Map {
    TEAM_ID => Map {
      USER_ID => Set(socketIds)
    }
  }

  Example:

  TEAM_1
    ├── USER_A
    │     ├── socket1
    │     └── socket2
    │
    └── USER_B
          └── socket3

  Set is important because the same user
  might open multiple tabs/devices.
*/

const onlineUsers = new Map();

// ========================================
// ADD ONLINE USER
// ========================================

const addOnlineUser = (teamId, userId, socketId) => {
  if (!onlineUsers.has(teamId)) {
    onlineUsers.set(teamId, new Map());
  }

  const teamUsers = onlineUsers.get(teamId);

  if (!teamUsers.has(userId)) {
    teamUsers.set(userId, new Set());
  }

  teamUsers.get(userId).add(socketId);
};

// ========================================
// REMOVE ONLINE USER
// ========================================

const removeOnlineUser = (teamId, userId, socketId) => {
  const teamUsers = onlineUsers.get(teamId);

  if (!teamUsers) {
    return;
  }

  const userSockets = teamUsers.get(userId);

  if (!userSockets) {
    return;
  }

  userSockets.delete(socketId);

  /*
    User becomes offline only when
    ALL tabs/devices disconnect.
  */

  if (userSockets.size === 0) {
    teamUsers.delete(userId);
  }

  /*
    Remove team map if no users
    remain connected.
  */

  if (teamUsers.size === 0) {
    onlineUsers.delete(teamId);
  }
};

// ========================================
// GET ONLINE USERS FOR TEAM
// ========================================

const getOnlineTeamUsers = (teamId) => {
  const teamUsers = onlineUsers.get(teamId);

  if (!teamUsers) {
    return [];
  }

  return Array.from(teamUsers.keys());
};

// ========================================
// CHECK ONLINE USER BELONGS TO TEAM
// ========================================

const isOnlineTeamMember = (teamId, userId) => {
  const teamUsers = onlineUsers.get(teamId);

  if (!teamUsers) {
    return false;
  }

  return teamUsers.has(userId.toString());
};

// ========================================
// SOCKET AUTHENTICATION
// ========================================

io.use(async (socket, next) => {
  try {
    // ========================================
    // TOKEN
    // ========================================

    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    // ========================================
    // JWT SECRET
    // ========================================

    if (!process.env.JWT_SECRET) {
      return next(new Error("JWT_SECRET is missing"));
    }

    // ========================================
    // VERIFY JWT
    // ========================================

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return next(new Error("Invalid authentication token"));
    }

    // ========================================
    // USER
    // ========================================

    const user = await User.findById(decoded.userId).select(
      "_id name role teamOwner",
    );

    if (!user) {
      return next(new Error("User not found"));
    }

    // ========================================
    // SOCKET USER INFO
    // ========================================

    socket.userId = user._id.toString();

    socket.teamOwnerId = (user.teamOwner || user._id).toString();

    socket.userName = user.name;

    socket.userRole = user.role;

    /*
        Stores users this socket
        is currently typing to.

        This allows typing indicators
        to be cleared on disconnect.
      */

    socket.typingTo = new Set();

    next();
  } catch (error) {
    console.error("Socket Authentication Error:", error.message);

    next(new Error("Socket authentication failed"));
  }
});

// ========================================
// SOCKET CONNECTION
// ========================================

io.on("connection", (socket) => {
  const userId = socket.userId;

  const teamId = socket.teamOwnerId;

  // ========================================
  // CONNECTION LOG
  // ========================================

  console.log(`Socket connected: ${socket.id}`);

  console.log(`User connected: ${userId}`);

  // ========================================
  // PERSONAL USER ROOM
  // ========================================

  const userRoom = `user:${userId}`;

  socket.join(userRoom);

  // ========================================
  // TEAM ROOM
  // ========================================

  const teamRoom = `team:${teamId}`;

  socket.join(teamRoom);

  // ========================================
  // MARK USER ONLINE
  // ========================================

  addOnlineUser(teamId, userId, socket.id);

  // ========================================
  // SEND ONLINE USERS
  // ========================================

  io.to(teamRoom).emit("onlineUsers", getOnlineTeamUsers(teamId));

  console.log(`${socket.userName} is online`);

  // ========================================
  // TYPING START
  // ========================================

  socket.on("typingStart", ({ recipientId } = {}) => {
    if (!recipientId) {
      return;
    }

    const recipientIdString = recipientId.toString();

    // Prevent self typing
    if (recipientIdString === userId) {
      return;
    }

    /*
          Only emit typing event when
          recipient belongs to same team
          and is currently online.
        */

    if (!isOnlineTeamMember(teamId, recipientIdString)) {
      return;
    }

    socket.typingTo.add(recipientIdString);

    io.to(`user:${recipientIdString}`).emit("typingStart", {
      userId,

      name: socket.userName,
    });
  });

  // ========================================
  // TYPING STOP
  // ========================================

  socket.on("typingStop", ({ recipientId } = {}) => {
    if (!recipientId) {
      return;
    }

    const recipientIdString = recipientId.toString();

    socket.typingTo.delete(recipientIdString);

    io.to(`user:${recipientIdString}`).emit("typingStop", {
      userId,
    });
  });

  // ========================================
  // DISCONNECT
  // ========================================

  socket.on("disconnect", (reason) => {
    /*
          Clear all typing indicators
          before disconnecting user.
        */

    for (const recipientId of socket.typingTo) {
      io.to(`user:${recipientId}`).emit("typingStop", {
        userId,
      });
    }

    socket.typingTo.clear();

    // ========================================
    // REMOVE ONLINE USER
    // ========================================

    removeOnlineUser(teamId, userId, socket.id);

    // ========================================
    // UPDATED PRESENCE
    // ========================================

    io.to(teamRoom).emit("onlineUsers", getOnlineTeamUsers(teamId));

    console.log(`${socket.userName} disconnected`);

    console.log(`Reason: ${reason}`);
  });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/team", teamRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/calendar", calendarRoutes);

app.use("/api/files", fileRoutes);

app.use("/api/settings", settingsRoutes);

// ========================================
// HEALTH / TEST ROUTE
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    message: "WorkSync API is running",
  });
});

// ========================================
// 404 API HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,

    message: "API route not found",
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  console.log(`Socket.IO server running on port ${PORT}`);

  console.log(`Allowed frontend origins: ${allowedOrigins.join(", ")}`);
});
