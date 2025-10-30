<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '../api';

const router = useRouter(); // Moved to top level as per lint rule

const name = ref('');
const email = ref('');
const password = ref('');
const confirm = ref('');
const phone = ref('');
const showPwd = ref(false);
const showConfirm = ref(false);
const msg = ref('');
const busy = ref(false);
const showRules = ref(true);

// Reglas de contraseña
const hasLen = computed(() => password.value.length >= 8);
const hasUpper = computed(() => /[A-Z]/.test(password.value));
const hasNumber = computed(() => /\d/.test(password.value));
const hasSpecial = computed(() => /[^A-Za-z0-9]/.test(password.value));
const matchesConfirm = computed(() => password.value === confirm.value && password.value.length > 0);
const strengthCount = computed(() => [hasLen.value, hasUpper.value, hasNumber.value, hasSpecial.value].filter(Boolean).length);
const strengthPct = computed(() => (strengthCount.value / 4) * 100);
const canSubmit = computed(() =>
  name.value.trim().length >= 2 &&
  /.+@.+\..+/.test(email.value.trim()) &&
  hasLen.value && hasUpper.value && hasNumber.value && hasSpecial.value &&
  matchesConfirm.value &&
  /^\+[1-9]\d{7,14}$/.test(phone.value.trim()) &&
  !busy.value,
);

async function onSubmit(e: Event) {
  e.preventDefault();
  msg.value = '';
  if (!name.value || name.value.trim().length < 2) {
    msg.value = 'Nombre (min 2 caracteres) es obligatorio';
    return;
  }
  if (!email.value || !password.value) {
    msg.value = 'Correo y contraseña son obligatorios';
    return;
  }
  if (!hasLen.value || !hasUpper.value || !hasNumber.value || !hasSpecial.value) {
    msg.value = 'La contraseña debe tener 8+, 1 mayúscula, 1 número y 1 especial';
    return;
  }
  if (!matchesConfirm.value) {
    msg.value = 'Las contraseñas no coinciden';
    return;
  }
  busy.value = true;
  try {
    // No enviar confirm al backend (ValidationPipe rechaza campos extra)
    await register({ name: name.value.trim(), email: email.value.trim(), password: password.value, phone: phone.value.trim() || undefined });
    sessionStorage.setItem('reg_email', email.value.trim());
    msg.value = 'Registro creado. Revisa tu correo para confirmar y verifica tu SMS.';
    setTimeout(() => router.push({ name: 'verify-phone' }), 800);
  } catch (err: any) {
    msg.value = err?.response?.data?.message || err?.message || 'Error al registrar';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="register-container">
    <!-- Added decorative background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div class="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-delayed" />
    </div>

    <!-- Added elegant card wrapper with backdrop blur -->
    <div class="register-card">
      <div class="card-header">
        <h1 class="title">Crear cuenta</h1>
        <p class="subtitle">Completa tus datos para registrarte</p>
      </div>

      <form @submit="onSubmit" novalidate class="register-form">
        <!-- Styled input fields with elegant design -->
        <label class="input-label">
          <span class="label-text">Nombre</span>
          <input v-model="name" type="text" required minlength="2" class="input-field" placeholder="Tu nombre completo" />
        </label>

        <label class="input-label">
          <span class="label-text">Correo</span>
          <input v-model="email" type="email" required class="input-field" placeholder="tu@email.com" />
        </label>

        <label class="input-label">
          <div class="label-row">
            <span class="label-text">Contraseña</span>
            <button class="icon-btn" type="button" @click="showRules = !showRules" :aria-label="showRules ? 'Ocultar requisitos' : 'Ver requisitos'" title="Requisitos de contraseña">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2zm0 15a1.25 1.25 0 111.25-1.25A1.252 1.252 0 0112 17zm1.5-4.5a1.5 1.5 0 00-3 0v.25a1 1 0 002 0V12.5a.5.5 0 01.5-.5h.25a1 1 0 000-2H13a2.5 2.5 0 00-2.5 2.5v.25a2 2 0 104 0z"/></svg>
            </button>
          </div>
          <div class="pwd-row">
            <input
              v-model="password"
              :type="showPwd ? 'text' : 'password'"
              required minlength="8"
              placeholder="Mín 8, 1 mayúscula, 1 número, 1 especial"
              class="input-field"
            />
            <button class="icon-btn" type="button" @click="showPwd = !showPwd" :aria-label="showPwd ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showPwd" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2 5.27L3.28 4 20 20.72 18.73 22l-2.57-2.57C14.98 19.78 13.54 20 12 20 5 20 2 13 2 13s.89-2.05 2.73-3.97L2 5.27zM12 8a5 5 0 00-4.58 3.04l6.54 6.54A5 5 0 0012 8zm10 5s-.56 1.29-1.81 2.79l-1.42-1.42C19.56 13.07 20 12 20 12s-2.86-6-8-6c-1.04 0-2 .2-2.85.55l-1.5-1.5A9.5 9.5 0 0112 4c7 0 10 8 10 8z"/></svg>
            </button>
          </div>
        </label>

        <label class="input-label">
          <span class="label-text">Confirmar contraseña</span>
          <div class="pwd-row">
            <input v-model="confirm" :type="showConfirm ? 'text' : 'password'" required class="input-field" placeholder="Confirma tu contraseña" />
            <button class="icon-btn" type="button" @click="showConfirm = !showConfirm" :aria-label="showConfirm ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2 5.27L3.28 4 20 20.72 18.73 22l-2.57-2.57C14.98 19.78 13.54 20 12 20 5 20 2 13 2 13s.89-2.05 2.73-3.97L2 5.27zM12 8a5 5 0 00-4.58 3.04l6.54 6.54A5 5 0 0012 8zm10 5s-.56 1.29-1.81 2.79l-1.42-1.42C19.56 13.07 20 12 20 12s-2.86-6-8-6c-1.04 0-2 .2-2.85.55l-1.5-1.5A9.5 9.5 0 0112 4c7 0 10 8 10 8z"/></svg>
            </button>
          </div>
        </label>

        <!-- Styled password strength indicator -->
        <div v-show="showRules" class="strength-container">
          <div class="strength-bar">
            <div class="strength-fill" :style="{ width: strengthPct + '%'}"></div>
          </div>
          <ul class="rules-list">
            <li :class="{ ok: hasLen }">
              <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Mínimo 8 caracteres
            </li>
            <li :class="{ ok: hasUpper }">
              <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Una mayúscula
            </li>
            <li :class="{ ok: hasNumber }">
              <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Un número
            </li>
            <li :class="{ ok: hasSpecial }">
              <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Un caracter especial
            </li>
            <li :class="{ ok: matchesConfirm }">
              <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Las contraseñas coinciden
            </li>
          </ul>
        </div>

        <label class="input-label">
          <span class="label-text">Teléfono (para SMS)</span>
          <input v-model="phone" type="tel" placeholder="e.g. +5215512345678" required class="input-field" />
        </label>

        <!-- Styled submit button with gradient -->
        <button :disabled="!canSubmit" type="submit" class="submit-btn">
          {{ busy ? 'Registrando…' : 'Registrar' }}
        </button>

        <!-- Styled error message -->
        <p v-if="msg" class="error-message">{{ msg }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Added elegant dark theme styles matching login design */


@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(20px) scale(1.05); }
}

.animate-float {
  animation: float 8s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 10s ease-in-out infinite;
}

.absolute {
  position: absolute;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.overflow-hidden {
  overflow: hidden;
}

.pointer-events-none {
  pointer-events: none;
}

.register-card {
  width: 300%;
  max-width: 480px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 10;
}

.card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0.5rem 0;
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 0.95rem;
  color: #94a3b8;
  margin: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.input-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #cbd5e1;
  letter-spacing: 0.01em;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  color: #f8fafc;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  outline: none;
}

.input-field::placeholder {
  color: #64748b;
}

.input-field:focus {
  background: rgba(15, 23, 42, 0.8);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.pwd-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.icon-btn {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  padding: 0.625rem;
  border-radius: 10px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.3s ease;
  height: 44px;
  width: 44px;
}

.icon-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #3b82f6;
}

.strength-container {
  margin: -0.5rem 0 0;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.strength-bar {
  height: 8px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.strength-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
  width: 0%;
  transition: width 0.3s ease;
  border-radius: 999px;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.rules-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  transition: color 0.3s ease;
}

.rules-list li.ok {
  color: #34d399;
}

.check-icon {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.rules-list li.ok .check-icon {
  opacity: 1;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  text-align: center;
  color: #f87171;
  font-size: 0.875rem;
  margin: -0.5rem 0 0;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

@media (max-width: 640px) {
  .register-card {
    padding: 2rem 1.5rem;
  }
  
  .title {
    font-size: 1.75rem;
  }
}
</style>
