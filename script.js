/**
 * Sudoku Solver — script.js
 * Backtracking algorithm with real-time validation and UX enhancements.
 */

(function () {
  'use strict';

  // ===== DOM References =====
  const gridEl = document.getElementById('sudoku-grid');
  const btnSolve = document.getElementById('btn-solve');
  const btnReset = document.getElementById('btn-reset');
  const numpad = document.getElementById('numpad');
  const toastContainer = document.getElementById('toast-container');
  const statFilled = document.getElementById('stat-filled');
  const statEmpty = document.getElementById('stat-empty');
  const statTime = document.getElementById('stat-time');

  // ===== State =====
  const SIZE = 9;
  let cells = [];        // flat array of 81 input elements
  let activeCell = null;  // currently focused cell index

  // ===== Initialise Grid =====
  function createGrid() {
    gridEl.innerHTML = '';
    cells = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('sudoku-cell');

      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.autocomplete = 'off';
      input.setAttribute('aria-label', `Cell row ${Math.floor(i / SIZE) + 1} column ${(i % SIZE) + 1}`);
      input.dataset.index = i;

      // Events
      input.addEventListener('input', handleInput);
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('keydown', handleKeyDown);

      wrapper.appendChild(input);
      gridEl.appendChild(wrapper);
      cells.push(input);
    }
  }

  // ===== Input Handling =====
  function handleInput(e) {
    const input = e.target;
    // Only allow digits 1-9
    const val = input.value.replace(/[^1-9]/g, '');
    input.value = val.slice(-1); // keep only last valid char

    applyNumColor(input);
    clearErrors();
    validateBoard();
    updateStats();

    // Auto-advance to next empty cell
    if (input.value) {
      const idx = parseInt(input.dataset.index);
      const next = findNextEmpty(idx);
      if (next !== null) cells[next].focus();
    }
  }

  function handleFocus(e) {
    const idx = parseInt(e.target.dataset.index);
    activeCell = idx;
    highlightRelated(idx);
  }

  function handleBlur() {
    clearHighlights();
    activeCell = null;
  }

  // Keyboard navigation (arrow keys, backspace, delete)
  function handleKeyDown(e) {
    const idx = parseInt(e.target.dataset.index);
    const row = Math.floor(idx / SIZE);
    const col = idx % SIZE;
    let targetIdx = null;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) targetIdx = (row - 1) * SIZE + col;
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < SIZE - 1) targetIdx = (row + 1) * SIZE + col;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) targetIdx = row * SIZE + (col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (col < SIZE - 1) targetIdx = row * SIZE + (col + 1);
        break;
      case 'Backspace':
      case 'Delete':
        e.target.value = '';
        applyNumColor(e.target);
        clearErrors();
        validateBoard();
        updateStats();
        break;
    }

    if (targetIdx !== null) {
      cells[targetIdx].focus();
    }
  }

  // ===== Numpad (Mobile) =====
  numpad.addEventListener('click', (e) => {
    const key = e.target.closest('.numpad__key');
    if (!key) return;

    const num = key.dataset.num;

    if (activeCell === null) {
      // If no cell focused, focus first empty cell
      const firstEmpty = findNextEmpty(-1);
      if (firstEmpty !== null) {
        cells[firstEmpty].focus();
        activeCell = firstEmpty;
      } else {
        return;
      }
    }

    const input = cells[activeCell];
    if (input.classList.contains('given') || input.readOnly) return;

    if (num === '0') {
      input.value = '';
    } else {
      input.value = num;
    }

    applyNumColor(input);
    clearErrors();
    validateBoard();
    updateStats();

    // Auto-advance after placing a number
    if (num !== '0') {
      const next = findNextEmpty(activeCell);
      if (next !== null) {
        cells[next].focus();
      }
    }
  });

  // ===== Highlight Related Cells =====
  function highlightRelated(idx) {
    clearHighlights();
    const row = Math.floor(idx / SIZE);
    const col = idx % SIZE;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = Math.floor(i / SIZE);
      const c = i % SIZE;
      if (r === row || c === col || (r >= boxRow && r < boxRow + 3 && c >= boxCol && c < boxCol + 3)) {
        if (i !== idx) cells[i].classList.add('highlight');
      }
    }
  }

  function clearHighlights() {
    cells.forEach(c => c.classList.remove('highlight'));
  }

  // ===== Validation =====
  function getBoardValues() {
    return cells.map(c => {
      const v = parseInt(c.value);
      return isNaN(v) ? 0 : v;
    });
  }

  function validateBoard() {
    const board = getBoardValues();
    let hasError = false;
    const errorSet = new Set();

    for (let i = 0; i < SIZE * SIZE; i++) {
      if (board[i] === 0) continue;
      const row = Math.floor(i / SIZE);
      const col = i % SIZE;

      // Check row
      for (let c = 0; c < SIZE; c++) {
        const j = row * SIZE + c;
        if (j !== i && board[j] === board[i]) {
          errorSet.add(i);
          errorSet.add(j);
          hasError = true;
        }
      }

      // Check column
      for (let r = 0; r < SIZE; r++) {
        const j = r * SIZE + col;
        if (j !== i && board[j] === board[i]) {
          errorSet.add(i);
          errorSet.add(j);
          hasError = true;
        }
      }

      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          const j = r * SIZE + c;
          if (j !== i && board[j] === board[i]) {
            errorSet.add(i);
            errorSet.add(j);
            hasError = true;
          }
        }
      }
    }

    errorSet.forEach(idx => cells[idx].classList.add('error'));

    return !hasError;
  }

  function clearErrors() {
    cells.forEach(c => c.classList.remove('error'));
  }

  // ===== Per-Digit Color =====
  function applyNumColor(input) {
    // Remove existing num-* classes
    for (let n = 1; n <= 9; n++) {
      input.classList.remove(`num-${n}`);
    }
    const val = parseInt(input.value);
    if (val >= 1 && val <= 9) {
      input.classList.add(`num-${val}`);
    }
  }

  function applyAllNumColors() {
    cells.forEach(c => applyNumColor(c));
  }

  function clearAllNumColors() {
    cells.forEach(c => {
      for (let n = 1; n <= 9; n++) {
        c.classList.remove(`num-${n}`);
      }
    });
  }

  // ===== Stats =====
  function updateStats() {
    const board = getBoardValues();
    const filled = board.filter(v => v !== 0).length;
    statFilled.textContent = filled;
    statEmpty.textContent = SIZE * SIZE - filled;
  }

  // ===== Solver (Backtracking) =====
  function solveSudoku(board) {
    const emptyIdx = board.indexOf(0);
    if (emptyIdx === -1) return true; // solved

    const row = Math.floor(emptyIdx / SIZE);
    const col = emptyIdx % SIZE;

    for (let num = 1; num <= 9; num++) {
      if (isValid(board, row, col, num)) {
        board[emptyIdx] = num;
        if (solveSudoku(board)) return true;
        board[emptyIdx] = 0;
      }
    }

    return false;
  }

  function isValid(board, row, col, num) {
    // Check row
    for (let c = 0; c < SIZE; c++) {
      if (board[row * SIZE + c] === num) return false;
    }
    // Check column
    for (let r = 0; r < SIZE; r++) {
      if (board[r * SIZE + col] === num) return false;
    }
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r * SIZE + c] === num) return false;
      }
    }
    return true;
  }

  // ===== Solve Button =====
  btnSolve.addEventListener('click', () => {
    clearErrors();

    // Validate current input first
    if (!validateBoard()) {
      showToast('Ada angka yang saling berbenturan. Perbaiki sebelum solve!', 'error');
      return;
    }

    const board = getBoardValues();
    const filledCount = board.filter(v => v !== 0).length;

    if (filledCount === 0) {
      showToast('Masukkan minimal beberapa angka untuk dipecahkan.', 'info');
      return;
    }

    // Mark given cells
    cells.forEach((c, i) => {
      c.classList.remove('solved', 'given');
      if (board[i] !== 0) {
        c.classList.add('given');
        c.readOnly = true;
      }
    });

    // Show loading state
    btnSolve.classList.add('btn--loading');

    // Use setTimeout to let the UI update before solving
    setTimeout(() => {
      const startTime = performance.now();
      const solved = solveSudoku(board);
      const elapsed = performance.now() - startTime;

      btnSolve.classList.remove('btn--loading');

      if (solved) {
        // Reveal solution with staggered animation
        cells.forEach((cell, i) => {
          if (!cell.classList.contains('given')) {
            cell.value = board[i];
            cell.readOnly = true;
            cell.classList.add('solved');
            cell.style.animationDelay = `${(i % 27) * 20}ms`;
          }
          applyNumColor(cell);
        });

        // Format elapsed time
        const timeStr = elapsed < 1000
          ? `${Math.round(elapsed)}ms`
          : `${(elapsed / 1000).toFixed(2)}s`;
        statTime.textContent = timeStr;

        updateStats();
        showToast(`Sudoku berhasil diselesaikan dalam ${timeStr}! 🎉`, 'success');
      } else {
        // Remove given marks since it failed
        cells.forEach(c => {
          c.classList.remove('given');
          c.readOnly = false;
        });
        showToast('Sudoku ini tidak memiliki solusi. Periksa kembali angka yang dimasukkan.', 'error');
      }
    }, 50);
  });

  // ===== Reset Button =====
  btnReset.addEventListener('click', () => {
    cells.forEach(c => {
      c.value = '';
      c.readOnly = false;
      c.classList.remove('given', 'solved', 'error', 'highlight');
      c.style.animationDelay = '';
    });
    clearAllNumColors();
    statTime.textContent = '—';
    updateStats();
    clearErrors();
    showToast('Papan telah direset.', 'info');
    cells[0].focus();
  });

  // ===== Toast Notifications =====
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      toast.classList.add('toast--exit');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  }

  // ===== Helpers =====
  function findNextEmpty(afterIndex) {
    for (let i = afterIndex + 1; i < SIZE * SIZE; i++) {
      if (!cells[i].value && !cells[i].readOnly) return i;
    }
    return null;
  }

  // ===== Init =====
  createGrid();
  updateStats();

})();
