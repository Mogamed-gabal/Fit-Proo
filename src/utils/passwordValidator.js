/**
 * Password Validation Utility
 * Provides centralized password validation across the application
 */

/**
 * Validates password according to security requirements
 * @param {string} password - Password to validate
 * @throws {Error} - If password doesn't meet requirements
 */
function validatePassword(password) {
  if (!password) {
    throw new Error('Password is required');
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  
  if (!passwordRegex.test(password)) {
    throw new Error(
      'Password must be at least 8 characters and include uppercase, lowercase and a number.'
    );
  }
}

module.exports = validatePassword;
