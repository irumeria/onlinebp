import Vue from 'vue'
import VueRouter from 'vue-router'
import Train from '../views/Train.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Train',
    component: Train
  },
]

const router = new VueRouter({
  routes
})

export default router
