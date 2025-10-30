import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import LoginView from './views/LoginView.vue';
import VerifyView from './views/VerifyView.vue';
import VerifyEmailView from './views/VerifyEmailView.vue';
import DashboardView from './views/DashboardView.vue';
import RegisterView from './views/RegisterView.vue';
import VerifyPhoneView from './views/VerifyPhoneView.vue';
import ForgotPasswordView from './views/ForgotPasswordView.vue';

const routes = [
  { path: '/', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/verify-phone', name: 'verify-phone', component: VerifyPhoneView },
  { path: '/verify', name: 'verify', component: VerifyView },
  { path: '/verify-email', name: 'verify-email', component: VerifyEmailView },
  { path: '/forgot', name: 'forgot', component: ForgotPasswordView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView },
];

const router = createRouter({ history: createWebHistory(), routes });

createApp(App).use(router).mount('#app');
