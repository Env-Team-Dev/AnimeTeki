import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import TebakKarakterAnime from '../views/TebakKarakterAnime.vue'
import TesKecocokan from '../views/TesKecocokan.vue'
import WhoIsIt from '../views/WhoIsIt.vue'

const routes = [
  { path: '/', name: 'LandingPage', component: LandingPage },
  { path: '/tebak-karakter-anime', name: 'TebakKarakterAnime', component: TebakKarakterAnime },
  { path: '/tes-kecocokan', name: 'TesKecocokan', component: TesKecocokan },
  { path: '/who-is-it', name: 'WhoIsIt', component: WhoIsIt }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router