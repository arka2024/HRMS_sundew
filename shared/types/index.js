/**
 * @typedef {'hr' | 'manager'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 */

/**
 * @typedef {Object} AuthResponse
 * @property {User} user
 * @property {string} token
 */

/**
 * @typedef {Object} Employee
 * @property {string} id
 * @property {string} name
 * @property {string} department
 * @property {string} position
 * @property {string} status
 */

/**
 * @typedef {Object} TeamMember
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} performance
 */

/**
 * @typedef {Object} Evaluation
 * @property {string} id
 * @property {string} employeeName
 * @property {string} period
 * @property {string} status
 * @property {number} score
 */

/**
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} title
 * @property {string} type
 * @property {string} generatedAt
 * @property {string} status
 */

export {};
