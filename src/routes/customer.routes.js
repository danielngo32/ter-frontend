import React from "react";
import Layout from "../layouts/Layout";
import CustomersPage from "../features/crm/pages/CRMPage";
import CustomerDetailPage from "../features/crm/pages/CRMDetailPage";

export const customerRoutes = [
  {
    path: "customers",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <CustomersPage />,
      },
      {
        path: ":customerId",
        element: <CustomerDetailPage />,
      },
    ],
  },
];
