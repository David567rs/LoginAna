<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { forgotPassword, verifyReset, resetPassword } from '../api';

const router = useRouter();
const email = ref('');
const method = ref<'email' | 'sms'>('email');
const challengeId = ref('');
const code = ref('');
const resetToken = ref('');
const pwd = ref('');
const confirm = ref('');
const busy = ref(false);
const msg = ref('');

const hasLen = computed(() => pwd.value.length >= 8);
const hasUpper = computed(() => /[A-Z]/.test(pwd.value));
const hasNumber = computed(() => /\d/.test(pwd.value));
const hasSpecial = computed(() => /[^A-Za-z0-9]/.test(pwd.value));
const matches = computed(() => pwd.value === confirm.value && pwd.value.length > 0);

const step = ref<1 | 2 | 3>(1); // 1: pedir código, 2: verificar, 3: nueva contraseña

async function requestCode() {
  msg.value = '';
  if (!/.+@.+\..+/.test(email.value.trim())) { msg.value = 'Correo inválido'; return; }
  busy.value = true;
  try {
    const { challengeId: chId } = await forgotPassword({ email: email.value.trim(), method: method.value });
    challengeId.value = chId || '';
    step.value = 2;
  } catch (e: any) {
    msg.value = e?.response?.data?.message || 'No se pudo enviar el código';
  } finally { busy.value = false; }
}

async function verifyCode() {
  msg.value = '';
  if (!challengeId.value || !/^\d{6}$/.test(code.value)) { msg.value = 'Código inválido'; return; }
  busy.value = true;
  try {
    const { reset_token } = await verifyReset({ challengeId: challengeId.value, code: code.value });
    resetToken.value = reset_token;
    step.value = 3;
  } catch (e: any) {
    msg.value = e?.response?.data?.message || 'Código incorrecto o expirado';
  } finally { busy.value = false; }
}

async function submitNewPassword() {
  msg.value = '';
  if (!hasLen.value || !hasUpper.value || !hasNumber.value || !hasSpecial.value || !matches.value) {
    msg.value = 'La contraseña no cumple los requisitos';
    return;
  }
  busy.value = true;
  try {
    await resetPassword({ token: resetToken.value, password: pwd.value });
    alert('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
    router.replace({ name: 'login' });
  } catch (e: any) {
    msg.value = e?.response?.data?.message || 'No se pudo actualizar la contraseña';
  } finally { busy.value = false; }
}
</script>

<template>
  <!-- Fondo y decorativos (mismos colores/animaciones) -->
  <div class="bg-layer" aria-hidden="true"></div>
  <div class="decor" aria-hidden="true">
    <div class="blob a animate-float"></div>
    <div class="blob b animate-float-delayed"></div>
    <div class="blob c"></div>
  </div>

  <!-- Contenedor centrado -->
  <div class="shell">
    <section class="panel">
      <!-- Header -->
      <header class="head">
        <div class="badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h1>Recuperar contraseña</h1>
        <p class="sub">
          <span v-if="step === 1">Elige cómo quieres recibir tu código</span>
          <span v-else-if="step === 2">Ingresa el código que recibiste</span>
          <span v-else>Crea tu nueva contraseña</span>
        </p>
      </header>

      <!-- Indicador de progreso -->
      <div class="progress">
        <div v-for="i in 3" :key="i" class="bar" :class="{ on: step >= i }"></div>
      </div>

      <form @submit.prevent class="form">
        <Transition name="fade" mode="out-in">
          <!-- Paso 1: Solicitar código -->
          <div v-if="step === 1" key="step1" class="stack">
            <label class="field">
              <span class="label">Correo</span>
              <div class="input"><input v-model.trim="email" type="email" placeholder="tu@email.com" required /></div>
            </label>
            <div class="segmented">
              <span class="label">Recibir código por</span>
              <div class="opts">
                <button type="button" :class="{ active: method==='email' }" @click="method='email'">Email</button>
                <button type="button" :class="{ active: method==='sms' }" @click="method='sms'">SMS</button>
              </div>
            </div>
            <button type="button" class="primary" :disabled="busy" @click="requestCode">
              <span v-if="busy" class="spin"></span>
              <span>{{ busy ? 'Enviando…' : 'Enviar código' }}</span>
            </button>
          </div>

          <!-- Paso 2: Verificar código -->
          <div v-else-if="step === 2" key="step2" class="stack">
            <label class="field">
              <span class="label">Código</span>
              <div class="input"><input v-model="code" inputmode="numeric" maxlength="6" placeholder="123456" /></div>
            </label>
            <button type="button" class="primary" :disabled="busy" @click="verifyCode">
              <span v-if="busy" class="spin"></span>
              <span>{{ busy ? 'Verificando…' : 'Verificar' }}</span>
            </button>
          </div>

          <!-- Paso 3: Nueva contraseña -->
          <div v-else key="step3" class="stack">
            <div class="grid2">
              <label class="field"><span class="label">Nueva contraseña</span><div class="input"><input v-model="pwd" type="password" placeholder="••••••••" /></div></label>
              <label class="field"><span class="label">Confirmar contraseña</span><div class="input"><input v-model="confirm" type="password" placeholder="••••••••" /></div></label>
            </div>
            <div class="rules">
              <p>La contraseña debe contener:</p>
              <ul>
                <li :class="{ ok: hasLen }">Mínimo 8 caracteres</li>
                <li :class="{ ok: hasUpper }">Una letra mayúscula</li>
                <li :class="{ ok: hasNumber }">Un número</li>
                <li :class="{ ok: hasSpecial }">Un carácter especial</li>
                <li :class="{ ok: matches }">Las contraseñas coinciden</li>
              </ul>
            </div>
            <button type="button" class="primary" :disabled="busy" @click="submitNewPassword">
              <span v-if="busy" class="spin"></span>
              <span>{{ busy ? 'Actualizando…' : 'Actualizar contraseña' }}</span>
            </button>
          </div>
        </Transition>
        

        <Transition name="fade">
          <div v-if="msg" class="error">{{ msg }}</div>
        </Transition>
      </form>

      <div class="foot"><button @click="router.push({ name: 'login' })">Volver al inicio de sesión</button></div>
       <div class="secure">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-9 5.5V11c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7.5A10 10 0 0012 2zm-1 14l-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 6z"/></svg>
      <span>Recuperación segura de contraseña</span>
    </div>
    </section>

   
  </div>
</template>

<style scoped>

/* Centro y panel */
.shell { min-height: 94svh; display: grid; place-items: center; padding: 16px; }
.panel { width: 100%; max-width: 520px; background: rgba(26,35,50,.85); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.1); border-radius: 18px; padding: 22px; box-shadow: 0 25px 70px rgba(0,0,0,.35), 0 0 100px rgba(59,130,246,.12); }
.head { display: grid; place-items: center; gap: 6px; margin-bottom: 8px; }
.badge { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(59,130,246,.15), rgba(147,51,234,.15)); border: 1px solid rgba(59,130,246,.3); color: #60a5fa; box-shadow: 0 6px 18px rgba(59,130,246,.2); }
h1 { margin: 4px 0 0; color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -.3px; }
.sub { color: #94a3b8; margin: 0; font-size: 13px; }

.progress { display: grid; grid-auto-flow: column; gap: 8px; justify-content: center; margin: 10px 0 14px; }
.bar { width: 28px; height: 6px; border-radius: 999px; background: rgba(148,163,184,.25); }
.bar.on { background: linear-gradient(135deg, #3b82f6, #06b6d4); }

.form { display: grid; gap: 14px; }
.stack { display: grid; gap: 14px; }
.field .label { color: #60a5fa; font-weight: 600; font-size: 13px; display: block; margin-bottom: 6px; }
.input input { width: 100%; height: 44px; background: rgba(15,23,42,.6); border: 1px solid rgba(148,163,184,.2); border-radius: 10px; padding: 0 12px; color: #fff; font-size: 14px; }

.segmented .label { color: #94a3b8; font-weight: 600; font-size: 13px; }
.segmented .opts { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }
.segmented .opts > button { border: 1px solid rgba(148,163,184,.2); background: rgba(15,23,42,.4); color: #94a3b8; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all .25s ease; font-size: 13px; }
.segmented .opts > button.active { border-color: #3b82f6; background: linear-gradient(135deg, rgba(59,130,246,.25), rgba(147,51,234,.15)); color: #60a5fa; box-shadow: 0 6px 16px rgba(59,130,246,.25), 0 0 0 3px rgba(59,130,246,.1); }

.primary { width: 100%; height: 48px; border: none; border-radius: 12px; color: #fff; font-weight: 700; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 12px 28px rgba(59,130,246,.4); cursor: pointer; }
.spin { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 999px; display: inline-block; margin-right: 6px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.grid2 { display: grid; gap: 10px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .grid2 { grid-template-columns: 1fr 1fr; } }

.rules { border: 1px solid rgba(148,163,184,.2); border-radius: 12px; padding: 10px; }
.rules p { color: #9ca3af; margin: 0 0 6px; font-size: 12px; }
.rules ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
.rules li { color: #94a3b8; font-size: 13px; }
.rules li.ok { color: #10b981; }

.error { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.25); color: #f87171; padding: 8px; border-radius: 10px; text-align: center; font-size: 13px; }
.foot { margin-top: 10px; text-align: center; }
.foot button { color: #94a3b8; background: transparent; border: none; cursor: pointer; }
.foot button:hover { color: #fff; }
.secure { margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #94a3b8; font-size: 13px; }

/* Animaciones existentes que ya usabas */
@keyframes float { 0%,100%{ transform: translateY(0) rotate(0deg);} 50%{ transform: translateY(-20px) rotate(5deg);} }
@keyframes float-delayed { 0%,100%{ transform: translateY(0) rotate(0deg);} 50%{ transform: translateY(-30px) rotate(-5deg);} }
.animate-float { animation: float 8s ease-in-out infinite; }
.animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
.fade-enter-active, .fade-leave-active { transition: all .3s ease; }
.fade-enter-from { opacity: 0; transform: translateX(20px); }
.fade-leave-to { opacity: 0; transform: translateX(-20px); }
</style>

