import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import Farm from '../views/FarmView.vue'
import Home from '../views/HomeView.vue'
import Forest from '../views/ForestView.vue'
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/farm', component: Farm },
  { path: '/home', component: Home },
  { path: '/forest', component: Forest },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
