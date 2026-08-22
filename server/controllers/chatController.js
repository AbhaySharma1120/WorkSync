import Message from "../models/Message.js";
import User from "../models/User.js";

// ========================================
// GET TEAM OWNER ID
// ========================================

const getTeamOwnerId = (user) => {
  return user.teamOwner || user._id;
};

// ========================================
// FIND MEMBER INSIDE CURRENT TEAM
// ========================================

const findTeamMember = async (userId, teamOwnerId) => {
  if (!userId) {
    return null;
  }

  return await User.findOne({
    _id: userId,

    $or: [
      {
        teamOwner: teamOwnerId,
      },

      // Workspace owner
      {
        _id: teamOwnerId,
      },
    ],
  }).select("name email role avatar teamOwner");
};

// ========================================
// GET CONVERSATIONS
// GET /api/chat/conversations
// ========================================

export const getConversations = async (req, res) => {
  try {
    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // GET TEAM MEMBERS EXCEPT CURRENT USER
    // ========================================

    const members = await User.find({
      $and: [
        {
          $or: [
            {
              teamOwner: teamOwnerId,
            },

            {
              _id: teamOwnerId,
            },
          ],
        },

        {
          _id: {
            $ne: req.user._id,
          },
        },
      ],
    })
      .select("name email role avatar")
      .sort({
        name: 1,
      });

    // ========================================
    // BUILD CONVERSATIONS
    // ========================================

    const conversations = await Promise.all(
      members.map(async (member) => {
        // ========================================
        // LAST MESSAGE
        // ========================================

        const lastMessage = await Message.findOne({
          teamOwner: teamOwnerId,

          $or: [
            {
              sender: req.user._id,

              recipient: member._id,
            },

            {
              sender: member._id,

              recipient: req.user._id,
            },
          ],
        })
          .sort({
            createdAt: -1,
          })
          .lean();

        // ========================================
        // UNREAD COUNT
        // ========================================

        const unreadCount = await Message.countDocuments({
          teamOwner: teamOwnerId,

          sender: member._id,

          recipient: req.user._id,

          isRead: false,
        });

        return {
          user: {
            _id: member._id,

            name: member.name,

            email: member.email,

            role: member.role,

            avatar: member.avatar,
          },

          lastMessage,

          unreadCount,
        };
      }),
    );

    // ========================================
    // SORT CONVERSATIONS
    // ========================================

    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) {
        return a.user.name.localeCompare(b.user.name);
      }

      if (!a.lastMessage) {
        return 1;
      }

      if (!b.lastMessage) {
        return -1;
      }

      return (
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
    });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load conversations",
    });
  }
};

// ========================================
// GET MESSAGES
// GET /api/chat/messages/:userId
// ========================================

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // PREVENT SELF CHAT
    // ========================================

    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,

        message: "You cannot chat with yourself",
      });
    }

    // ========================================
    // VERIFY TEAM MEMBER
    // ========================================

    const member = await findTeamMember(userId, teamOwnerId);

    if (!member) {
      return res.status(404).json({
        success: false,

        message: "Team member not found",
      });
    }

    // ========================================
    // GET MESSAGES
    // ========================================

    const messages = await Message.find({
      teamOwner: teamOwnerId,

      $or: [
        {
          sender: req.user._id,

          recipient: member._id,
        },

        {
          sender: member._id,

          recipient: req.user._id,
        },
      ],
    })
      .populate("sender", "name email role avatar")
      .populate("recipient", "name email role avatar")
      .sort({
        createdAt: 1,
      });

    // ========================================
    // MARK RECEIVED MESSAGES AS READ
    // ========================================

    const readResult = await Message.updateMany(
      {
        teamOwner: teamOwnerId,

        sender: member._id,

        recipient: req.user._id,

        isRead: false,
      },

      {
        $set: {
          isRead: true,

          readAt: new Date(),
        },
      },
    );

    // ========================================
    // REAL-TIME READ RECEIPT
    // ========================================

    if (readResult.modifiedCount > 0) {
      const io = req.app.get("io");

      if (io) {
        io.to(`user:${member._id.toString()}`).emit("messagesRead", {
          readBy: req.user._id.toString(),
        });
      }
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      member,
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load messages",
    });
  }
};

// ========================================
// SEND MESSAGE
// POST /api/chat/messages/:userId
// ========================================

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;

    const { text } = req.body || {};

    // ========================================
    // VALIDATE
    // ========================================

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,

        message: "Message cannot be empty",
      });
    }

    if (text.trim().length > 5000) {
      return res.status(400).json({
        success: false,

        message: "Message is too long",
      });
    }

    // ========================================
    // PREVENT SELF MESSAGE
    // ========================================

    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,

        message: "You cannot message yourself",
      });
    }

    // ========================================
    // TEAM
    // ========================================

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // VERIFY RECIPIENT
    // ========================================

    const recipient = await findTeamMember(userId, teamOwnerId);

    if (!recipient) {
      return res.status(404).json({
        success: false,

        message: "Team member not found",
      });
    }

    // ========================================
    // CREATE MESSAGE
    // ========================================

    const message = await Message.create({
      sender: req.user._id,

      recipient: recipient._id,

      teamOwner: teamOwnerId,

      text: text.trim(),

      isRead: false,
    });

    // ========================================
    // POPULATE
    // ========================================

    await message.populate([
      {
        path: "sender",

        select: "name email role avatar",
      },

      {
        path: "recipient",

        select: "name email role avatar",
      },
    ]);

    // ========================================
    // REAL-TIME MESSAGE
    // ========================================

    const io = req.app.get("io");

    if (io) {
      /*
        IMPORTANT:

        We ALWAYS emit newMessage.

        chatMessages setting must NOT
        block delivery of actual messages.

        Otherwise turning notifications
        off would break real-time chat.
      */

      io.to(`user:${recipient._id.toString()}`).emit("newMessage", message);

      console.log(`Real-time message sent to user:${recipient._id}`);
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to send message",
    });
  }
};

// ========================================
// MARK CONVERSATION AS READ
// PUT /api/chat/messages/:userId/read
// ========================================

export const markConversationRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // VERIFY MEMBER
    // ========================================

    const member = await findTeamMember(userId, teamOwnerId);

    if (!member) {
      return res.status(404).json({
        success: false,

        message: "Team member not found",
      });
    }

    // ========================================
    // MARK RECEIVED MESSAGES AS READ
    // ========================================

    const readResult = await Message.updateMany(
      {
        teamOwner: teamOwnerId,

        sender: member._id,

        recipient: req.user._id,

        isRead: false,
      },

      {
        $set: {
          isRead: true,

          readAt: new Date(),
        },
      },
    );

    // ========================================
    // REAL-TIME READ RECEIPT
    // ========================================

    if (readResult.modifiedCount > 0) {
      const io = req.app.get("io");

      if (io) {
        io.to(`user:${member._id.toString()}`).emit("messagesRead", {
          readBy: req.user._id.toString(),
        });
      }
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error("Mark Conversation Read Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to update conversation",
    });
  }
};
