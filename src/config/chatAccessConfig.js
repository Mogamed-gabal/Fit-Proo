/**
 * Enhanced Chat Access Control Configuration
 * Centralized configuration with proper access priority and security
 */
module.exports = {
  // Free usage limits
  FREE_USAGE: {
    GLOBAL_MESSAGE_LIMIT: 15, // Total free messages per user across system
    RESET_PERIOD: 'monthly', // When free messages reset (monthly/yearly/never)
    PRIORITY: 3 // Lowest priority - fallback only
  },

  // Subscription access priorities
  SUBSCRIPTION_PRIORITY: {
    ACTIVE: 1, // Highest priority
    GRACE_PERIOD: 2, // Second priority
    FREE_USAGE: 3 // Lowest priority
  },

  // Subscription types
  SUBSCRIPTION_TYPES: {
    DOCTOR_BASED: 'DOCTOR_BASED',
    BUNDLE: 'BUNDLE',
    COUPON: 'COUPON'
  },

  // Chat access types
  CHAT_ACCESS_TYPES: {
    DOCTOR: 'DOCTOR',
    BUNDLE: 'BUNDLE',
    COUPON: 'COUPON',
    FREE: 'FREE'
  },

  // Chat types
  CHAT_TYPES: {
    ONE_TO_ONE: 'ONE_TO_ONE',
    GROUP: 'GROUP'
  },

  // Access reasons (enhanced)
  ACCESS_REASONS: {
    SUBSCRIPTION_ACTIVE: 'SUBSCRIPTION_ACTIVE',
    GRACE_PERIOD: 'GRACE_PERIOD',
    FREE_USAGE: 'FREE_USAGE',
    NO_ACCESS: 'NO_ACCESS',
    INVALID_CHAT: 'INVALID_CHAT',
    NOT_PARTICIPANT: 'NOT_PARTICIPANT',
    WRONG_DOCTOR: 'WRONG_DOCTOR',
    NOT_IN_BUNDLE: 'NOT_IN_BUNDLE',
    FREE_MESSAGES_EXHAUSTED: 'FREE_MESSAGES_EXHAUSTED',
    RATE_LIMITED: 'RATE_LIMITED',
    USER_BLOCKED: 'USER_BLOCKED',
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
    CHAT_SUSPENDED: 'CHAT_SUSPENDED'
  },

  // Access modes
  ACCESS_MODES: {
    SUBSCRIPTION: 'SUBSCRIPTION',
    FREE: 'FREE',
    GRACE: 'GRACE',
    BLOCKED: 'BLOCKED'
  },

  // Grace period settings
  GRACE_PERIOD: {
    DURATION_DAYS: 1, // 1 day grace period after subscription expires
    ACCESS_ALLOWED: true, // Allow access during grace period
    WILL_EXPIRE_SOON_HOURS: 24, // Show warning 24 hours before grace period ends
    PRIORITY: 2
  },

  // Rate limiting settings
  RATE_LIMITING: {
    // Per-user limits
    USER_LIMITS: {
      MAX_PER_MINUTE: 5,
      MAX_PER_HOUR: 50,
      MAX_PER_DAY: 200
    },
    
    // Per-chat limits
    CHAT_LIMITS: {
      MAX_PER_MINUTE: 10,
      MAX_PER_HOUR: 100
    },
    
    // Violation handling
    VIOLATION_PENALTIES: {
      FIRST_VIOLATION: 5 * 60 * 1000, // 5 minutes
      SECOND_VIOLATION: 30 * 60 * 1000, // 30 minutes
      MULTIPLE_VIOLATIONS: 2 * 60 * 60 * 1000 // 2 hours
    }
  },

  // Concurrency and atomic operations
  CONCURRENCY: {
    ATOMIC_OPERATIONS: true, // Use atomic operations for counters
    MAX_RETRY_ATTEMPTS: 3, // Max retries for concurrent operations
    RETRY_DELAY_MS: 100, // Delay between retries
    LOCK_TIMEOUT_MS: 5000 // Lock timeout for critical operations
  },

  // Cache settings for performance
  CACHE: {
    TTL_SECONDS: 300, // 5 minutes cache for user access checks
    MAX_SIZE: 1000, // Maximum cached users
    CHAT_CACHE_TTL: 600, // 10 minutes for chat data
    SUBSCRIPTION_CACHE_TTL: 300 // 5 minutes for subscription data
  },

  // Message tracking
  MESSAGE_TRACKING: {
    COLLECTION: 'user_message_usage',
    INDEX_FIELDS: ['userId', 'createdAt'],
    ATOMIC_UPDATES: true // Use atomic updates for message counters
  },

  // Security settings
  SECURITY: {
    VALIDATE_SUBSCRIPTION_BINDING: true, // Always validate chat-subscription binding
    PREVENT_CLIENT_OVERRIDE: true, // Prevent client from overriding server logic
    ENFORCE_PARTICIPANT_VALIDATION: true, // Strict participant validation
    AUDIT_ACCESS_CHECKS: true // Log all access checks for security
  },

  // UX and signaling
  UX_SIGNALING: {
    EXPIRATION_WARNING_HOURS: 24, // Show warning 24 hours before expiration
    GRACE_PERIOD_WARNING_HOURS: 2, // Show grace period warning
    FREE_MESSAGES_WARNING_THRESHOLD: 3, // Warning when 3 or fewer free messages left
    SHOW_DETAILED_STATUS: true // Show detailed status to users
  }
};
