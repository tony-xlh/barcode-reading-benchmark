import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/project/:name',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ProjectPage.vue') }],
  },
  {
    path: '/project/:name/:imageName/:engine?',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/DetailsPage.vue') }],
  },
  {
    path: '/project/:name/comparison',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/ComparisonPage.vue') }],
  },
  {
    path: '/project/:name/settings',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/SettingsPage.vue') }],
  },
  {
    path: '/project/:name/livescanner',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/LiveScanner.vue') }],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
