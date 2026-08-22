import User from "../models/User.js";
import TeamInvitation from "../models/TeamInvitation.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

// ========================================
// HELPER - GET TEAM OWNER ID
// ========================================

const getTeamOwnerId = (user) => {
  return user.teamOwner || user._id;
};

// ========================================
// CREATE NOTIFICATION SAFELY
// ========================================

const createNotificationSafely = async (data) => {
  try {
    await Notification.create(data);
  } catch (error) {
    /*
      Notification failure should not
      stop team operations.
    */

    console.error("Create Team Notification Error:", error);
  }
};

// ========================================
// NOTIFY TEAM MEMBERS
// ========================================

const notifyTeamMembers = async ({
  teamOwnerId,
  senderId,
  title,
  message,
  excludedUserIds = [],
  link = "/team",
}) => {
  try {
    const users = await User.find({
      $or: [
        {
          teamOwner: teamOwnerId,
        },
        {
          _id: teamOwnerId,
        },
      ],
    }).select("_id");

    const excludedIds = new Set(excludedUserIds.map((id) => id.toString()));

    // Do not notify action performer
    excludedIds.add(senderId.toString());

    for (const user of users) {
      if (excludedIds.has(user._id.toString())) {
        continue;
      }

      await createNotificationSafely({
        recipient: user._id,
        sender: senderId,
        title,
        message,
        type: "team",
        relatedId: null,
        link,
      });
    }
  } catch (error) {
    console.error("Notify Team Members Error:", error);
  }
};

// ========================================
// GET TEAM MEMBERS
// GET /api/team
// ========================================

export const getTeamMembers = async (req, res) => {
  try {
    // ========================================
    // FIND CURRENT USER'S TEAM OWNER
    // ========================================

    let ownerId = req.user.teamOwner;

    // ========================================
    // SUPPORT OLD USERS
    // ========================================

    if (!ownerId) {
      /*
        Check whether this old user joined
        through an accepted invitation.
      */

      const acceptedInvitation = await TeamInvitation.findOne({
        email: req.user.email,
        status: "Accepted",
      });

      if (acceptedInvitation) {
        // User belongs to inviter's team
        ownerId = acceptedInvitation.invitedBy;
      } else {
        // Normal old user becomes owner
        // of their own workspace
        ownerId = req.user._id;
      }

      // Save permanently
      await User.findByIdAndUpdate(req.user._id, {
        teamOwner: ownerId,
      });
    }

    // ========================================
    // FIX OLD ACCEPTED USERS
    // ========================================

    const acceptedInvitations = await TeamInvitation.find({
      invitedBy: ownerId,
      status: "Accepted",
    }).select("email");

    const acceptedEmails = acceptedInvitations.map((invitation) =>
      invitation.email.trim().toLowerCase(),
    );

    if (acceptedEmails.length > 0) {
      await User.updateMany(
        {
          email: {
            $in: acceptedEmails,
          },

          teamOwner: null,
        },
        {
          $set: {
            teamOwner: ownerId,
          },
        },
      );
    }

    // ========================================
    // GET ONLY CURRENT TEAM
    // ========================================

    const users = await User.find({
      $or: [
        {
          teamOwner: ownerId,
        },

        // Workspace owner fallback
        {
          _id: ownerId,
        },
      ],
    })
      .select("name email role avatar teamOwner")
      .sort({
        createdAt: -1,
      });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      count: users.length,
      members: users,
    });
  } catch (error) {
    console.error("Get Team Members Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// INVITE TEAM MEMBER
// POST /api/team/invite
// ========================================

export const inviteTeamMember = async (req, res) => {
  try {
    const { name, email, role } = req.body || {};

    // ========================================
    // VALIDATION
    // ========================================

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,

        message: "Name, email and role are required",
      });
    }

    // ========================================
    // NORMALIZE EMAIL
    // ========================================

    const normalizedEmail = email.trim().toLowerCase();

    // ========================================
    // CHECK REGISTERED USER
    // ========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,

        message: "This user is already registered",
      });
    }

    // ========================================
    // CHECK EXISTING INVITATION
    // ========================================

    const existingInvite = await TeamInvitation.findOne({
      email: normalizedEmail,
      status: "Pending",
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,

        message: "Invitation already sent to this email",
      });
    }

    // ========================================
    // CREATE INVITATION
    // ========================================

    const invitation = await TeamInvitation.create({
      name: name.trim(),

      email: normalizedEmail,

      role,

      invitedBy: req.user._id,
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message: "Team invitation created successfully",

      invitation,
    });
  } catch (error) {
    console.error("Invite Team Member Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// GET PENDING INVITATIONS
// GET /api/team/invitations
// ========================================

export const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await TeamInvitation.find({
      invitedBy: req.user._id,

      status: "Pending",
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,

      count: invitations.length,

      invitations,
    });
  } catch (error) {
    console.error("Get Pending Invitations Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// CANCEL INVITATION
// DELETE /api/team/invitations/:id
// ========================================

export const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await TeamInvitation.findOne({
      _id: id,

      invitedBy: req.user._id,

      status: "Pending",
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,

        message: "Pending invitation not found",
      });
    }

    await invitation.deleteOne();

    return res.status(200).json({
      success: true,

      message: "Invitation cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel Invitation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// CHANGE TEAM MEMBER ROLE
// PUT /api/team/members/:id/role
// ========================================

export const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;

    const { role } = req.body || {};

    // ========================================
    // ALLOWED ROLES
    // ========================================

    const allowedRoles = [
      "Project Manager",
      "Frontend Developer",
      "Backend Developer",
      "UI/UX Designer",
      "QA Engineer",
    ];

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // ========================================
    // CURRENT TEAM
    // ========================================

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // PREVENT OWNER ROLE CHANGE
    // ========================================

    if (id.toString() === teamOwnerId.toString()) {
      return res.status(400).json({
        success: false,

        message: "Workspace owner's role cannot be changed",
      });
    }

    // ========================================
    // FIND MEMBER
    // ========================================

    const member = await User.findOne({
      _id: id,
      teamOwner: teamOwnerId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,

        message: "Team member not found",
      });
    }

    // ========================================
    // STORE OLD ROLE
    // ========================================

    const oldRole = member.role;

    // ========================================
    // NO CHANGE
    // ========================================

    if (oldRole === role) {
      return res.status(200).json({
        success: true,

        message: "Member already has this role",

        member: {
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          avatar: member.avatar,
          teamOwner: member.teamOwner,
        },
      });
    }

    // ========================================
    // UPDATE ROLE
    // ========================================

    member.role = role;

    await member.save();

    // ========================================
    // ROLE CHANGE NOTIFICATION
    // ========================================

    /*
      Notify the member whose role changed.
    */

    if (member._id.toString() !== req.user._id.toString()) {
      await createNotificationSafely({
        recipient: member._id,

        sender: req.user._id,

        title: "Your Role Changed",

        message: `${req.user.name} changed your role from ${oldRole} to ${role}`,

        type: "team",

        relatedId: member._id,

        link: "/team",
      });
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Member role updated successfully",

      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar,
        teamOwner: member.teamOwner,
      },
    });
  } catch (error) {
    console.error("Update Member Role Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// REMOVE MEMBER FROM TEAM
// DELETE /api/team/members/:id
// ========================================

export const removeTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const teamOwnerId = getTeamOwnerId(req.user);

    // ========================================
    // PREVENT OWNER REMOVAL
    // ========================================

    if (id.toString() === teamOwnerId.toString()) {
      return res.status(400).json({
        success: false,

        message: "Workspace owner cannot be removed",
      });
    }

    // ========================================
    // FIND MEMBER
    // ========================================

    const member = await User.findOne({
      _id: id,

      teamOwner: teamOwnerId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,

        message: "Team member not found",
      });
    }

    // Save values before removal
    const removedMemberId = member._id;

    const removedMemberName = member.name;

    // ========================================
    // UNASSIGN MEMBER'S TASKS
    // ========================================

    await Task.updateMany(
      {
        teamOwner: teamOwnerId,

        assignee: member._id,
      },
      {
        $set: {
          assignee: null,
        },
      },
    );

    // ========================================
    // NOTIFY REMOVED MEMBER
    // ========================================

    /*
      Notification can still be created because
      the User account is not deleted.
    */

    await createNotificationSafely({
      recipient: removedMemberId,

      sender: req.user._id,

      title: "Removed From Team",

      message: `${req.user.name} removed you from the WorkSync team`,

      type: "team",

      relatedId: null,

      link: "/dashboard",
    });

    // ========================================
    // REMOVE FROM CURRENT WORKSPACE
    // ========================================

    /*
      We do NOT delete the user's account.

      The removed user becomes owner of
      their own separate workspace.
    */

    member.teamOwner = member._id;

    member.role = "Project Manager";

    await member.save();

    // ========================================
    // NOTIFY REMAINING MEMBERS
    // ========================================

    await notifyTeamMembers({
      teamOwnerId,

      senderId: req.user._id,

      excludedUserIds: [removedMemberId],

      title: "Team Member Removed",

      message: `${req.user.name} removed ${removedMemberName} from the team`,

      link: "/team",
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Member removed from team successfully",
    });
  } catch (error) {
    console.error("Remove Team Member Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
