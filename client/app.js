(() => {
  const form = document.getElementById('loginForm');
  const emailEl = document.getElementById('email');
  const pwdEl = document.getElementById('password');
  const msgEl = document.getElementById('message');
  const btn = document.getElementById('submitBtn');

  function setMessage(text, type = '') {
    msgEl.textContent = text || '';
    msgEl.className = `message ${type}`.trim();
  }

  async function login(email, password) {
    const url = `${window.APP_CONFIG.API_BASE}/auth/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    // Intenta parsear JSON, aunque haya error
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (!res.ok) {
      const detail = data?.message || text || `Error ${res.status}`;
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    return data;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('');
    const email = emailEl.value.trim();
    const password = pwdEl.value;
    if (!email || !password) {
      setMessage('Completa correo y contraseña', 'error');
      return;
    }
    btn.disabled = true;
    try {
      const data = await login(email, password);
      const token = data.access_token || data.token || data.jwt;
      if (!token) throw new Error('Respuesta de login inválida: falta token');
      localStorage.setItem('authToken', token);
      setMessage('Ingreso exitoso, redirigiendo…', 'success');
      window.location.href = 'dashboard.html';
    } catch (err) {
      setMessage(err?.message || 'No se pudo iniciar sesión', 'error');
    } finally {
      btn.disabled = false;
    }
  });
})();

