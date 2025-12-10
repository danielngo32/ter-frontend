import Layout from '../layouts/Layout';
import DashboardPage from '../features/main/DashboardPage';
import TestVoiceOrderPage from '../features/ai/pages/test-voice-order';

export const mainRoutes = [
  {
    path: 'dashboard',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: 'test',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <TestVoiceOrderPage />,
      },
    ],
  },
];