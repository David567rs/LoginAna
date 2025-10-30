<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../api';

const router = useRouter();
const email = ref('');
const password = ref('');
const method = ref<'email' | 'sms'>('email');
const msg = ref('');
const busy = ref(false);
const showPwd = ref(false);

const isEmailValid = computed(() => /.+@.+\..+/.test(email.value.trim()));
const isPasswordFilled = computed(() => password.value.length > 0);
const canSubmit = computed(() => isEmailValid.value && isPasswordFilled.value && !busy.value);

async function onSubmit(e: Event) {
  e.preventDefault();
  msg.value = '';
  if (!email.value || !password.value) {
    msg.value = 'Completa correo y Contraseña';
    return;
  }
  busy.value = true;
  try {
    const payload: any = { email: email.value.trim(), password: password.value };
    if (method.value) payload.method = method.value;
    const data = await login(payload);
    if (data.two_factor_required && data.challengeId) {
      sessionStorage.setItem('challengeId', data.challengeId);
      sessionStorage.setItem('email', email.value.trim());
      sessionStorage.setItem('method', String(method.value));
      await router.push({ name: 'verify' });
      return;
    }
    const token = data.access_token || data.token || data.jwt;
    if (!token) throw new Error('Respuesta invÃ¡lida');
    localStorage.setItem('authToken', token);
    await router.push({ name: 'dashboard' });
  } catch (err: any) {
    msg.value = err?.response?.data?.message || err?.message || 'Error en login';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login-bg" aria-hidden="true"></div>

  <!-- NUEVO: shell para centrar y evitar scroll -->
  <div class="shell">
    <section class="panel compact">
      <div class="panel-header">
        <div class="shield" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z"/>
          </svg>
        </div>
        <h1>Bienvenido</h1>
        <p class="subtitle">Ingresa tus credenciales para continuar</p>
      </div>

      <form @submit="onSubmit" novalidate class="form compact">
        <label class="field">
          <span class="field-label">Correo Electrónico</span>
          <div class="input-wrap">
            <span class="ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16v16H4z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 6l-10 7L2 6"/>
              </svg>
            </span>
            <input v-model.trim="email" type="email" placeholder="tu@email.com" autocomplete="username" required />
          </div>
        </label>

        <label class="field">
          <span class="field-label">Contraseña</span>
          <div class="input-wrap">
            <span class="ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11V7a4 4 0 118 0v4"/>
                <rect x="6" y="11" width="12" height="9" rx="2" ry="2" stroke-width="2"/>
              </svg>
            </span>
            <input class="pwd-input" v-model="password" :type="showPwd ? 'text' : 'password'" placeholder="••••••••" autocomplete="current-password" required />
            <button class="eye" type="button" @click="showPwd = !showPwd" :aria-label="showPwd ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showPwd" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 5.27L3.28 4 20 20.72 18.73 22l-2.57-2.57C14.98 19.78 13.54 20 12 20 5 20 2 13 2 13s.89-2.05 2.73-3.97L2 5.27zM12 8a5 5 0 00-4.58 3.04l6.54 6.54A5 5 0 0012 8zm10 5s-.56 1.29-1.81 2.79l-1.42-1.42C19.56 13.07 20 12 20 12s-2.86-6-8-6c-1.04 0-2 .2-2.85.55l-1.5-1.5A9.5 9.5 0 0112 4c7 0 10 8 10 8z"/></svg>
            </button>
          </div>
        </label>

        <!-- Compacto: label+chips en una sola fila -->
        <div class="segmented light compact">
          <span class="label">Segundo factor:</span>
      <div class="options">
          <button type="button" :class="{ active: method === 'email' }" @click="method = 'email'">Email</button>
          <button type="button" :class="{ active: method === 'sms' }" @click="method = 'sms'">SMS</button>
        </div>
        </div>

                <button class="primary compact" :disabled="!canSubmit" type="submit">
          <span v-if="!busy">Iniciar Sesión</span>
          <span v-else>Ingresando…</span>
        </button>
        <div class="row-links"><router-link to="/forgot">¿Olvidaste tu contraseña?</router-link><span class="dot">·</span><router-link to="/register">Crear cuenta</router-link></div>


        <p class="message" :class="{ error: msg }">{{ msg }}</p>

        <hr class="divider maybe-hide" />
        <div class="badge light maybe-hide">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-9 5.5V11c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7.5A10 10 0 0012 2zm-1 14l-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 6z"/></svg>
          <span>Protegido con verificación de dos factores</span>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
/* Fondo */


/* NUEVO: contenedor a viewport para evitar scroll */
.shell { 
  min-height: 94svh; 
  display: grid; 
  place-items: center; 
  padding: 16px; 
}

/* Panel compacto */
.panel { 
  background: rgba(26, 35, 50, 0.85); 
  backdrop-filter: blur(20px); 
  border: 1px solid rgba(255,255,255,0.1); 
  border-radius: 16px; box-shadow: 0 25px 70px rgba(0,0,0,.4), 0 0 100px rgba(59,130,246,.1); 
  padding: 40px; max-width: 480px; 
  margin: 0 auto; 
  animation: fadeIn .5s ease-out; 
}
.panel.compact { 
  padding: 24px; 
  max-width: 440px; 
}

/* Header mÃ¡s corto */
.panel-header { 
  display: grid; 
  place-items: center; 
  gap: 8px; margin-bottom: 16px; 
}
.shield { 
  background: linear-gradient(135deg, rgba(59,130,246,.15), rgba(147,51,234,.15)); 
  border: 1px solid rgba(59,130,246,.3);
   width: 52px; 
   height: 52px; 
   display: grid; 
   place-items: center; 
   border-radius: 14px; 
   color: #60a5fa; 
   box-shadow: 0 6px 18px rgba(59,130,246,.2); 
  }
h1 { margin: 4px 0 0; color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -.3px; }
.subtitle { color: #94a3b8; margin: 0; font-size: 13px; }

/* Form compacto */
.form { display: grid; gap: 20px; }
.form.compact { gap: 20px; }

.field-label { color: #60a5fa; font-weight: 600; font-size: 16px; display: block; margin-bottom: 16px; }
.input-wrap { position: relative; }
.input-wrap input { width: 100%; height: 44px; background: rgba(15,23,42,.6); border: 1px solid rgba(148,163,184,.2); border-radius: 10px; padding: 0 44px; color: #fff; font-size: 14px; transition: all .25s ease; }
.input-wrap input::placeholder { color: #64748b; }
.input-wrap input:focus { outline: none; border-color: #3b82f6; background: rgba(15,23,42,.8); box-shadow: 0 0 0 3px rgba(59,130,246,.15), 0 6px 18px rgba(59,130,246,.1); }
.ico { position: absolute; left: 14px; top: 0; bottom: 0; margin: auto; display: grid; place-items: center; color: #64748b; pointer-events: none; }
.pwd-input { padding-right: 40px; }
.eye { position: absolute; right: 8px; top: 0; bottom: 0; margin: auto; width: 30px; height: 30px; background: transparent; border: none; color: #64748b; cursor: pointer; display: grid; place-items: center; border-radius: 8px; transition: all .2s ease; }
.eye:hover { color: #94a3b8; background: rgba(148,163,184,.1); }

/* Segmentado mÃ¡s denso */
.segmented.light { display: grid; gap: 8px; }
.segmented.light.compact { grid-template-columns: auto 1fr; align-items: center; }
.segmented.light .label { color: #60a5fa; font-weight: 600; font-size: 13px; }
.segmented.light .options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.segmented.light .options > button { border: 1px solid rgba(148,163,184,.2); background: rgba(15,23,42,.4); color: #94a3b8; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all .25s ease; font-size: 13px; line-height: 1; }
.segmented.light .options > button:hover { transform: translateY(-1px); border-color: rgba(59,130,246,.4); background: rgba(15,23,42,.6); box-shadow: 0 6px 16px rgba(59,130,246,.15); }
.segmented.light .options > button.active { border-color: #3b82f6; background: linear-gradient(135deg, rgba(59,130,246,.25), rgba(147,51,234,.15)); color: #60a5fa; box-shadow: 0 6px 18px rgba(59,130,246,.25), 0 0 0 3px rgba(59,130,246,.1); }

/* BotÃ³n mÃ¡s corto */
.primary { width: 100%; height: 54px; border: none; border-radius: 12px; color: #fff; font-weight: 700; font-size: 16px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 12px 28px rgba(59,130,246,.4); cursor: pointer; transition: all .3s ease; margin-top: 6px; }
.primary.compact { height: 48px; border-radius: 10px; font-size: 15px; }
.primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(59,130,246,.45); }
.primary:active:not(:disabled) { transform: translateY(0); }
.primary:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; transform: none; }

/* Enlaces en una lÃ­nea */
.row-links { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 4px; font-size: 13px; }
.row-links a { color: #60a5fa; text-decoration: none; }
.row-links a:hover { color: #3b82f6; text-decoration: underline; }
.dot { color: #64748b; }

/* Mensajes y extras */
.divider { border: none; border-top: 1px solid rgba(148,163,184,.15); margin: -15px 0 20px; }
.badge.light { display: flex; align-items: center; justify-content: center; gap: 6px; color: #94a3b8; font-size: 15px; background: rgba(59,130,246,.08); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(59,130,246,.15); }
.badge.light svg { color: #60a5fa; }
.muted { color: #94a3b8; margin: 6px 0; }
.small { font-size: 13px; }
.center { text-align: center; }
.message { min-height: 18px; text-align: center; font-size: 13px; margin-top: 4px; }
.message.error { color: #f87171; background: rgba(248,113,113,.1); padding: 8px; border-radius: 8px; border: 1px solid rgba(248,113,113,.2); }

/* Oculta extras cuando el alto es pequeÃ±o */
@media (max-height: 740px) {
  .maybe-hide { display: none; }
}

/* Ajustes globales existentes */
:global(.card) { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
:global(.container) { padding: 24px !important; }

/* AnimaciÃ³n */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
