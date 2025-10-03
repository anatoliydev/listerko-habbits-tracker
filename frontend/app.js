const { url, anonKey } = window.__SUPABASE;
const supabase = window.supabase.createClient(url, anonKey);

const authView = document.getElementById('auth-view');
const appView  = document.getElementById('app-view');
const authMsg  = document.getElementById('authMessage');
const emailInp = document.getElementById('email');
const hello    = document.getElementById('hello');
const debug    = document.getElementById('debug');

document.getElementById('emailSignIn').onclick = async () => {
  const email = emailInp.value.trim();
  if (!email) { authMsg.textContent = 'Enter email'; return; }
  authMsg.textContent = 'Sending magic link...';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  authMsg.textContent = error ? `Error: ${error.message}` : 'Check your inbox!';
};

document.getElementById('googleSignIn').onclick = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) authMsg.textContent = `Google sign-in error: ${error.message}`;
};

document.getElementById('logout').onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = '/'; // повернення на головну
};

document.getElementById('mini-form').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('taskName').value.trim();
  if (!name) return;
  debug.textContent = `Saved locally: ${name}\n(Пізніше тут буде бекенд API)`;
};

function render(session) {
  const user = session?.user || null;
  if (user) {
    authView.hidden = true;
    appView.hidden = false;
    hello.textContent = `Hello, ${user.email || user.id}!`;
    debug.textContent = JSON.stringify(session, null, 2);
  } else {
    authView.hidden = false;
    appView.hidden = true;
    debug.textContent = '';
    authMsg.textContent = '';
  }
}

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  render(session);
  supabase.auth.onAuthStateChange((_event, newSession) => render(newSession));
})();
