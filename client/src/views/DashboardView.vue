<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api';
import { useRouter } from 'vue-router';

const router = useRouter();
const authToken = ref<string>('');
const userEmail = ref<string>('');
const userName = ref<string>('');
const showToken = ref<boolean>(false);
const copied = ref<boolean>(false);
const isLoading = ref<boolean>(true);

function base64UrlToJson(b64url: string): any | null {
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadToken() {
  const t = localStorage.getItem('authToken') || '';
  authToken.value = t;
  if (!t) return;
  const parts = t.split('.');
  if (parts.length >= 2) {
    const payload = base64UrlToJson(parts[1]);
    const email = payload?.email || '';
    const nameFromToken = payload?.name || '';
    userEmail.value = email;
    userName.value = nameFromToken || (email ? String(email).split('@')[0] : 'Usuario');
    // Fallback: si el token antiguo no trae name/email, intenta obtenerlo del backend
    if ((!nameFromToken || nameFromToken === 'Usuario') && email) {
      api.get('/auth/debug-user', { params: { email } })
        .then(res => {
          const n = res?.data?.name || '';
          if (n) userName.value = n;
        })
        .catch(() => { /* ignora */ });
    }
  } else {
    userName.value = 'Usuario';
  }
  isLoading.value = false;
}

onMounted(() => {
  loadToken();
  if (!authToken.value) {
    setTimeout(() => {
      loadToken();
      if (!authToken.value) router.replace({ name: 'login' });
    }, 50);
  }
});

function logout() {
  localStorage.removeItem('authToken');
  router.replace({ name: 'login' });
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(authToken.value || '');
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    alert('No se pudo copiar el token');
  }
}

function toggleTokenVisibility() {
  showToken.value = !showToken.value;
}
</script>

<template>
  <div class="dash-bg">
    <!-- Decorativos -->
    <div class="bg-blobs" aria-hidden="true">
      <div class="blob a animate-float"></div>
      <div class="blob b animate-float-delayed"></div>
      <div class="blob c"></div>
    </div>

    <main class="dash-wrap">
      <section v-if="!isLoading" class="dash-card animate-fade-in">
        <!-- Header -->
        <header class="dash-header animate-slide-down">
          <div class="shield">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1>Bienvenido, {{ userName }}</h1>
          <p class="subtitle">Has iniciado sesión exitosamente</p>
        </header>

        <!-- Grid -->
        <section class="grid2">
          <!-- Usuario -->
          <article class="card">
            <div class="card-head">
              <div class="ico blue">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <h2>Información de usuario</h2>
            </div>
            <div class="info">
              <div>
                <p class="label">Nombre</p>
                <p class="value">{{ userName }}</p>
              </div>
              <div v-if="userEmail">
                <p class="label">Correo electrónico</p>
                <p class="value break">{{ userEmail }}</p>
              </div>
            </div>
          </article>

          <!-- Sesión -->
          <article class="card">
            <div class="card-head">
              <div class="ico green">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2>Estado de sesión</h2>
            </div>
            <div class="info">
              <div class="row">
                <span class="dot"></span>
                <p class="value">Sesión activa</p>
              </div>
              <div>
                <p class="label">Token guardado</p>
                <p class="value">Autenticación válida</p>
              </div>
            </div>
          </article>
        </section>

        <!-- Token -->
        <section class="card wide animate-slide-up-more-delayed">
          <div class="card-head between">
            <div class="row">
              <div class="ico purple">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              </div>
              <h2>Token de autenticación</h2>
            </div>
            <button class="ghost" @click="toggleTokenVisibility">
              <span v-if="!showToken">Mostrar</span>
              <span v-else>Ocultar</span>
            </button>
          </div>
          <div class="token-box">
            <pre v-if="showToken">{{ authToken }}</pre>
            <div v-else class="token-hidden">Token oculto por seguridad</div>
          </div>
          <button class="copy" @click="copyToken">
            <span v-if="!copied">Copiar token</span>
            <span v-else>Token copiado</span>
          </button>
        </section>

        <!-- Acciones -->
        <div class="actions animate-slide-up-most-delayed">
          <button class="logout" @click="logout">Cerrar sesión</button>
        </div>

        <!-- Badge -->
        <footer class="foot">
          <span class="shield-sm"></span>
          <span>Sesión protegida con autenticación segura</span>
        </footer>
      </section>

      <!-- Loading -->
      <div v-else class="loading">
        <div class="spinner"></div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  50% { transform: translateY(-20px) translateX(10px); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  50% { transform: translateY(20px) translateX(-10px); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-down {
  from { 
    opacity: 0;
    transform: translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-float {
  animation: float 20s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 25s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-fade-in-delayed {
  animation: fade-in 0.8s ease-out 0.6s both;
}

.animate-slide-down {
  animation: slide-down 0.6s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out 0.2s both;
}

.animate-slide-up-delayed {
  animation: slide-up 0.6s ease-out 0.3s both;
}

.animate-slide-up-more-delayed {
  animation: slide-up 0.6s ease-out 0.4s both;
}

.animate-slide-up-most-delayed {
  animation: slide-up 0.6s ease-out 0.5s both;
}
/* Layout y tema */

.bg-blobs { border-radius: 20px;position: absolute; inset: 0; pointer-events: none; overflow: hidden; background: #194e9e;}
.blob { position: absolute; border-radius: 999px; filter: blur(40px); opacity: .35; }
.blob.a { top: 10%; left: -120px; width: 380px; height: 380px; background: rgba(59,130,246,.18); }
.blob.b { bottom: 10%; right: -120px; width: 420px; height: 420px; background: rgba(34,211,238,.16); }
.blob.c { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 640px; height: 640px; background: rgba(0, 0, 0, 0.12); }

.dash-wrap { width: 100%; max-width: 1100px; position: relative; z-index: 1; }
.dash-card { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(12, 6, 6, 0.12); border-radius: 20px; backdrop-filter: blur(8px); padding: 28px; }

/* Header */
.dash-header { text-align: center; margin-bottom: 20px; }
.dash-header .shield { width: 72px; height: 72px; border-radius: 999px; display: grid; place-items: center; margin: 0 auto 12px; background: linear-gradient(135deg, #3b82f6, #06b6d4); box-shadow: 0 10px 30px rgba(59,130,246,.3); color: white; }
.dash-header h1 { color: #fff; font-size: 34px; margin: 0 0 4px; letter-spacing: -0.4px; }
.dash-header .subtitle { color: #ffffff; margin: 0; }

/* Grid 2 cols adaptable */
.grid2 { display: grid; gap: 16px; grid-template-columns: 1fr; margin-bottom: 16px; }
@media (min-width: 900px) { .grid2 { grid-template-columns: 1fr 1fr; } }

/* Tarjetas */
.card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; transition: background .2s ease; }
.card:hover { background: rgba(255,255,255,0.07); }
.card.wide { margin-top: 8px; }
.card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.card-head.between { justify-content: space-between; }
.card-head h2 { color: #fff; font-size: 18px; margin: 0; }
.ico { width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center; }
.ico.blue { background: rgba(59,130,246,.2); color: #60a5fa; }
.ico.green { background: rgba(34,197,94,.2); color: #34d399; }
.ico.purple { background: rgba(168,85,247,.2); color: #c084fc; }
.row { display: flex; align-items: center; gap: 8px; }
.info .label { color: #9ca3af; font-size: 13px; margin: 0 0 2px; }
.info .value { color: #fff; font-weight: 600; margin: 0 0 6px; }
.info .value.break { word-break: break-all; }
.dot { width: 8px; height: 8px; background: #34d399; border-radius: 999px; box-shadow: 0 0 0 3px rgba(52,211,153,.15); }

/* Token */
.token-box { background: rgba(0,0,0,.25); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 12px; margin-bottom: 10px; min-height: 84px; display: grid; }
.token-box pre { color: #d1d5db; white-space: pre-wrap; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 13px; line-height: 1.45; margin: 0; }
.token-hidden { color: #9ca3af; align-self: center; justify-self: center; }
.ghost { background: transparent; border: 1px solid rgba(255,255,255,.18); color: #e5e7eb; padding: 8px 12px; border-radius: 10px; cursor: pointer; }
.copy { width: 100%; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; border: none; padding: 12px; border-radius: 12px; box-shadow: 0 10px 24px rgba(124,58,237,.35); cursor: pointer; }

/* Actions */
.actions { display: grid; gap: 10px; grid-template-columns: 1fr; }
.logout { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 14px; border-radius: 12px; cursor: pointer; }

/* Footer */
.foot { margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #9ca3af; font-size: 14px; }
.foot .shield-sm { width: 14px; height: 14px; border-radius: 999px; background: #34d399; box-shadow: 0 0 0 3px rgba(52,211,153,.15); display: inline-block; }

/* Loading */
.loading { display: grid; place-items: center; min-height: 40vh; }
.spinner { width: 48px; height: 48px; border: 4px solid rgba(59,130,246,.3); border-top-color: #3b82f6; border-radius: 999px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

</style>
