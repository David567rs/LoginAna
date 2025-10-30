<template>
  <main class="container">
    <section class="card">
      <router-view />
    </section>
  </main>
</template>

<style>
:root {
  --bg: #4a72cf;
  --card: #111827;
  --text: #e5e7eb;
  --muted: #9ca3af;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --danger: #ef4444;
}
* { box-sizing: border-box; }
html, body, #app { height: 100%; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial;
  background: radial-gradient(1200px 600px at 10% -10%, #b5c8e4, transparent),
              radial-gradient(800px 400px at 90% 110%, #b5c8e4, transparent),
              var(--bg);
  color: var(--text);
}
.container { min-height: 100%; display: grid; place-items: center; padding: 2rem; }
.card { width: 100%; max-width: 420px; padding: 2rem; background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; backdrop-filter: blur(8px); box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
form { display: grid; gap: 0.9rem; }
label { display: grid; gap: 0.35rem; font-size: 0.95rem; color: var(--muted); }
input, select { width: 100%; padding: 0.7rem 0.85rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: var(--text); }
input:focus, select:focus { outline: 2px solid rgba(59,130,246,0.6); outline-offset: 2px; }
button { margin-top: 0.5rem; padding: 0.8rem 1rem; border: none; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--primary-hover)); color: white; font-weight: 600; cursor: pointer; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.message { margin-top: 0.5rem; min-height: 1.25rem; }
.message.error { color: var(--danger); }
.message.success { color: #34d399; }
</style>

