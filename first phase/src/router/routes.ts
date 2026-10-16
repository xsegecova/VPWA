const routes = [
  {
    path: '/',
    component: () => import('@/layouts/LoginLayout.vue'),
    children: [
      {path: '', component: () => import('@/pages/LoginPage.vue') },
    ],

  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/pages/AIpage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]
export default routes
