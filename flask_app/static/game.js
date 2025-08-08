/*
 * The Philosopher's Climb - Minimal Game Setup
 *
 * This file sets up the initial game board, symbol palette,
 * and basic drag-and-drop rule builder for the MVP. More advanced
 * mechanics like applying rules, movement logic, and resource
 * consumption will be implemented in subsequent steps.
 */

// Configuration for the grid size
const GRID_SIZE = 4;

// Define symbol types and their starting quantities
const initialSymbols = {
  colors: [
    { id: 'red', label: 'Red', count: 5, color: '#e53935' },
    { id: 'blue', label: 'Blue', count: 5, color: '#1e88e5' },
    { id: 'green', label: 'Green', count: 5, color: '#43a047' },
    { id: 'yellow', label: 'Yellow', count: 5, color: '#fdd835' },
    { id: 'gold', label: 'Gold', count: 3, color: '#ffc107' }
  ],
  actions: [
    { id: 'transform', label: 'Transform', icon: '⚡', count: 5 },
    { id: 'push-up', label: 'Push Up', icon: '↑', count: 3 },
    { id: 'push-down', label: 'Push Down', icon: '↓', count: 3 },
    { id: 'push-left', label: 'Push Left', icon: '←', count: 3 },
    { id: 'push-right', label: 'Push Right', icon: '→', count: 3 }
  ],
  advanced: [
    { id: 'row-transform', label: 'Row', icon: '📏', count: 2 },
    { id: 'column-transform', label: 'Column', icon: '📐', count: 2 },
    { id: 'area-effect', label: 'Area', icon: '💥', count: 2 }
  ]
};

// Clone deep copy of initial symbols for current run inventory
let symbolInventory = JSON.parse(JSON.stringify(initialSymbols));

// Keep track of the current rule being assembled
const currentRule = {
  source: null,
  action: null,
  target: null
};

// -----------------------------------------------------------------------------
// Level definitions and state
// Define a few sample levels for the MVP. Each level is a 4x4 array where
// each entry is either null (empty) or a string representing a colored piece.
const LEVELS = [
  [
    [null, null, null, null],
    [null, 'red', null, null],
    [null, 'blue', null, null],
    [null, null, null, null]
  ],
  [
    [null, 'red', null, null],
    [null, 'blue', null, null],
    ['yellow', null, 'green', null],
    [null, null, null, null]
  ],
  [
    ['red', null, 'blue', null],
    [null, 'green', null, 'yellow'],
    [null, null, null, null],
    [null, null, null, null]
  ]
];

// Track current level index and board state
let currentLevelIndex = 0;
// 2D array representing the current level's board
let board = [];
// Original board state used for resetting levels
let originalBoard = [];
// Stack to store previous states for undo functionality
const history = [];

// Initialise the game after DOM has loaded
window.addEventListener('DOMContentLoaded', () => {
  setupGrid();
  populateSymbolPalette();
  setupRuleSlots();
  // Load the first level when the page is ready
  loadLevel(0);
});

/**
 * Create the 4x4 grid and append to DOM. For the MVP the
 * grid starts empty.
 */
function setupGrid() {
  const gridContainer = document.getElementById('grid-container');
  // Clear any existing cells
  gridContainer.innerHTML = '';
  // Create grid cells
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.row = row;
      cell.dataset.col = col;
      // For MVP demonstration, we leave cells empty
      gridContainer.appendChild(cell);
    }
  }
}

/**
 * Populate the symbol palette with available symbols and their
 * counts. Each symbol is rendered as a draggable element.
 */
function populateSymbolPalette() {
  const symbolList = document.getElementById('symbol-list');
  symbolList.innerHTML = '';
  // Helper to add section header
  const addSectionHeader = (text) => {
    const header = document.createElement('div');
    header.textContent = text;
    header.style.fontWeight = 'bold';
    header.style.marginTop = '0.5rem';
    header.style.marginBottom = '0.3rem';
    symbolList.appendChild(header);
  };
  // Colors section
  addSectionHeader('Colors');
  symbolInventory.colors.forEach(symbol => {
    const entry = createSymbolEntry(symbol, 'color');
    symbolList.appendChild(entry);
  });
  // Actions section
  addSectionHeader('Actions');
  symbolInventory.actions.forEach(symbol => {
    const entry = createSymbolEntry(symbol, 'action');
    symbolList.appendChild(entry);
  });
  // Advanced section
  addSectionHeader('Advanced');
  symbolInventory.advanced.forEach(symbol => {
    const entry = createSymbolEntry(symbol, 'advanced');
    symbolList.appendChild(entry);
  });
}

/**
 * Create a DOM element for a symbol entry.
 * @param {object} symbol The symbol descriptor
 * @param {string} type The category (color, action, advanced)
 */
function createSymbolEntry(symbol, type) {
  const entry = document.createElement('div');
  entry.classList.add('symbol-entry');
  entry.draggable = true;
  entry.dataset.type = type;
  entry.dataset.symbolId = symbol.id;
  entry.dataset.count = symbol.count;
  // Label and count elements
  const label = document.createElement('span');
  label.classList.add('symbol-label');
  if (type === 'color') {
    label.textContent = symbol.label;
    // Add color chip
    const chip = document.createElement('span');
    chip.style.display = 'inline-block';
    chip.style.width = '14px';
    chip.style.height = '14px';
    chip.style.backgroundColor = symbol.color;
    chip.style.borderRadius = '50%';
    chip.style.marginRight = '0.4rem';
    entry.prepend(chip);
  } else {
    label.textContent = `${symbol.icon} ${symbol.label}`;
  }
  entry.appendChild(label);
  const countSpan = document.createElement('span');
  countSpan.classList.add('symbol-count');
  countSpan.textContent = symbol.count;
  entry.appendChild(countSpan);
  // Drag events
  entry.addEventListener('dragstart', (e) => onDragStart(e, symbol, type));
  entry.addEventListener('dragend', (e) => onDragEnd(e));
  return entry;
}

/**
 * Attach drag event listeners to rule slots to accept drops.
 */
function setupRuleSlots() {
  const ruleSlots = document.querySelectorAll('.rule-slot');
  ruleSlots.forEach(slot => {
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });
    slot.addEventListener('drop', (e) => onDrop(e, slot));
  });
  // Setup apply button
  const applyBtn = document.getElementById('apply-rule');
  applyBtn.addEventListener('click', () => applyCurrentRule());

  // Setup undo button
  const undoBtn = document.getElementById('undo-action');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      undoLastAction();
    });
  }
  // Setup reset level button
  const resetBtn = document.getElementById('reset-level');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetLevel();
    });
  }
}

/**
 * Handler for drag start on a symbol entry.
 */
function onDragStart(e, symbol, type) {
  e.dataTransfer.setData('text/plain', JSON.stringify({ symbol, type }));
  e.currentTarget.classList.add('dragging');
}

/**
 * Handler for drag end on a symbol entry.
 */
function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
}

/**
 * Handler for dropping a symbol onto a rule slot.
 */
function onDrop(e, slot) {
  e.preventDefault();
  slot.classList.remove('drag-over');
  const data = e.dataTransfer.getData('text/plain');
  if (!data) return;
  const { symbol, type } = JSON.parse(data);
  const slotType = slot.dataset.slot; // 'source', 'action', 'target'
  // Only allow certain types: source requires color/advanced; action requires action; target requires color or gold
  let allowed = false;
  if (slotType === 'source' && (type === 'color' || type === 'advanced')) {
    allowed = true;
  } else if (slotType === 'action' && type === 'action') {
    allowed = true;
  } else if (slotType === 'target' && (type === 'color' || (type === 'advanced' && symbol.id === 'gold'))) {
    // For now treat gold as color. We'll refine later.
    allowed = true;
  }
  if (!allowed) {
    return;
  }
  // Set slot text
  slot.textContent = symbol.label;
  // Mark slot filled
  slot.classList.add('filled');
  // Save selection in currentRule
  currentRule[slotType] = { id: symbol.id, type };
  // Enable apply button if all slots filled
  updateApplyButtonState();
}

/**
 * Update apply button disabled state based on whether a full rule is present.
 */
function updateApplyButtonState() {
  const applyBtn = document.getElementById('apply-rule');
  if (currentRule.source && currentRule.action && currentRule.target) {
    applyBtn.disabled = false;
  } else {
    applyBtn.disabled = true;
  }
}

/**
 * Clears the current rule builder slots and resets state.
 */
function resetRuleBuilder() {
  const slots = document.querySelectorAll('.rule-slot');
  slots.forEach(slot => {
    slot.textContent = slot.dataset.slot.charAt(0).toUpperCase() + slot.dataset.slot.slice(1);
    slot.classList.remove('filled');
  });
  currentRule.source = null;
  currentRule.action = null;
  currentRule.target = null;
  updateApplyButtonState();
}

/**
 * Load a level by index. Resets the board state to the level
 * configuration and stores a deep copy for resetting.
 * @param {number} index The level index to load
 */
function loadLevel(index) {
  currentLevelIndex = index;
  // Deep copy the level configuration into board
  board = JSON.parse(JSON.stringify(LEVELS[index]));
  // Keep another copy for resetting
  originalBoard = JSON.parse(JSON.stringify(board));
  // Clear undo history for new level
  history.length = 0;
  // Render the board to the grid
  renderBoard();
  // Update level info in resource bar
  const levelInfo = document.getElementById('level-info');
  if (levelInfo) levelInfo.textContent = `Level: ${index + 1}`;
  updateUndoButtonState();
}

/**
 * Render the current board state onto the grid cells by setting
 * background colors and content.
 */
function renderBoard() {
  const gridCells = document.querySelectorAll('.grid-cell');
  gridCells.forEach(cell => {
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);
    const value = board[row][col];
    if (value) {
      // Determine color code based on value
      const sym = symbolInventory.colors.find(s => s.id === value);
      const color = (sym && sym.color) ? sym.color : '#ccc';
      cell.style.backgroundColor = color;
      // Display no text for color cells
      cell.textContent = '';
    } else {
      cell.style.backgroundColor = '#f5f5f5';
      cell.textContent = '';
    }
  });
}

/**
 * Execute a rule on the board by moving objects (if movement action)
 * and then transforming objects from source color to target color.
 * @param {Object} rule The rule to execute
 */
function executeRuleOnBoard(rule) {
  const sourceColor = rule.source.id;
  const actionId = rule.action.id;
  const targetColor = rule.target.id;
  // Determine movement based on action
  switch (actionId) {
    case 'push-up':
      moveObjects('up', sourceColor);
      break;
    case 'push-down':
      moveObjects('down', sourceColor);
      break;
    case 'push-left':
      moveObjects('left', sourceColor);
      break;
    case 'push-right':
      moveObjects('right', sourceColor);
      break;
    case 'transform':
      // no movement, just transform
      break;
    default:
      // For advanced actions we will implement later
      break;
  }
  // After movement, transform sourceColor objects into targetColor
  transformObjects(sourceColor, targetColor);
}

/**
 * Move all objects of a given color in the specified direction until they
 * either reach the edge or another object.
 * @param {string} direction 'up', 'down', 'left', 'right'
 * @param {string} color The color of objects to move
 */
function moveObjects(direction, color) {
  if (direction === 'up') {
    // For each column, move from top to bottom? Actually move upward: start from row 1 to 3
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 1; row < GRID_SIZE; row++) {
        if (board[row][col] === color) {
          let targetRow = row;
          while (targetRow > 0 && board[targetRow - 1][col] === null) {
            targetRow--;
          }
          if (targetRow !== row) {
            board[targetRow][col] = color;
            board[row][col] = null;
          }
        }
      }
    }
  } else if (direction === 'down') {
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = GRID_SIZE - 2; row >= 0; row--) {
        if (board[row][col] === color) {
          let targetRow = row;
          while (targetRow < GRID_SIZE - 1 && board[targetRow + 1][col] === null) {
            targetRow++;
          }
          if (targetRow !== row) {
            board[targetRow][col] = color;
            board[row][col] = null;
          }
        }
      }
    }
  } else if (direction === 'left') {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 1; col < GRID_SIZE; col++) {
        if (board[row][col] === color) {
          let targetCol = col;
          while (targetCol > 0 && board[row][targetCol - 1] === null) {
            targetCol--;
          }
          if (targetCol !== col) {
            board[row][targetCol] = color;
            board[row][col] = null;
          }
        }
      }
    }
  } else if (direction === 'right') {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = GRID_SIZE - 2; col >= 0; col--) {
        if (board[row][col] === color) {
          let targetCol = col;
          while (targetCol < GRID_SIZE - 1 && board[row][targetCol + 1] === null) {
            targetCol++;
          }
          if (targetCol !== col) {
            board[row][targetCol] = color;
            board[row][col] = null;
          }
        }
      }
    }
  }
}

/**
 * Transform all objects of a given source color into a target color.
 * Gold objects (id 'gold') cannot be transformed further.
 * @param {string} sourceColor
 * @param {string} targetColor
 */
function transformObjects(sourceColor, targetColor) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] === sourceColor) {
        // Do not transform gold objects further
        if (sourceColor === 'gold') continue;
        board[row][col] = targetColor;
      }
    }
  }
}

/**
 * Check if all objects on the board are gold. If so, complete the level.
 */
function checkLevelCompletion() {
  let allGold = true;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = board[row][col];
      if (value && value !== 'gold') {
        allGold = false;
        break;
      }
    }
    if (!allGold) break;
  }
  if (allGold) {
    completeLevel();
  }
}

/**
 * Handle level completion: increment to next level or end the run if no more levels.
 */
function completeLevel() {
  alert(`Level ${currentLevelIndex + 1} complete!`);
  const nextIndex = currentLevelIndex + 1;
  if (nextIndex < LEVELS.length) {
    loadLevel(nextIndex);
  } else {
    alert('Congratulations! You completed all available levels.');
    // Reset to first level for replay
    loadLevel(0);
  }
}

/**
 * Undo the last applied rule by restoring the previous board and inventory
 * states. Disables undo button if history is empty.
 */
function undoLastAction() {
  if (history.length === 0) return;
  const lastState = history.pop();
  // Restore board and inventory
  board = JSON.parse(JSON.stringify(lastState.board));
  symbolInventory = JSON.parse(JSON.stringify(lastState.inventory));
  // Update UI
  renderBoard();
  populateSymbolPalette();
  updateUndoButtonState();
}

/**
 * Reset the current level by restoring the original board. Inventory
 * remains unchanged. Undo history is cleared.
 */
function resetLevel() {
  board = JSON.parse(JSON.stringify(originalBoard));
  history.length = 0;
  renderBoard();
  // Do not reset inventory or rule builder
  // We may want to allow undo after reset, but for simplicity we clear history
  updateUndoButtonState();
}

/**
 * Enable or disable the undo button depending on whether there is
 * history to revert to.
 */
function updateUndoButtonState() {
  const undoBtn = document.getElementById('undo-action');
  if (undoBtn) {
    undoBtn.disabled = history.length === 0;
  }
}

/**
 * Applies the currently assembled rule. For the MVP this will
 * simply log the rule and deduct one from each selected symbol's
 * count. It will also clear the rule builder afterwards.
 */
function applyCurrentRule() {
  if (!(currentRule.source && currentRule.action && currentRule.target)) {
    return;
  }
  // Validate resources via shared helper
  if (!canApplyRule(currentRule, symbolInventory)) {
    alert('Not enough resources to apply this rule!');
    return;
  }
  // Deduct resources from inventory
  applyRule(currentRule, symbolInventory);
  // Save current board and inventory to history for undo
  history.push({
    board: JSON.parse(JSON.stringify(board)),
    inventory: JSON.parse(JSON.stringify(symbolInventory))
  });
  // Execute the rule logic on the board (move and/or transform)
  executeRuleOnBoard(currentRule);
  // Update the UI: re-render board and symbol palette
  renderBoard();
  populateSymbolPalette();
  // Clear the rule builder for next rule
  resetRuleBuilder();
  // Check if level is complete
  checkLevelCompletion();
  updateUndoButtonState();
}