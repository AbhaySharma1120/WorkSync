import Notification from "../models/Notification.js";

// ========================================
// GET USER NOTIFICATIONS
// ========================================

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "name email role avatar")
      .sort({
        createdAt: -1,
      })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

// ========================================
// MARK ONE NOTIFICATION AS READ
// ========================================

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark Notification Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

// ========================================
// MARK ALL NOTIFICATIONS AS READ
// ========================================

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
};

// ========================================
// DELETE ONE NOTIFICATION
// ========================================

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};
