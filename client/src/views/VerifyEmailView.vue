<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { verifyEmailToken } from '../api';

const route = useRoute();
const router = useRouter();
const status = ref<'loading' | 'ok' | 'error'>('loading');

onMounted(async () => {
  const token = String(route.query.token || '');
  if (!token) {
    status.value = 'error';
    return;
  }
  try {
    const { ok } = await verifyEmailToken(token);
    status.value = ok ? 'ok' : 'error';
  } catch {
    status.value = 'error';
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2332] via-[#243447] to-[#2d3748] p-4 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div class="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float-delayed" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl" />
    </div>

    <!-- Main card -->
    <div class="w-full max-w-md relative animate-fade-in-up">
      <div class="bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
        <!-- Status icon with animation -->
        <div class="flex justify-center mb-6">
          <div class="relative">
            <!-- Loading state -->
            <div v-if="status === 'loading'" class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center animate-pulse">
              <svg class="w-10 h-10 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <!-- Success state -->
            <div v-else-if="status === 'ok'" class="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 flex items-center justify-center animate-scale-in">
              <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Error state -->
            <div v-else class="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-400/30 flex items-center justify-center animate-shake">
              <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Title and message -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-white mb-3 tracking-tight">
            Confirmación de correo
          </h1>
          
          <!-- Loading message -->
          <p v-if="status === 'loading'" class="text-gray-400 text-sm animate-pulse">
            Verificando tu correo electrónico...
          </p>
          
          <!-- Success message -->
          <p v-else-if="status === 'ok'" class="text-green-400 text-sm animate-fade-in">
            Tu correo fue verificado correctamente
          </p>
          
          <!-- Error message -->
          <p v-else class="text-red-400 text-sm animate-fade-in">
            El enlace es inválido o ha expirado
          </p>
        </div>

        <!-- Action button -->
        <div class="space-y-4">
          <router-link 
            :to="{ name: 'login' }"
            class="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <span>Ir al inicio de sesión</span>
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>
        </div>

        <!-- Security badge -->
        <div class="mt-6 pt-6 border-t border-white/5">
          <div class="flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Verificación segura de correo electrónico</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(-5deg); }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-float {
  animation: float 20s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 25s ease-in-out infinite;
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.5s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-out;
}
</style>
