<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { verifySms, resendSms, resendEmail } from '../api';

const router = useRouter();
const email = ref('');
const code = ref('');
const msg = ref('');
const busy = ref(false);

email.value = sessionStorage.getItem('reg_email') || '';

async function onSubmit(e: Event) {
  e.preventDefault();
  msg.value = '';
  if (!email.value || !code.value) {
    msg.value = 'Ingrese correo y código';
    return;
  }
  busy.value = true;
  try {
    const { ok } = await verifySms({ email: email.value.trim(), code: code.value.trim() });
    if (!ok) throw new Error('Código inválido');
    msg.value = 'Teléfono verificado. Ahora inicia sesión.';
    setTimeout(() => router.push({ name: 'login' }), 800);
  } catch (err: any) {
    msg.value = err?.response?.data?.message || err?.message || 'Error al verificar';
  } finally {
    busy.value = false;
  }
}

async function onResendSms() {
  if (!email.value) { msg.value = 'Proporciona el correo del registro'; return; }
  msg.value = '';
  busy.value = true;
  try {
    await resendSms({ email: email.value.trim() });
    msg.value = 'Código SMS reenviado.';
  } catch (err: any) {
    msg.value = err?.response?.data?.message || err?.message || 'No se pudo reenviar SMS';
  } finally { busy.value = false; }
}

async function onResendEmail() {
  if (!email.value) { msg.value = 'Proporciona el correo del registro'; return; }
  msg.value = '';
  busy.value = true;
  try {
    await resendEmail({ email: email.value.trim() });
    msg.value = 'Correo de verificación reenviado.';
  } catch (err: any) {
    msg.value = err?.response?.data?.message || err?.message || 'No se pudo reenviar el correo';
  } finally { busy.value = false; }
}
</script>

<template>
  <div class="verify-container">
    <div class="decorative-bg">
      <div class="float-element float-1"></div>
      <div class="float-element float-2"></div>
      <div class="float-element float-3"></div>
    </div>

    <div class="verify-card">
      <div class="shield-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      </div>

      <h1 class="title">Verificar teléfono</h1>
      <p class="subtitle">Te enviamos un código por SMS. Ingresa el código para verificar tu teléfono.</p>

      <form @submit="onSubmit" novalidate class="verify-form">
        <div class="form-group">
          <label class="form-label">Correo (usado en el registro)</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="form-input"
            placeholder="tu@correo.com"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Código SMS</label>
          <input 
            v-model="code" 
            inputmode="numeric" 
            pattern="[0-9]*" 
            maxlength="6"
            class="form-input code-input"
            placeholder="000000"
          />
        </div>

        <button :disabled="busy" type="submit" class="btn-primary">
          <span v-if="!busy">Verificar</span>
          <span v-else class="loading-spinner"></span>
        </button>

        <div class="resend-buttons">
          <button type="button" :disabled="busy" @click="onResendSms" class="btn-secondary">
            Reenviar SMS
          </button>
          <button type="button" :disabled="busy" @click="onResendEmail" class="btn-secondary">
            Reenviar correo
          </button>
        </div>

        <p v-if="msg" class="message" :class="{ success: msg.includes('verificado') || msg.includes('reenviado') }">
          {{ msg }}
        </p>
      </form>

      <div class="security-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Verificación segura</span>
      </div>
    </div>
  </div>
</template>

<style scoped>

.decorative-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.float-element {
  position: absolute;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  filter: blur(60px);
}

.float-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation: float 20s ease-in-out infinite;
}

.float-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  right: -80px;
  animation: float 15s ease-in-out infinite reverse;
}

.float-3 {
  width: 250px;
  height: 250px;
  top: 50%;
  right: 10%;
  animation: float 18s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

.verify-card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.shield-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
  border-radius: 20px;
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
  text-align: center;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 2rem;
  text-align: center;
}

.verify-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #cbd5e1;
  letter-spacing: 0.01em;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-input::placeholder {
  color: #64748b;
}

.form-input:focus {
  background: rgba(15, 23, 42, 0.8);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.code-input {
  font-size: 1.5rem;
  letter-spacing: 0.5em;
  text-align: center;
  font-weight: 600;
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.resend-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-secondary {
  flex: 1;
  min-width: 140px;
  padding: 0.75rem 1rem;
  background: rgba(51, 65, 85, 0.6);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(148, 163, 184, 0.3);
  color: #f1f5f9;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  padding: 0.875rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  text-align: center;
  margin: 0;
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.2);
  animation: slideIn 0.3s ease;
}

.message.success {
  background: rgba(34, 197, 94, 0.1);
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.2);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.security-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 10px;
  color: #86efac;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 640px) {
  .verify-card {
    padding: 2rem 1.5rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .resend-buttons {
    flex-direction: column;
  }

  .btn-secondary {
    min-width: 100%;
  }
}
</style>
