const { url, anonKey } = window.__SUPABASE;
const supabase = window.supabase.createClient(url, anonKey);

const authView = document.getElementById('auth-view');
const appView  = document.getElementById('app-view');
const authMsg  = document.getElementById('authMessage');
const emailInp = document.getElementById('email');
const hello    = document.getElementById('hello');
const debug    = document.getElementById('debug');

// Theme management
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.querySelector('.theme-icon');

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
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Initialize theme
function initTheme() {
  const savedTheme = getCookie('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Default to dark theme as requested
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'dark');
  setTheme(initialTheme);
}

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

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
  
  for (let i = 14; i >= 0; i--) {
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
    <span class="edit" onclick="editHabit(${habit.id})">✏️</span>
    <span class="delete" onclick="deleteHabit(${habit.id})">🗑️</span>
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
  const name = prompt('Назва звички:');
  if (!name) return;
  
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
  const color = colors[habits.length % colors.length];
  
  const newHabit = {
    id: Date.now(),
    name: name.trim(),
    color: color,
    days: {}
  };
  
  habits.push(newHabit);
  
  // Regenerate headers and table
  generateMonthHeaders();
  generateTableHeader();
  renderHabitsTable();
  saveHabitsToStorage();
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
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Initial session:', session);
  render(session);
  supabase.auth.onAuthStateChange((_event, newSession) => {
    console.log('Auth state changed:', _event, newSession);
    render(newSession);
  });
})();
