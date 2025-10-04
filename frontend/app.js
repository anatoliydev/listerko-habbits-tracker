const { url, anonKey } = window.__SUPABASE;
const supabase = window.supabase.createClient(url, anonKey);

const authView = document.getElementById('auth-view');
const appView  = document.getElementById('app-view');
const authMsg  = document.getElementById('authMessage');
const emailInp = document.getElementById('email');
const hello    = document.getElementById('hello');
const debug    = document.getElementById('debug');

// Theme management

// Theme functions
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setCookie('theme', theme);
}


// Initialize theme
function initTheme() {
  const savedTheme = getCookie('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Default to dark theme as requested
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'dark');
  setTheme(initialTheme);
}


// Initialize theme on page load
initTheme();

// Habit Tracker functionality
const habitsTable = document.getElementById('habits-table');
const habitsTbody = document.getElementById('habits-tbody');
const addHabitBtn = document.getElementById('add-habit');

// Debug DOM elements
console.log('DOM elements check:');
console.log('habitsTable:', habitsTable);
console.log('habitsTbody:', habitsTbody);
console.log('addHabitBtn:', addHabitBtn);

// Check if elements exist
if (!habitsTable) {
  console.error('habitsTable not found!');
}
if (!habitsTbody) {
  console.error('habitsTbody not found!');
}
if (!addHabitBtn) {
  console.error('addHabitBtn not found!');
}

// Sample habits data
let habits = [
  { id: 1, name: 'Біг', color: '#3b82f6', days: {} },
  { id: 2, name: 'Читання', color: '#f59e0b', days: {} },
  { id: 3, name: 'Медитація', color: '#10b981', days: {} }
];

// Generate days for the last 15 days
function generateDays() {
  const today = new Date();
  const days = [];
  const daysCount = settings.daysCount || 15;
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({
      date: date,
      dayNumber: date.getDate(),
      isToday: i === 0,
      monthName: date.toLocaleDateString('uk-UA', { month: 'short' }),
      fullMonthName: date.toLocaleDateString('uk-UA', { month: 'long' })
    });
  }
  
  return days;
}



// Generate month headers
function generateMonthHeaders() {
  const days = generateDays();
  const monthHeadersRow = document.getElementById('month-headers-row');
  if (!monthHeadersRow) {
    console.error('Month headers row not found');
    return;
  }
  
  // Clear existing month headers
  const existingHeaders = monthHeadersRow.querySelectorAll('th:not(:first-child)');
  existingHeaders.forEach(th => th.remove());
  
  // Group days by month
  const monthGroups = {};
  days.forEach(day => {
    const monthKey = day.date.getFullYear() + '-' + day.date.getMonth();
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = [];
    }
    monthGroups[monthKey].push(day);
  });
  
  // Create month headers
  Object.values(monthGroups).forEach(monthDays => {
    const monthHeader = document.createElement('th');
    monthHeader.colSpan = monthDays.length;
    const year = monthDays[0].date.getFullYear();
    const monthName = monthDays[0].date.toLocaleDateString('uk-UA', { month: 'long' });
    monthHeader.textContent = `${monthName} ${year}`;
    monthHeadersRow.appendChild(monthHeader);
  });
}

// Generate table header with days
function generateTableHeader() {
  console.log('Generating table header...');
  const days = generateDays();
  console.log('Generated days:', days);
  
  const headerRow = habitsTable.querySelector('thead tr:last-child');
  if (!headerRow) {
    console.error('Table header row not found');
    return;
  }
  
  console.log('Found header row:', headerRow);
  
  // Clear existing day headers
  const existingDays = headerRow.querySelectorAll('th:not(:first-child)');
  console.log('Clearing', existingDays.length, 'existing day headers');
  existingDays.forEach(th => th.remove());
  
  // Add day headers with week grouping
  days.forEach((day, index) => {
    const th = document.createElement('th');
    th.textContent = day.dayNumber;
    if (day.isToday) {
      th.classList.add('today');
    }
    
    // Add week separator for Monday (start of new week)
    const dayOfWeek = day.date.getDay();
    if (dayOfWeek === 1) { // Monday
      th.classList.add('week-separator');
    }
    
    headerRow.appendChild(th);
    console.log(`Added day header ${index + 1}: ${day.dayNumber} (day of week: ${dayOfWeek})`);
  });
  
  console.log('Table header generated successfully');
}

// Generate habit row
function generateHabitRow(habit) {
  const days = generateDays();
  const row = document.createElement('tr');
  
  // Habit name cell
  const nameCell = document.createElement('td');
  nameCell.className = 'habit-name';
  nameCell.innerHTML = `
    <span class="color" style="background: ${habit.color}"></span>
    ${habit.name}
    <span class="edit" onclick="openEditModal(${habit.id})">✏️</span>
  `;
  row.appendChild(nameCell);
  
  // Day cells
  days.forEach(day => {
    const cell = document.createElement('td');
    const dayKey = day.date.toISOString().split('T')[0];
    const status = habit.days[dayKey] || 'not-tracked';
    
    const cellDiv = document.createElement('div');
    cellDiv.className = `cell ${status}`;
    if (status === 'completed') {
      cellDiv.style.backgroundColor = habit.color;
    }
    cellDiv.onclick = () => toggleHabitStatus(habit.id, dayKey);
    cell.appendChild(cellDiv);
    row.appendChild(cell);
  });
  
  return row;
}

// Toggle habit status
function toggleHabitStatus(habitId, dayKey) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  const currentStatus = habit.days[dayKey] || 'not-tracked';
  let newStatus;
  
  switch (currentStatus) {
    case 'not-tracked':
      newStatus = 'completed';
      break;
    case 'completed':
      newStatus = 'failed';
      break;
    case 'failed':
      newStatus = 'not-planned';
      break;
    case 'not-planned':
      newStatus = 'not-tracked';
      break;
    default:
      newStatus = 'completed';
  }
  
  habit.days[dayKey] = newStatus;
  renderHabitsTable();
  saveHabitsToStorage();
}

// Add new habit
function addHabit() {
  openAddModal();
}

function openAddModal() {
  const modal = document.getElementById('add-habit-modal');
  const nameInput = document.getElementById('add-habit-name');
  const colorOptions = modal.querySelectorAll('.color-option');
  
  // Clear form
  nameInput.value = '';
  
  // Clear previous selections
  colorOptions.forEach(option => option.classList.remove('selected'));
  
  // Show modal first
  modal.style.display = 'flex';
  
  // Auto-select next available color after modal is shown
  setTimeout(() => {
    const nextColor = getNextAvailableColor();
    console.log('Next available color:', nextColor);
    
    const matchingOption = Array.from(colorOptions).find(option => 
      option.dataset.color === nextColor
    );
    
    if (matchingOption) {
      console.log('Found matching color option:', matchingOption.dataset.color);
      matchingOption.classList.add('selected');
    } else {
      console.log('No matching color found, selecting random');
      // Select a random color instead of first
      const randomIndex = Math.floor(Math.random() * colorOptions.length);
      colorOptions[randomIndex].classList.add('selected');
    }
    
    // Update color preview
    updateColorPreview(modal);
  }, 100); // Small delay to ensure modal is rendered
  
  nameInput.focus();
}

function closeAddModal() {
  const modal = document.getElementById('add-habit-modal');
  modal.style.display = 'none';
}

function createHabit() {
  const nameInput = document.getElementById('add-habit-name');
  const selectedColorOption = document.querySelector('#add-habit-modal .color-option.selected');
  
  const name = nameInput.value.trim();
  if (!name) {
    alert('Будь ласка, введіть назву звички');
    return;
  }
  
  // Use selected color or get next available color
  const color = selectedColorOption ? selectedColorOption.dataset.color : getNextAvailableColor();
  
  const newHabit = {
    id: Date.now(),
    name: name,
    color: color,
    days: {}
  };
  
  habits.push(newHabit);
  
  // Regenerate headers and table
  generateMonthHeaders();
  generateTableHeader();
  renderHabitsTable();
  saveHabitsToStorage();
  closeAddModal();
}

// Edit habit
function editHabit(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  const newName = prompt('Нова назва звички:', habit.name);
  if (newName && newName.trim() !== habit.name) {
    habit.name = newName.trim();
    renderHabitsTable();
    saveHabitsToStorage();
  }
}

// Delete habit
function deleteHabit(habitId) {
  if (confirm('Ви впевнені, що хочете видалити цю звичку?')) {
    habits = habits.filter(h => h.id !== habitId);
    renderHabitsTable();
    saveHabitsToStorage();
  }
}

// Modal functions
let currentEditingHabitId = null;

// Settings functions
let settings = {
  theme: 'dark',
  spacing: 1.1,
  daysCount: 18,
  cellSize: 0.8,
  cellGap: 0.1
};

function openSettingsModal() {
  console.log('=== Opening settings modal ===');
  const modal = document.getElementById('settings-modal');
  
  if (!modal) {
    console.error('Settings modal not found!');
    return;
  }
  
  const themeSelect = document.getElementById('theme-select');
  const spacingSlider = document.getElementById('spacing-slider');
  const spacingValue = document.getElementById('spacing-value');
  const daysCountSlider = document.getElementById('days-count-slider');
  const daysCountValue = document.getElementById('days-count-value');
  const cellSizeSlider = document.getElementById('cell-size-slider');
  const cellSizeValue = document.getElementById('cell-size-value');
  const cellGapSlider = document.getElementById('cell-gap-slider');
  const cellGapValue = document.getElementById('cell-gap-value');

  // Load current settings
  if (themeSelect) themeSelect.value = settings.theme;
  if (spacingSlider) spacingSlider.value = settings.spacing;
  if (spacingValue) spacingValue.textContent = settings.spacing.toFixed(1);
  if (daysCountSlider) daysCountSlider.value = settings.daysCount;
  if (daysCountValue) daysCountValue.textContent = settings.daysCount;
  if (cellSizeSlider) cellSizeSlider.value = settings.cellSize;
  if (cellSizeValue) cellSizeValue.textContent = settings.cellSize.toFixed(1);
  if (cellGapSlider) cellGapSlider.value = settings.cellGap;
  if (cellGapValue) cellGapValue.textContent = settings.cellGap.toFixed(1);

  // Show modal
  modal.style.display = 'flex';
  console.log('Modal should be visible now');

  // Initialize dragging
  initDragging();
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'none';
  
  // Reset live preview when closing
  resetLivePreview();
}

function saveSettings() {
  const themeSelect = document.getElementById('theme-select');
  const spacingSlider = document.getElementById('spacing-slider');
  const daysCountSlider = document.getElementById('days-count-slider');
  const cellSizeSlider = document.getElementById('cell-size-slider');
  const cellGapSlider = document.getElementById('cell-gap-slider');

  // Update settings
  settings.theme = themeSelect.value;
  settings.spacing = parseFloat(spacingSlider.value);
  settings.daysCount = parseInt(daysCountSlider.value);
  settings.cellSize = parseFloat(cellSizeSlider.value);
  settings.cellGap = parseFloat(cellGapSlider.value);

  // Apply theme
  setTheme(settings.theme);

  // Apply spacing and cell settings
  document.documentElement.style.setProperty('--spacing-multiplier', settings.spacing);
  document.documentElement.style.setProperty('--cell-size-multiplier', settings.cellSize);
  document.documentElement.style.setProperty('--cell-gap-multiplier', settings.cellGap);

  // Save to localStorage
  localStorage.setItem('settings', JSON.stringify(settings));
  
  // Save to cookies
  setCookie('settings', JSON.stringify(settings), 365); // Save for 1 year

  // Regenerate table with new days count
  initHabitsTable();

  closeSettingsModal();
}

function resetSettings() {
  settings = {
    theme: 'dark',
    spacing: 1.1,
    daysCount: 18,
    cellSize: 0.8,
    cellGap: 0.1
  };

  // Apply default settings
  setTheme(settings.theme);
  document.documentElement.style.setProperty('--spacing-multiplier', settings.spacing);
  document.documentElement.style.setProperty('--cell-size-multiplier', settings.cellSize);
  document.documentElement.style.setProperty('--cell-gap-multiplier', settings.cellGap);

  // Update form
  document.getElementById('theme-select').value = settings.theme;
  document.getElementById('spacing-slider').value = settings.spacing;
  document.getElementById('spacing-value').textContent = settings.spacing.toFixed(1);
  document.getElementById('days-count-slider').value = settings.daysCount;
  document.getElementById('days-count-value').textContent = settings.daysCount;
  document.getElementById('cell-size-slider').value = settings.cellSize;
  document.getElementById('cell-size-value').textContent = settings.cellSize.toFixed(1);
  document.getElementById('cell-gap-slider').value = settings.cellGap;
  document.getElementById('cell-gap-value').textContent = settings.cellGap.toFixed(1);

  // Save to localStorage
  localStorage.setItem('settings', JSON.stringify(settings));
  
  // Save to cookies
  setCookie('settings', JSON.stringify(settings), 365); // Save for 1 year

  // Regenerate table
  initHabitsTable();
}

function loadSettings() {
  // Try to load from cookies first
  let saved = getCookie('settings');
  
  // If not found in cookies, try localStorage
  if (!saved) {
    saved = localStorage.getItem('settings');
  }
  
  if (saved) {
    try {
      settings = JSON.parse(saved);
      setTheme(settings.theme);
      document.documentElement.style.setProperty('--spacing-multiplier', settings.spacing);
      document.documentElement.style.setProperty('--cell-size-multiplier', settings.cellSize || 1);
      document.documentElement.style.setProperty('--cell-gap-multiplier', settings.cellGap || 1);
      
      // Sync to cookies if loaded from localStorage
      if (!getCookie('settings')) {
        setCookie('settings', JSON.stringify(settings), 365);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
      // Set default values if parsing fails
      setDefaultSettings();
    }
  } else {
    // Set default values if no settings saved
    setDefaultSettings();
  }
}

function setDefaultSettings() {
  document.documentElement.style.setProperty('--spacing-multiplier', '1.1');
  document.documentElement.style.setProperty('--cell-size-multiplier', '0.8');
  document.documentElement.style.setProperty('--cell-gap-multiplier', '0.1');
}

// Dragging functionality
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function initDragging() {
  console.log('=== Initializing dragging ===');
  const modal = document.getElementById('settings-modal');
  
  if (!modal) {
    console.error('Settings modal not found for dragging');
    return;
  }
  
  const header = modal.querySelector('.draggable-header');
  
  if (!header) {
    console.error('Draggable header not found');
    console.log('Modal HTML:', modal.innerHTML);
    return;
  }
  
  console.log('Header found, setting up dragging...');
  
  // Remove existing listeners to avoid duplicates
  header.removeEventListener('mousedown', startDrag);
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
  
  // Add new listeners
  header.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
  
  console.log('Dragging listeners added successfully');
  
  // Test if header is clickable
  console.log('Header styles:', {
    cursor: getComputedStyle(header).cursor,
    pointerEvents: getComputedStyle(header).pointerEvents,
    userSelect: getComputedStyle(header).userSelect
  });
}

function startDrag(e) {
  console.log('=== Start drag triggered ===', e);
  isDragging = true;
  const modal = document.getElementById('settings-modal');
  const modalContent = modal.querySelector('.modal-content');
  
  if (!modalContent) {
    console.error('Modal content not found for dragging');
    return;
  }
  
  console.log('Modal content found, starting drag...');
  
  const rect = modalContent.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  
  console.log('Drag offset calculated:', dragOffset);
  
  modalContent.style.position = 'fixed';
  modalContent.style.top = rect.top + 'px';
  modalContent.style.left = rect.left + 'px';
  modalContent.style.transform = 'none';
  modalContent.style.zIndex = '1001';
  
  console.log('Modal content positioned for dragging');
  
  e.preventDefault();
  e.stopPropagation();
}

function drag(e) {
  if (!isDragging) return;
  
  const modal = document.getElementById('settings-modal');
  const modalContent = modal.querySelector('.modal-content');
  
  if (!modalContent) return;
  
  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;
  
  // Keep modal within viewport
  const maxX = window.innerWidth - modalContent.offsetWidth;
  const maxY = window.innerHeight - modalContent.offsetHeight;
  
  modalContent.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
  modalContent.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
  
  e.preventDefault();
}

function stopDrag() {
  isDragging = false;
}

// Live preview functionality
function applyLivePreview() {
  const themeSelect = document.getElementById('theme-select');
  const spacingSlider = document.getElementById('spacing-slider');
  const daysCountSlider = document.getElementById('days-count-slider');
  const cellSizeSlider = document.getElementById('cell-size-slider');
  const cellGapSlider = document.getElementById('cell-gap-slider');

  if (!themeSelect || !spacingSlider || !daysCountSlider || !cellSizeSlider || !cellGapSlider) return;

  // Apply theme preview
  const tempTheme = themeSelect.value;
  if (tempTheme !== settings.theme) {
    document.documentElement.setAttribute('data-theme', tempTheme);
  }

  // Apply spacing preview
  const tempSpacing = parseFloat(spacingSlider.value);
  if (tempSpacing !== settings.spacing) {
    document.documentElement.style.setProperty('--spacing-multiplier', tempSpacing);
  }

  // Apply cell size preview
  const tempCellSize = parseFloat(cellSizeSlider.value);
  if (tempCellSize !== settings.cellSize) {
    document.documentElement.style.setProperty('--cell-size-multiplier', tempCellSize);
  }

  // Apply cell gap preview
  const tempCellGap = parseFloat(cellGapSlider.value);
  if (tempCellGap !== settings.cellGap) {
    document.documentElement.style.setProperty('--cell-gap-multiplier', tempCellGap);
  }

  // Apply days count preview (regenerate table)
  const tempDaysCount = parseInt(daysCountSlider.value);
  if (tempDaysCount !== settings.daysCount) {
    console.log('Applying days count preview:', tempDaysCount);
    
    // Temporarily update settings for preview
    const originalDaysCount = settings.daysCount;
    settings.daysCount = tempDaysCount;
    
    // Regenerate headers and table
    generateMonthHeaders();
    generateTableHeader();
    renderHabitsTable();
    
    // Restore original settings for comparison
    settings.daysCount = originalDaysCount;
  }
}

function resetLivePreview() {
  // Reset to current settings
  setTheme(settings.theme);
  document.documentElement.style.setProperty('--spacing-multiplier', settings.spacing);
  document.documentElement.style.setProperty('--cell-size-multiplier', settings.cellSize);
  document.documentElement.style.setProperty('--cell-gap-multiplier', settings.cellGap);
  
  // Regenerate table with current settings
  generateMonthHeaders();
  generateTableHeader();
  renderHabitsTable();
}

// Auto-adjust days count based on cell size
function adjustDaysCountBasedOnSize() {
  const cellSizeSlider = document.getElementById('cell-size-slider');
  const daysCountSlider = document.getElementById('days-count-slider');
  const daysCountValue = document.getElementById('days-count-value');
  
  if (!cellSizeSlider || !daysCountSlider || !daysCountValue) return;
  
  const cellSize = parseFloat(cellSizeSlider.value);
  const currentDays = parseInt(daysCountSlider.value);
  
  // Calculate new days count based on size increase
  // If size increases by 20%, reduce days by ~15%
  const sizeMultiplier = cellSize;
  const newDays = Math.max(7, Math.min(30, Math.round(currentDays / sizeMultiplier)));
  
  if (newDays !== currentDays) {
    daysCountSlider.value = newDays;
    daysCountValue.textContent = newDays;
  }
}

// Auto-adjust days count based on cell gap
function adjustDaysCountBasedOnGap() {
  const cellGapSlider = document.getElementById('cell-gap-slider');
  const daysCountSlider = document.getElementById('days-count-slider');
  const daysCountValue = document.getElementById('days-count-value');
  
  if (!cellGapSlider || !daysCountSlider || !daysCountValue) return;
  
  const cellGap = parseFloat(cellGapSlider.value);
  const currentDays = parseInt(daysCountSlider.value);
  
  // Calculate new days count based on gap increase
  // Smaller gaps allow more days, larger gaps require fewer days
  const gapMultiplier = cellGap / 0.2; // 0.2 is the new default
  const newDays = Math.max(7, Math.min(30, Math.round(currentDays / gapMultiplier)));
  
  if (newDays !== currentDays) {
    daysCountSlider.value = newDays;
    daysCountValue.textContent = newDays;
  }
}

// Auto-adjust cell size based on days count
function adjustSizeBasedOnDaysCount() {
  const daysCountSlider = document.getElementById('days-count-slider');
  const cellSizeSlider = document.getElementById('cell-size-slider');
  const cellSizeValue = document.getElementById('cell-size-value');
  
  if (!daysCountSlider || !cellSizeSlider || !cellSizeValue) return;
  
  const daysCount = parseInt(daysCountSlider.value);
  const currentSize = parseFloat(cellSizeSlider.value);
  
  // Calculate new cell size based on days count
  // More days = smaller cells, fewer days = larger cells
  const baseDays = 15; // Reference point
  const sizeAdjustment = baseDays / daysCount;
  const newSize = Math.max(0.7, Math.min(1.5, sizeAdjustment));
  
  if (Math.abs(newSize - currentSize) > 0.1) {
    cellSizeSlider.value = newSize.toFixed(1);
    cellSizeValue.textContent = newSize.toFixed(1);
  }
}

function openEditModal(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  currentEditingHabitId = habitId;
  const modal = document.getElementById('edit-habit-modal');
  const nameInput = document.getElementById('edit-habit-name');
  const colorOptions = document.querySelectorAll('.color-option');
  
  // Set current values
  nameInput.value = habit.name;
  
  // Clear previous selections
  colorOptions.forEach(option => option.classList.remove('selected'));
  
  // Select current color
  const currentColorOption = document.querySelector(`[data-color="${habit.color}"]`);
  if (currentColorOption) {
    currentColorOption.classList.add('selected');
  }
  
  // Show modal
  modal.style.display = 'flex';
  
  // Update color preview
  updateColorPreview(modal);
  
  nameInput.focus();
}

function closeEditModal() {
  const modal = document.getElementById('edit-habit-modal');
  modal.style.display = 'none';
  currentEditingHabitId = null;
}

function saveHabitChanges() {
  if (!currentEditingHabitId) return;
  
  const habit = habits.find(h => h.id === currentEditingHabitId);
  if (!habit) return;
  
  const nameInput = document.getElementById('edit-habit-name');
  const selectedColorOption = document.querySelector('.color-option.selected');
  
  const newName = nameInput.value.trim();
  const newColor = selectedColorOption ? selectedColorOption.dataset.color : habit.color;
  
  if (newName && newName !== habit.name) {
    habit.name = newName;
  }
  
  if (newColor !== habit.color) {
    habit.color = newColor;
  }
  
  // Re-render table and save
  renderHabitsTable();
  saveHabitsToStorage();
  closeEditModal();
}

function deleteHabitFromModal() {
  if (!currentEditingHabitId) return;
  
  if (confirm('Ви впевнені, що хочете видалити цю звичку?')) {
    habits = habits.filter(h => h.id !== currentEditingHabitId);
    renderHabitsTable();
    saveHabitsToStorage();
    closeEditModal();
  }
}

// Render habits table
function renderHabitsTable() {
  console.log('Rendering habits table with', habits.length, 'habits');
  console.log('HabitsTbody element:', habitsTbody);
  
  if (!habitsTbody) {
    console.error('habitsTbody not found!');
    return;
  }
  
  habitsTbody.innerHTML = '';
  habits.forEach((habit, index) => {
    console.log(`Rendering habit ${index + 1}:`, habit.name);
    const row = generateHabitRow(habit);
    habitsTbody.appendChild(row);
  });
  
  console.log('Habits table rendered successfully');
}

// Force refresh all headers
function refreshAllHeaders() {
  console.log('Refreshing all headers...');
  generateMonthHeaders();
  generateTableHeader();
}

// Save habits to localStorage
function saveHabitsToStorage() {
  localStorage.setItem('habits', JSON.stringify(habits));
}

// Load habits from localStorage
function loadHabitsFromStorage() {
  const saved = localStorage.getItem('habits');
  console.log('Saved habits from localStorage:', saved);
  
  if (saved) {
    try {
      habits = JSON.parse(saved);
      console.log('Parsed habits:', habits);
    } catch (e) {
      console.error('Error loading habits:', e);
    }
  } else {
    console.log('No saved habits found, using default habits');
  }
}

// Initialize habits table
function initHabitsTable() {
  console.log('Initializing habits table...');
  console.log('Habits before loading:', habits);
  
  // Ensure settings are loaded
  loadSettings();
  
  // Check if DOM elements exist
  if (!habitsTable || !habitsTbody) {
    console.error('Required DOM elements not found!');
    console.log('habitsTable:', habitsTable);
    console.log('habitsTbody:', habitsTbody);
    return;
  }
  
  loadHabitsFromStorage();
  console.log('Habits after loading:', habits);
  
  // Add small delay to ensure DOM is ready
  setTimeout(() => {
    console.log('Generating headers...');
    try {
      generateMonthHeaders();
      generateTableHeader();
      console.log('About to render habits table with', habits.length, 'habits');
      renderHabitsTable();
      console.log('Habits table initialized successfully');
    } catch (error) {
      console.error('Error initializing habits table:', error);
    }
  }, 100);
}

// Event listeners
if (addHabitBtn) {
  addHabitBtn.addEventListener('click', addHabit);
} else {
  console.error('addHabitBtn not found, cannot add event listener');
}

// Alternative initialization - try to initialize table after a longer delay
setTimeout(() => {
  console.log('Alternative initialization attempt...');
  if (habitsTable && habitsTbody) {
    console.log('DOM elements found, trying to initialize table...');
    initHabitsTable();
  } else {
    console.log('DOM elements still not found');
  }
}, 2000);

// Initialize habits table when app view is shown
function showAppView() {
  initHabitsTable();
}

document.getElementById('emailSignIn').onclick = async () => {
  const email = emailInp.value.trim();
  if (!email) { authMsg.textContent = 'Enter email:'; return; }
  authMsg.textContent = 'Sending magic link...';
  
  // Use localhost for development
  const redirectTo = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5500' 
    : window.location.origin;
    
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });
  authMsg.textContent = error ? `Error: ${error.message}` : 'Check your inbox!';
};

document.getElementById('googleSignIn').onclick = async () => {
  // Use localhost for development
  const redirectTo = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5500' 
    : window.location.origin;
    
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo }
  });
  if (error) authMsg.textContent = `Google sign-in error: ${error.message}`;
};

document.getElementById('logout').onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = '/'; // повернення на головну
};

// Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Load settings first
  loadSettings();
  
  // Edit modal
  const closeModalBtn = document.getElementById('close-modal');
  const editModal = document.getElementById('edit-habit-modal');
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeEditModal);
  }
  
  // Close edit modal when clicking outside
  if (editModal) {
    editModal.addEventListener('click', function(e) {
      if (e.target === editModal) {
        closeEditModal();
      }
    });
  }
  
  // Add modal
  const closeAddModalBtn = document.getElementById('close-add-modal');
  const addModal = document.getElementById('add-habit-modal');
  
  if (closeAddModalBtn) {
    closeAddModalBtn.addEventListener('click', closeAddModal);
  }
  
  // Close add modal when clicking outside
  if (addModal) {
    addModal.addEventListener('click', function(e) {
      if (e.target === addModal) {
        closeAddModal();
      }
    });
  }
  
  // Color picker for both modals
  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove selection from all options in the same modal
      const modal = this.closest('.modal');
      const modalColorOptions = modal.querySelectorAll('.color-option');
      modalColorOptions.forEach(opt => opt.classList.remove('selected'));
      // Add selection to clicked option
      this.classList.add('selected');
      
      // Update color preview in label
      updateColorPreview(modal);
    });
  });
  
  // Edit modal buttons
  const saveBtn = document.getElementById('save-habit-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveHabitChanges);
  }
  
  const deleteBtn = document.getElementById('delete-habit-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteHabitFromModal);
  }
  
  // Add modal buttons
  const createBtn = document.getElementById('create-habit-btn');
  if (createBtn) {
    createBtn.addEventListener('click', createHabit);
  }
  
  const cancelBtn = document.getElementById('cancel-add-habit-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeAddModal);
  }
  
  // Settings modal
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-modal');
  
  if (settingsBtn) {
    console.log('Settings button found, adding event listener');
    
    // Test if button is visible and clickable
    console.log('Settings button styles:', {
      display: getComputedStyle(settingsBtn).display,
      visibility: getComputedStyle(settingsBtn).visibility,
      opacity: getComputedStyle(settingsBtn).opacity,
      pointerEvents: getComputedStyle(settingsBtn).pointerEvents
    });
    
    settingsBtn.addEventListener('click', function(e) {
      console.log('Settings button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      openSettingsModal();
    });
    
    // Also try direct onclick for testing
    settingsBtn.onclick = function(e) {
      console.log('Direct onclick triggered!', e);
      e.preventDefault();
      e.stopPropagation();
      openSettingsModal();
    };
  } else {
    console.error('Settings button not found!');
  }
  
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
  }
  
  // Close settings modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener('click', function(e) {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });
  }
  
  // Settings form controls
  const spacingSlider = document.getElementById('spacing-slider');
  const spacingValue = document.getElementById('spacing-value');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');
  
  if (spacingSlider && spacingValue) {
    spacingSlider.addEventListener('input', function() {
      spacingValue.textContent = this.value;
      applyLivePreview();
    });
  }
  
  // Theme select live preview
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', applyLivePreview);
  }
  
  // Days count live preview
  const daysCountSlider = document.getElementById('days-count-slider');
  const daysCountValue = document.getElementById('days-count-value');
  if (daysCountSlider && daysCountValue) {
    daysCountSlider.addEventListener('input', function() {
      daysCountValue.textContent = this.value;
      adjustSizeBasedOnDaysCount();
      applyLivePreview();
    });
  }

  // Cell size slider
  const cellSizeSlider = document.getElementById('cell-size-slider');
  const cellSizeValue = document.getElementById('cell-size-value');
  if (cellSizeSlider && cellSizeValue) {
    cellSizeSlider.addEventListener('input', function() {
      cellSizeValue.textContent = this.value;
      adjustDaysCountBasedOnSize();
      applyLivePreview();
    });
  }

  // Cell gap slider
  const cellGapSlider = document.getElementById('cell-gap-slider');
  const cellGapValue = document.getElementById('cell-gap-value');
  if (cellGapSlider && cellGapValue) {
    cellGapSlider.addEventListener('input', function() {
      cellGapValue.textContent = this.value;
      adjustDaysCountBasedOnGap();
      applyLivePreview();
    });
  }
  
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }
  
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetSettings);
  }
  
  // Close modals with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (editModal.style.display !== 'none') {
        closeEditModal();
      } else if (addModal.style.display !== 'none') {
        closeAddModal();
      } else if (settingsModal.style.display !== 'none') {
        closeSettingsModal();
      }
    }
  });
});


function render(session) {
  const user = session?.user || null;
  if (user) {
    authView.hidden = true;
    appView.hidden = false;
    hello.textContent = `Hello, ${user.email || user.id}!`;
    debug.textContent = JSON.stringify(session, null, 2);
    // Initialize habits table when user is logged in
    console.log('User logged in, initializing habits table...');
    setTimeout(() => {
      console.log('About to call initHabitsTable...');
      initHabitsTable();
    }, 500); // Increased delay
  } else {
    authView.hidden = false;
    appView.hidden = true;
    debug.textContent = '';
    authMsg.textContent = '';
  }
}

(async () => {
  // Load settings first
  loadSettings();
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Initial session:', session);
  render(session);
  
  supabase.auth.onAuthStateChange((_event, newSession) => {
    console.log('Auth state changed:', _event, newSession);
    render(newSession);
  });
})();

// Function to get next available color for new habits
function getNextAvailableColor() {
  // Get colors from the actual modal (these should match the HTML)
  const modal = document.getElementById('add-habit-modal');
  const colorOptions = modal ? modal.querySelectorAll('.color-option') : [];
  
  // If we can't get colors from modal, use a predefined set
  const allColors = colorOptions.length > 0 
    ? Array.from(colorOptions).map(option => option.dataset.color)
    : [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff',
        '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7',
        '#a29bfe', '#fd79a8', '#fdcb6e', '#e17055', '#00b894', '#e84393', '#74b9ff'
      ];
  
  console.log('Available colors:', allColors);
  
  // Get currently used colors
  const usedColors = habits.map(habit => habit.color);
  console.log('Used colors:', usedColors);
  
  // Find colors that are not used
  const availableColors = allColors.filter(color => !usedColors.includes(color));
  console.log('Available unused colors:', availableColors);
  
  if (availableColors.length > 0) {
    // If there are unused colors, pick one that's visually different from the last used color
    if (usedColors.length > 0) {
      const lastUsedColor = usedColors[usedColors.length - 1];
      const lastUsedRgb = hexToRgb(lastUsedColor);
      
      // Find color with maximum distance from last used color
      let bestColor = availableColors[0];
      let maxDistance = 0;
      
      availableColors.forEach(color => {
        const colorRgb = hexToRgb(color);
        const distance = colorDistance(lastUsedRgb, colorRgb);
        if (distance > maxDistance) {
          maxDistance = distance;
          bestColor = color;
        }
      });
      
      console.log('Selected best color:', bestColor);
      return bestColor;
    } else {
      // If no colors used yet, return a random one from available
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      const selectedColor = availableColors[randomIndex];
      console.log('Selected random color:', selectedColor);
      return selectedColor;
    }
  } else {
    // If all colors are used, cycle through them with some randomness
    const randomIndex = Math.floor(Math.random() * allColors.length);
    const selectedColor = allColors[randomIndex];
    console.log('All colors used, selected random:', selectedColor);
    return selectedColor;
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to calculate color distance
function colorDistance(rgb1, rgb2) {
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

// Function to update color preview in modal labels
function updateColorPreview(modal) {
  const selectedColorOption = modal.querySelector('.color-option.selected');
  const previewElement = modal.querySelector('.selected-color-preview');
  
  if (selectedColorOption && previewElement) {
    const color = selectedColorOption.dataset.color;
    previewElement.style.backgroundColor = color;
    console.log('Updated color preview to:', color);
  }
}
