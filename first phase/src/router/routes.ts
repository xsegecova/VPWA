const routes = [
  {
    path: '/',
    component: () => import('@/layouts/LoginLayout.vue'),
    children: [
      {path: '', component: () => import('@/pages/LoginPage.vue') },
    ],

  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@/pages/Chat-page.vue') },
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
