import { useEffect, useRef, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import { FiArrowLeft, FiSearch, FiSend } from "react-icons/fi";

import { io } from "socket.io-client";

import api from "../api/axios";
import toast from "react-hot-toast";

// ========================================
// SOCKET SERVER URL
// ========================================

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function Chat() {
  // ========================================
  // CURRENT USER
  // ========================================

  const storedUser = localStorage.getItem("user");

  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const currentUserId = currentUser?.id || currentUser?._id;

  // ========================================
  // STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [conversations, setConversations] = useState([]);

  const [selectedChatId, setSelectedChatId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [messageInput, setMessageInput] = useState("");

  const [showMobileChat, setShowMobileChat] = useState(false);

  const [conversationsLoading, setConversationsLoading] = useState(true);

  const [messagesLoading, setMessagesLoading] = useState(false);

  const [sending, setSending] = useState(false);

  // ========================================
  // ONLINE USERS
  // ========================================

  const [onlineUsers, setOnlineUsers] = useState([]);

  // ========================================
  // SOCKET CONNECTION
  // ========================================

  const [socketConnected, setSocketConnected] = useState(false);

  // ========================================
  // TYPING USERS
  // ========================================

  const [typingUsers, setTypingUsers] = useState([]);

  // ========================================
  // REFS
  // ========================================

  const messagesEndRef = useRef(null);

  const socketRef = useRef(null);

  const selectedChatIdRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  const isTypingRef = useRef(false);

  // ========================================
  // KEEP SELECTED CHAT REF UPDATED
  // ========================================

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  // ========================================
  // STOP TYPING
  // ========================================

  const stopTyping = (recipientId = selectedChatIdRef.current) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current && recipientId && socketRef.current?.connected) {
      socketRef.current.emit("typingStop", {
        recipientId,
      });
    }

    isTypingRef.current = false;
  };

  // ========================================
  // FETCH CONVERSATIONS
  // ========================================

  const fetchConversations = async () => {
    try {
      const response = await api.get("/chat/conversations");

      const conversationData = response.data.conversations || [];

      setConversations(conversationData);

      if (!selectedChatIdRef.current && conversationData.length > 0) {
        setSelectedChatId(conversationData[0].user._id);
      }
    } catch (error) {
      console.error("Get Conversations Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to load conversations",
      );
    } finally {
      setConversationsLoading(false);
    }
  };

  // ========================================
  // LOAD CONVERSATIONS
  // ========================================

  useEffect(() => {
    fetchConversations();
  }, []);

  // ========================================
  // SOCKET.IO CONNECTION
  // ========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },

      transports: ["websocket", "polling"],

      autoConnect: false,
    });

    socketRef.current = socket;

    // ========================================
    // SOCKET CONNECTED
    // ========================================

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      setSocketConnected(true);
    });

    // ========================================
    // SOCKET DISCONNECTED
    // ========================================

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);

      setSocketConnected(false);

      setOnlineUsers([]);

      setTypingUsers([]);
    });

    // ========================================
    // SOCKET CONNECTION ERROR
    // ========================================

    socket.on("connect_error", (error) => {
      console.error("Socket Connection Error:", error.message);

      setSocketConnected(false);
    });

    // ========================================
    // ONLINE USERS
    // ========================================

    socket.on("onlineUsers", (users) => {
      console.log("Online users:", users);

      setOnlineUsers(Array.isArray(users) ? users : []);
    });

    // ========================================
    // TYPING START
    // ========================================

    socket.on("typingStart", ({ userId, name }) => {
      if (!userId) {
        return;
      }

      setTypingUsers((previousUsers) => {
        const alreadyExists = previousUsers.some(
          (user) => user.userId.toString() === userId.toString(),
        );

        if (alreadyExists) {
          return previousUsers;
        }

        return [
          ...previousUsers,
          {
            userId,
            name: name || "User",
          },
        ];
      });
    });

    // ========================================
    // TYPING STOP
    // ========================================

    socket.on("typingStop", ({ userId }) => {
      if (!userId) {
        return;
      }

      setTypingUsers((previousUsers) =>
        previousUsers.filter(
          (user) => user.userId.toString() !== userId.toString(),
        ),
      );
    });

    // ========================================
    // RECEIVE NEW MESSAGE
    // ========================================

    socket.on("newMessage", async (newMessage) => {
      console.log("New real-time message:", newMessage);

      const senderId =
        typeof newMessage.sender === "object"
          ? newMessage.sender?._id
          : newMessage.sender;

      if (!senderId) {
        return;
      }

      const senderIdString = senderId.toString();

      // ========================================
      // REMOVE TYPING INDICATOR
      // ========================================

      setTypingUsers((previousUsers) =>
        previousUsers.filter(
          (user) => user.userId.toString() !== senderIdString,
        ),
      );

      // ========================================
      // UPDATE CONVERSATION PREVIEW
      // ========================================

      setConversations((previousConversations) => {
        const updated = previousConversations.map((conversation) => {
          const conversationUserId = conversation.user._id.toString();

          if (conversationUserId !== senderIdString) {
            return conversation;
          }

          const isConversationOpen =
            selectedChatIdRef.current?.toString() === senderIdString;

          return {
            ...conversation,

            lastMessage: newMessage,

            unreadCount: isConversationOpen
              ? 0
              : (conversation.unreadCount || 0) + 1,
          };
        });

        return [...updated].sort((a, b) => {
          const aTime = a.lastMessage?.createdAt
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;

          const bTime = b.lastMessage?.createdAt
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;

          return bTime - aTime;
        });
      });

      // ========================================
      // IF CONVERSATION IS OPEN
      // ========================================

      if (selectedChatIdRef.current?.toString() === senderIdString) {
        setMessages((previousMessages) => {
          const alreadyExists = previousMessages.some(
            (message) => message._id === newMessage._id,
          );

          if (alreadyExists) {
            return previousMessages;
          }

          return [...previousMessages, newMessage];
        });

        // ========================================
        // MARK REAL-TIME MESSAGE READ
        // ========================================

        try {
          await api.put(`/chat/messages/${senderIdString}/read`);
        } catch (error) {
          console.error("Real-time Mark Read Error:", error);
        }
      }
    });

    // ========================================
    // READ RECEIPT
    // ========================================

    socket.on("messagesRead", ({ readBy }) => {
      if (!readBy) {
        return;
      }

      const readByString = readBy.toString();

      console.log("Messages read by:", readByString);

      // ========================================
      // UPDATE MESSAGE LIST
      // ========================================

      if (selectedChatIdRef.current?.toString() === readByString) {
        setMessages((previousMessages) =>
          previousMessages.map((message) => {
            const senderId =
              typeof message.sender === "object"
                ? message.sender?._id
                : message.sender;

            const recipientId =
              typeof message.recipient === "object"
                ? message.recipient?._id
                : message.recipient;

            if (
              senderId?.toString() === currentUserId?.toString() &&
              recipientId?.toString() === readByString
            ) {
              return {
                ...message,

                isRead: true,

                readAt: new Date(),
              };
            }

            return message;
          }),
        );
      }

      // ========================================
      // UPDATE CONVERSATION LAST MESSAGE
      // ========================================

      setConversations((previousConversations) =>
        previousConversations.map((conversation) => {
          if (conversation.user._id.toString() !== readByString) {
            return conversation;
          }

          if (!conversation.lastMessage) {
            return conversation;
          }

          const senderId =
            typeof conversation.lastMessage.sender === "object"
              ? conversation.lastMessage.sender?._id
              : conversation.lastMessage.sender;

          if (senderId?.toString() !== currentUserId?.toString()) {
            return conversation;
          }

          return {
            ...conversation,

            lastMessage: {
              ...conversation.lastMessage,

              isRead: true,

              readAt: new Date(),
            },
          };
        }),
      );
    });

    // ========================================
    // CONNECT SOCKET
    // ========================================

    socket.connect();

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = null;
      }

      if (
        isTypingRef.current &&
        selectedChatIdRef.current &&
        socket.connected
      ) {
        socket.emit("typingStop", {
          recipientId: selectedChatIdRef.current,
        });
      }

      isTypingRef.current = false;

      socket.off("newMessage");

      socket.off("messagesRead");

      socket.off("onlineUsers");

      socket.off("typingStart");

      socket.off("typingStop");

      socket.off("connect");

      socket.off("disconnect");

      socket.off("connect_error");

      socket.disconnect();

      socketRef.current = null;

      setSocketConnected(false);
    };
  }, [currentUserId]);

  // ========================================
  // FETCH MESSAGES
  // ========================================

  const fetchMessages = async (userId, showLoader = true) => {
    if (!userId) {
      return;
    }

    try {
      if (showLoader) {
        setMessagesLoading(true);
      }

      const response = await api.get(`/chat/messages/${userId}`);

      const messageData = response.data.messages || [];

      /*
        Backend marks incoming messages
        from this user as read.
      */

      const updatedMessages = messageData.map((message) => {
        const recipientId =
          typeof message.recipient === "object"
            ? message.recipient?._id
            : message.recipient;

        const senderId =
          typeof message.sender === "object"
            ? message.sender?._id
            : message.sender;

        if (
          recipientId?.toString() === currentUserId?.toString() &&
          senderId?.toString() === userId.toString()
        ) {
          return {
            ...message,
            isRead: true,
          };
        }

        return message;
      });

      setMessages(updatedMessages);

      // ========================================
      // CLEAR CONVERSATION UNREAD COUNT
      // ========================================

      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.user._id.toString() === userId.toString()
            ? {
                ...conversation,

                unreadCount: 0,

                lastMessage:
                  messageData.length > 0
                    ? messageData[messageData.length - 1]
                    : conversation.lastMessage,
              }
            : conversation,
        ),
      );
    } catch (error) {
      console.error("Get Messages Error:", error);

      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      if (showLoader) {
        setMessagesLoading(false);
      }
    }
  };

  // ========================================
  // LOAD SELECTED CHAT
  // ========================================

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  // ========================================
  // UPDATE TOPBAR CHAT UNREAD BADGE
  // ========================================

  /*
    This is the new part.

    Whenever conversation unread counts
    change, this calculates the total and
    sends it to Topbar.jsx.
  */

  useEffect(() => {
    const totalUnread = conversations.reduce((total, conversation) => {
      return total + Number(conversation.unreadCount || 0);
    }, 0);

    window.dispatchEvent(
      new CustomEvent("worksync:chat-unread-changed", {
        detail: {
          count: totalUnread,
        },
      }),
    );
  }, [conversations]);

  // ========================================
  // AUTO SCROLL
  // ========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ========================================
  // SELECTED CONVERSATION
  // ========================================

  const selectedChat = conversations.find(
    (conversation) =>
      conversation.user._id.toString() === selectedChatId?.toString(),
  );

  // ========================================
  // FILTER CONVERSATIONS
  // ========================================

  const filteredConversations = conversations.filter((conversation) => {
    const name = conversation.user?.name || "";

    const role = conversation.user?.role || "";

    const searchValue = search.trim().toLowerCase();

    return (
      name.toLowerCase().includes(searchValue) ||
      role.toLowerCase().includes(searchValue)
    );
  });

  // ========================================
  // INITIALS
  // ========================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ========================================
  // CHECK ONLINE USER
  // ========================================

  const isUserOnline = (userId) => {
    if (!userId) {
      return false;
    }

    return onlineUsers.some(
      (onlineUserId) => onlineUserId.toString() === userId.toString(),
    );
  };

  // ========================================
  // CHECK MESSAGE OWNER
  // ========================================

  const isMyMessage = (message) => {
    const sender = message.sender;

    const senderId = typeof sender === "object" ? sender?._id : sender;

    if (currentUserId && senderId) {
      return senderId.toString() === currentUserId.toString();
    }

    return sender?.email && sender.email === currentUser?.email;
  };

  // ========================================
  // SELECTED USER TYPING
  // ========================================

  const selectedUserTyping = typingUsers.find(
    (user) => user.userId.toString() === selectedChatId?.toString(),
  );

  // ========================================
  // SELECT CONVERSATION
  // ========================================

  const handleSelectConversation = (conversationId) => {
    const previousChatId = selectedChatIdRef.current;

    if (
      previousChatId &&
      previousChatId.toString() !== conversationId.toString()
    ) {
      stopTyping(previousChatId);

      setMessageInput("");
    }

    setSelectedChatId(conversationId);

    setShowMobileChat(true);

    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.user._id.toString() === conversationId.toString()
          ? {
              ...conversation,
              unreadCount: 0,
            }
          : conversation,
      ),
    );
  };

  // ========================================
  // MESSAGE INPUT CHANGE
  // ========================================

  const handleMessageInputChange = (e) => {
    const value = e.target.value;

    setMessageInput(value);

    const recipientId = selectedChatIdRef.current;

    const socket = socketRef.current;

    if (!recipientId || !socket?.connected) {
      return;
    }

    // ========================================
    // EMPTY INPUT = STOP TYPING
    // ========================================

    if (!value.trim()) {
      stopTyping(recipientId);

      return;
    }

    // ========================================
    // START TYPING
    // ========================================

    if (!isTypingRef.current) {
      socket.emit("typingStart", {
        recipientId,
      });

      isTypingRef.current = true;
    }

    // ========================================
    // RESET TYPING TIMER
    // ========================================

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    /*
        Stop typing after 1.5 seconds
        without another key press.
      */

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(recipientId);
    }, 1500);
  };

  // ========================================
  // SEND MESSAGE
  // ========================================

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const text = messageInput.trim();

    if (!text || !selectedChatId || sending) {
      return;
    }

    stopTyping(selectedChatId);

    try {
      setSending(true);

      const response = await api.post(`/chat/messages/${selectedChatId}`, {
        text,
      });

      const newMessage = response.data.message;

      // ========================================
      // ADD MESSAGE
      // ========================================

      setMessages((previousMessages) => {
        const alreadyExists = previousMessages.some(
          (message) => message._id === newMessage._id,
        );

        if (alreadyExists) {
          return previousMessages;
        }

        return [...previousMessages, newMessage];
      });

      // ========================================
      // UPDATE CONVERSATION PREVIEW
      // ========================================

      setConversations((previousConversations) => {
        const updated = previousConversations.map((conversation) =>
          conversation.user._id.toString() === selectedChatId.toString()
            ? {
                ...conversation,

                lastMessage: newMessage,

                unreadCount: 0,
              }
            : conversation,
        );

        return [...updated].sort((a, b) => {
          const aTime = a.lastMessage?.createdAt
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;

          const bTime = b.lastMessage?.createdAt
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;

          return bTime - aTime;
        });
      });

      setMessageInput("");
    } catch (error) {
      console.error("Send Message Error:", error);

      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // ========================================
  // FORMAT MESSAGE TIME
  // ========================================

  const formatMessageTime = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // ========================================
  // CONVERSATION TIME
  // ========================================

  const formatConversationTime = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    const now = new Date();

    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // ========================================
  // LAST MESSAGE TEXT
  // ========================================

  const getLastMessageText = (conversation) => {
    const lastMessage = conversation.lastMessage;

    if (!lastMessage) {
      return "Start a conversation";
    }

    const sender = lastMessage.sender;

    const senderId = typeof sender === "object" ? sender?._id : sender;

    const sentByMe =
      currentUserId &&
      senderId &&
      senderId.toString() === currentUserId.toString();

    return sentByMe ? `You: ${lastMessage.text}` : lastMessage.text;
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Topbar setIsOpen={setIsOpen} title="Chat" />

        <main className="p-3 sm:p-4 lg:p-5">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden h-[calc(100vh-105px)] min-h-[550px]">
            <div className="flex h-full">
              {/* =================================
                  CONVERSATIONS
              ================================== */}

              <div
                className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-gray-100 flex-col ${
                  showMobileChat ? "hidden md:flex" : "flex"
                }`}
              >
                {/* HEADER */}

                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Messages
                      </h2>

                      <p className="text-xs text-gray-400 mt-1">
                        Chat with your WorkSync team
                      </p>
                    </div>

                    {/* SOCKET STATUS */}

                    <div
                      className="flex items-center gap-2"
                      title={socketConnected ? "Connected" : "Connecting"}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          socketConnected ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />

                      <span className="hidden lg:inline text-[10px] text-gray-400">
                        {socketConnected ? "Connected" : "Connecting"}
                      </span>
                    </div>
                  </div>

                  {/* SEARCH */}

                  <div className="relative mt-4">
                    <FiSearch
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* LOADING */}

                {conversationsLoading && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-gray-400">
                      Loading conversations...
                    </p>
                  </div>
                )}

                {/* CONVERSATION LIST */}

                {!conversationsLoading && (
                  <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((conversation) => {
                      const user = conversation.user;

                      const userOnline = isUserOnline(user._id);

                      const userTyping = typingUsers.some(
                        (typingUser) =>
                          typingUser.userId.toString() === user._id.toString(),
                      );

                      return (
                        <button
                          type="button"
                          key={user._id}
                          onClick={() => handleSelectConversation(user._id)}
                          className={`w-full flex items-center gap-3 p-4 text-left border-b border-gray-50 transition ${
                            selectedChatId?.toString() === user._id.toString()
                              ? "bg-purple-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {/* AVATAR */}

                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-semibold">
                              {getInitials(user.name)}
                            </div>

                            <span
                              className={`absolute right-0 bottom-0 w-3 h-3 rounded-full border-2 border-white ${
                                userOnline ? "bg-green-500" : "bg-gray-300"
                              }`}
                            />
                          </div>

                          {/* INFO */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-gray-800 truncate">
                                {user.name}
                              </h3>

                              {conversation.lastMessage?.createdAt && (
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  {formatConversationTime(
                                    conversation.lastMessage.createdAt,
                                  )}
                                </span>
                              )}
                            </div>

                            {/* ROLE + STATUS */}

                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-purple-500 truncate">
                                {user.role}
                              </p>

                              <span className="text-[10px] text-gray-300">
                                •
                              </span>

                              {userTyping ? (
                                <p className="text-[10px] font-medium text-purple-600">
                                  typing...
                                </p>
                              ) : (
                                <p
                                  className={`text-[10px] ${
                                    userOnline
                                      ? "text-green-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {userOnline ? "Online" : "Offline"}
                                </p>
                              )}
                            </div>

                            {/* LAST MESSAGE */}

                            <div className="flex items-center justify-between gap-2 mt-1">
                              <p
                                className={`text-xs truncate ${
                                  conversation.unreadCount > 0
                                    ? "font-medium text-gray-700"
                                    : "text-gray-400"
                                }`}
                              >
                                {userTyping
                                  ? `${user.name} is typing...`
                                  : getLastMessageText(conversation)}
                              </p>

                              {/* UNREAD BADGE */}

                              {conversation.unreadCount > 0 && (
                                <span className="min-w-5 h-5 px-1.5 shrink-0 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center">
                                  {conversation.unreadCount > 99
                                    ? "99+"
                                    : conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {filteredConversations.length === 0 && (
                      <div className="p-8 text-center">
                        <p className="text-sm text-gray-400">
                          No conversations found
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* =================================
                  CHAT AREA
              ================================== */}

              <div
                className={`flex-1 min-w-0 flex-col ${
                  showMobileChat ? "flex" : "hidden md:flex"
                }`}
              >
                {selectedChat ? (
                  <>
                    {/* CHAT HEADER */}

                    <div className="h-16 px-4 sm:px-5 border-b border-gray-100 flex items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* MOBILE BACK */}

                        <button
                          type="button"
                          onClick={() => {
                            stopTyping(selectedChatId);

                            setShowMobileChat(false);
                          }}
                          className="md:hidden text-gray-600 hover:text-purple-600"
                        >
                          <FiArrowLeft size={20} />
                        </button>

                        {/* AVATAR */}

                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                            {getInitials(selectedChat.user.name)}
                          </div>

                          <span
                            className={`absolute right-0 bottom-0 w-3 h-3 rounded-full border-2 border-white ${
                              isUserOnline(selectedChat.user._id)
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>

                        {/* USER INFO */}

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-800 truncate">
                            {selectedChat.user.name}
                          </h3>

                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400 truncate">
                              {selectedChat.user.role}
                            </p>

                            <span className="text-gray-300">•</span>

                            {selectedUserTyping ? (
                              <span className="text-xs font-medium text-purple-600">
                                typing...
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isUserOnline(selectedChat.user._id)
                                      ? "bg-green-500"
                                      : "bg-gray-300"
                                  }`}
                                />

                                <span
                                  className={`text-xs ${
                                    isUserOnline(selectedChat.user._id)
                                      ? "text-green-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {isUserOnline(selectedChat.user._id)
                                    ? "Online"
                                    : "Offline"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* =================================
                        MESSAGES
                    ================================== */}

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#fafbff]">
                      {messagesLoading && (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-sm text-gray-400">
                            Loading messages...
                          </p>
                        </div>
                      )}

                      {/* EMPTY CHAT */}

                      {!messagesLoading && messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-semibold">
                              {getInitials(selectedChat.user.name)}
                            </div>

                            <span
                              className={`absolute right-0 bottom-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isUserOnline(selectedChat.user._id)
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            />
                          </div>

                          <h3 className="text-sm font-semibold text-gray-700 mt-3">
                            Start a conversation
                          </h3>

                          <p className="text-xs text-gray-400 mt-1">
                            Send your first message to {selectedChat.user.name}
                          </p>

                          {selectedUserTyping ? (
                            <p className="text-xs font-medium text-purple-600 mt-2">
                              {selectedChat.user.name} is typing...
                            </p>
                          ) : (
                            <p
                              className={`text-xs mt-2 ${
                                isUserOnline(selectedChat.user._id)
                                  ? "text-green-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {isUserOnline(selectedChat.user._id)
                                ? "Currently online"
                                : "Currently offline"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* MESSAGE LIST */}

                      {!messagesLoading && messages.length > 0 && (
                        <div className="space-y-4">
                          {messages.map((message) => {
                            const myMessage = isMyMessage(message);

                            return (
                              <div
                                key={message._id}
                                className={`flex ${
                                  myMessage ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                                    myMessage
                                      ? "bg-purple-600 text-white rounded-br-md"
                                      : "bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm"
                                  }`}
                                >
                                  <p className="text-sm leading-6 whitespace-pre-wrap break-words">
                                    {message.text}
                                  </p>

                                  <div className="flex items-center justify-end gap-2 mt-1">
                                    <p
                                      className={`text-[10px] ${
                                        myMessage
                                          ? "text-purple-200"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {formatMessageTime(message.createdAt)}
                                    </p>

                                    {myMessage && (
                                      <span
                                        className={`text-[10px] ${
                                          message.isRead
                                            ? "text-purple-100"
                                            : "text-purple-300"
                                        }`}
                                      >
                                        {message.isRead ? "Read" : "Sent"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* TYPING BUBBLE */}

                          {selectedUserTyping && (
                            <div className="flex justify-start">
                              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />

                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                                    style={{
                                      animationDelay: "150ms",
                                    }}
                                  />

                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                                    style={{
                                      animationDelay: "300ms",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* =================================
                        MESSAGE INPUT
                    ================================== */}

                    <form
                      onSubmit={handleSendMessage}
                      className="border-t border-gray-100 bg-white p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={handleMessageInputChange}
                          onBlur={() => stopTyping(selectedChatId)}
                          maxLength={5000}
                          placeholder={`Message ${selectedChat.user.name}...`}
                          disabled={sending}
                          className="flex-1 rounded-lg border border-gray-200 py-2.5 px-4 text-sm outline-none focus:border-purple-500 disabled:bg-gray-50"
                        />

                        <button
                          type="submit"
                          disabled={sending || !messageInput.trim()}
                          className="w-10 h-10 shrink-0 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <FiSend size={18} />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* NO CHAT SELECTED */

                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <FiSend size={24} />
                    </div>

                    <h3 className="text-base font-semibold text-gray-700 mt-4">
                      WorkSync Chat
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      Select a team member to start a conversation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Chat;
