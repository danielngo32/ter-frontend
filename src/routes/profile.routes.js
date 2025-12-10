import ProifleLayout from '../layouts/ProifleLayout';
import InformationPage from '../features/profile/pages/InformationPage';
import SettingsPage from '../features/profile/pages/SettingsPage';
import SecurityPage from '../features/profile/pages/SecurityPage';
import DevicesPage from '../features/profile/pages/DevicesPage';

export const profileRoutes = [
  {
    path: 'me',
    element: <ProifleLayout />,
    children: [
      {
        index: true,
        element: <InformationPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'security',
        element: <SecurityPage />,
      },
      {
        path: 'devices',
        element: <DevicesPage />,
      },
    ],
  },
];

