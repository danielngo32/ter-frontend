import React from 'react';
import Layout from '../layouts/Layout';
import ProductsPage from '../features/product/pages/ProductsPage';
import QRBarcodePage from '../features/product/pages/QRBarcodePage';
import ProductDetailPage from '../features/product/pages/ProductDetailPage';
import InventoryPage from '../features/product/pages/InventoryPage';

export const productRoutes = [
  {
    path: 'products',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ProductsPage />,
      },
      {
        path: 'barcode-scanner',
        element: <QRBarcodePage />,
      },
      {
        path: ':productId',
        element: <ProductDetailPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
    ],
  },
];

