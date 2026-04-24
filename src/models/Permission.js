const mongoose = require('mongoose');

/**
 * Permission Schema
 * Dynamic permission management system for role-based access control
 */
const permissionSchema = new mongoose.Schema({
  // Permission details
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Permission description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'USER_MANAGEMENT',
      'DOCTOR_MANAGEMENT', 
      'CLIENT_MANAGEMENT',
      'DIET_PLAN_MANAGEMENT',
      'DIET_PROGRESS_MANAGEMENT',
      'SYSTEM_ACCESS',
      'DATA_EXPORT',
      'REPORTS',
      'SETTINGS',
      'BILLING',
      'SECURITY',
      'NOTIFICATIONS',
      'WORKOUT_MANAGEMENT',
      'EXERCISE_MANAGEMENT',
      'SUBSCRIPTION_MANAGEMENT'
    ]
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'APPROVE',
      'REJECT',
      'BLOCK',
      'UNBLOCK',
      'EXPORT',
      'IMPORT',
      'MANAGE',
      'VIEW',
      'ACCESS',
      'MODIFY'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'USERS',
      'DOCTORS',
      'CLIENTS',
      'DIET_PLANS',
      'DIET_PROGRESS',
      'EXERCISES',
      'WORKOUT_PLANS',
      'WORKOUT_TEMPLATES',
      'SUBSCRIPTIONS',
      'NOTIFICATIONS',
      'REPORTS',
      'SETTINGS',
      'BILLING',
      'SYSTEM',
      'AUDIT_LOGS'
    ]
  },

  // Permission management
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },

  // Assignment tracking
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  },

  // Audit trail
  lastUsed: {
    type: Date,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'permissions'
});

// Indexes for performance
permissionSchema.index({ name: 1 });
permissionSchema.index({ assignedTo: 1, isActive: 1 });
permissionSchema.index({ category: 1, action: 1, resource: 1 });
permissionSchema.index({ expiresAt: 1 });

// Static methods
permissionSchema.statics.createDefaultPermissions = async function() {
  const defaultPermissions = [
    // User Management
    {
      name: 'manage_users',
      description: 'Full access to user management operations',
      category: 'USER_MANAGEMENT',
      action: 'MANAGE',
      resource: 'USERS',
      level: 5,
      isSystem: true
    },
    {
      name: 'block_client',
      description: 'Ability to block client accounts',
      category: 'USER_MANAGEMENT',
      action: 'BLOCK',
      resource: 'CLIENTS',
      level: 3
    },
    {
      name: 'unblock_client',
      description: 'Ability to unblock client accounts',
      category: 'USER_MANAGEMENT',
      action: 'UNBLOCK',
      resource: 'CLIENTS',
      level: 3
    },
    {
      name: 'view_user_details',
      description: 'Ability to view detailed user information',
      category: 'USER_MANAGEMENT',
      action: 'VIEW',
      resource: 'USERS',
      level: 2
    },

    // Doctor Management
    {
      name: 'manage_doctors',
      description: 'Full access to doctor management operations',
      category: 'DOCTOR_MANAGEMENT',
      action: 'MANAGE',
      resource: 'DOCTORS',
      level: 5,
      isSystem: true
    },
    {
      name: 'approve_doctor',
      description: 'Ability to approve doctor registrations',
      category: 'DOCTOR_MANAGEMENT',
      action: 'APPROVE',
      resource: 'DOCTORS',
      level: 3
    },
    {
      name: 'reject_doctor',
      description: 'Ability to reject doctor registrations',
      category: 'DOCTOR_MANAGEMENT',
      action: 'REJECT',
      resource: 'DOCTORS',
      level: 3
    },
    {
      name: 'restore_doctor',
      description: 'Ability to restore soft-deleted doctors',
      category: 'DOCTOR_MANAGEMENT',
      action: 'MANAGE',
      resource: 'DOCTORS',
      level: 4
    },
    {
      name: 'view_doctor_profile',
      description: 'Ability to view doctor profile information',
      category: 'DOCTOR_MANAGEMENT',
      action: 'VIEW',
      resource: 'DOCTORS',
      level: 2
    },

    // Diet Plan Management
    {
      name: 'manage_diet_plans',
      description: 'Full access to diet plan operations',
      category: 'DIET_PLAN_MANAGEMENT',
      action: 'MANAGE',
      resource: 'DIET_PLANS',
      level: 5,
      isSystem: true
    },
    {
      name: 'create_diet_plan',
      description: 'Ability to create new diet plans',
      category: 'DIET_PLAN_MANAGEMENT',
      action: 'CREATE',
      resource: 'DIET_PLANS',
      level: 3
    },
    {
      name: 'update_diet_plan',
      description: 'Ability to update existing diet plans',
      category: 'DIET_PLAN_MANAGEMENT',
      action: 'UPDATE',
      resource: 'DIET_PLANS',
      level: 3
    },
    {
      name: 'delete_diet_plan',
      description: 'Ability to delete diet plans',
      category: 'DIET_PLAN_MANAGEMENT',
      action: 'DELETE',
      resource: 'DIET_PLANS',
      level: 4
    },
    {
      name: 'view_diet_plan',
      description: 'Ability to view diet plan details',
      category: 'DIET_PLAN_MANAGEMENT',
      action: 'VIEW',
      resource: 'DIET_PLANS',
      level: 2
    },

    // System Access
    {
      name: 'access_admin_panel',
      description: 'Ability to access admin dashboard',
      category: 'SYSTEM_ACCESS',
      action: 'ACCESS',
      resource: 'SYSTEM',
      level: 2
    },
    {
      name: 'view_sensitive_data',
      description: 'Ability to view sensitive user data',
      category: 'DATA_EXPORT',
      action: 'VIEW',
      resource: 'USERS',
      level: 4
    },
    {
      name: 'export_user_data',
      description: 'Ability to export user data',
      category: 'DATA_EXPORT',
      action: 'EXPORT',
      resource: 'USERS',
      level: 3
    },
    {
      name: 'view_system_reports',
      description: 'Ability to view system reports',
      category: 'REPORTS',
      action: 'VIEW',
      resource: 'SYSTEM',
      level: 2
    },

    // Audit Log Access
    {
      name: 'read_supervisor_audit',
      description: 'Ability to read supervisor audit logs',
      category: 'AUDIT_LOGS',
      action: 'READ',
      resource: 'AUDIT_LOGS',
      level: 2
    },
    {
      name: 'export_supervisor_audit',
      description: 'Ability to export supervisor audit logs',
      category: 'AUDIT_LOGS',
      action: 'EXPORT',
      resource: 'AUDIT_LOGS',
      level: 3
    },
    {
      name: 'manage_supervisor_audit',
      description: 'Ability to manage supervisor audit logs',
      category: 'AUDIT_LOGS',
      action: 'MANAGE',
      resource: 'AUDIT_LOGS',
      level: 4
    }
  ];

  try {
    const created = await this.insertMany(
      defaultPermissions.map(perm => ({ ...perm, assignedBy: null, assignedTo: null }))
    );
    console.log(`🔐 Created ${created.length} default permissions`);
    return created;
  } catch (error) {
    console.error('❌ Error creating default permissions:', error);
    throw error;
  }
};

permissionSchema.statics.assignPermission = async function(permissionId, userId, assignedBy, expiresAt = null) {
  try {
    const assignment = await this.findByIdAndUpdate(
      permissionId,
      {
        assignedTo: userId,
        assignedBy,
        assignedAt: new Date(),
        expiresAt,
        isActive: true,
        $inc: { usageCount: 1 }
      },
      { new: true, upsert: false }
    );

    // Update last used
    await this.findByIdAndUpdate(permissionId, { lastUsed: new Date() });

    console.log(`🔐 Assigned permission ${permissionId} to user ${userId}`);
    return assignment;
  } catch (error) {
    console.error('❌ Error assigning permission:', error);
    throw error;
  }
};

permissionSchema.statics.revokePermission = async function(permissionId, revokedBy) {
  try {
    const result = await this.findByIdAndUpdate(
      permissionId,
      {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: revokedBy,
        isDeleted: true
      },
      { new: true }
    );

    console.log(`🔐 Revoked permission ${permissionId} by user ${revokedBy}`);
    return result;
  } catch (error) {
    console.error('❌ Error revoking permission:', error);
    throw error;
  }
};

permissionSchema.statics.getUserPermissions = async function(userId, includeInactive = false) {
  try {
    const query = {
      assignedTo: userId,
      isDeleted: false
    };

    if (!includeInactive) {
      query.isActive = true;
      query.$or = [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ];
    }

    const permissions = await this.find(query)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    return permissions;
  } catch (error) {
    console.error('❌ Error fetching user permissions:', error);
    throw error;
  }
};

permissionSchema.statics.checkPermission = async function(userId, permissionName, resource = null) {
  try {
    const permission = await this.findOne({
      assignedTo: userId,
      name: permissionName,
      isActive: true,
      isDeleted: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    if (!permission) {
      return false;
    }

    // Check resource-specific permissions
    if (resource && permission.resource !== resource && permission.resource !== 'SYSTEM') {
      return false;
    }

    // Update usage
    await this.findByIdAndUpdate(permission._id, { 
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    });

    return true;
  } catch (error) {
    console.error('❌ Error checking permission:', error);
    return false;
  }
};

permissionSchema.statics.getPermissionStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: {
            category: '$category',
            action: '$action',
            isActive: '$isActive'
          },
          count: { $sum: 1 },
          avgLevel: { $avg: '$level' },
          uniqueUsers: { $addToSet: '$assignedTo' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return stats;
  } catch (error) {
    console.error('❌ Error getting permission stats:', error);
    throw error;
  }
};

// Virtual fields
permissionSchema.virtual('id').get(function() {
  return this._id;
});

// JSON transformation
permissionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Permission', permissionSchema);
