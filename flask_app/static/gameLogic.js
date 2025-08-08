/*
 * Shared game logic functions for The Philosopher's Climb.
 * These utilities are exposed both to the browser (via the window object)
 * and to Node.js for unit testing.
 */

/**
 * Map a symbol type string to its category in the inventory.
 * @param {string} type - The symbol type ('color', 'action', 'advanced')
 * @returns {string|null} The inventory category name
 */
function typeToCategory(type) {
  if (type === 'color') return 'colors';
  if (type === 'action') return 'actions';
  if (type === 'advanced') return 'advanced';
  return null;
}

/**
 * Determine whether the current rule can be applied given the inventory.
 * Does not mutate the inventory.
 * @param {Object} rule - The rule with source, action and target definitions
 * @param {Object} inventory - The current symbol inventory
 * @returns {boolean} True if all required symbols are available
 */
function canApplyRule(rule, inventory) {
  if (!rule.source || !rule.action || !rule.target) return false;
  const needed = [
    { category: typeToCategory(rule.source.type), id: rule.source.id },
    { category: typeToCategory(rule.action.type), id: rule.action.id },
    { category: typeToCategory(rule.target.type), id: rule.target.id }
  ];
  return needed.every(item => {
    const pool = inventory[item.category];
    if (!pool) return false;
    const sym = pool.find(s => s.id === item.id);
    return sym && sym.count > 0;
  });
}

/**
 * Apply a rule by deducting resources from the inventory. Assumes that
 * availability has been checked via `canApplyRule` beforehand.
 * Mutates the provided inventory object.
 * @param {Object} rule - The rule being applied
 * @param {Object} inventory - The inventory to mutate
 */
function applyRule(rule, inventory) {
  const items = [
    { category: typeToCategory(rule.source.type), id: rule.source.id },
    { category: typeToCategory(rule.action.type), id: rule.action.id },
    { category: typeToCategory(rule.target.type), id: rule.target.id }
  ];
  items.forEach(item => {
    const pool = inventory[item.category];
    const sym = pool.find(s => s.id === item.id);
    if (sym && sym.count > 0) {
      sym.count -= 1;
    }
  });
}

// Expose functions to Node.js and browser environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { typeToCategory, canApplyRule, applyRule };
} else {
  window.typeToCategory = typeToCategory;
  window.canApplyRule = canApplyRule;
  window.applyRule = applyRule;
}