import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Dashboard from '../components/Dashboard.jsx';
const DashboardPage = () => {
  const { state } = useLocation();
  const { rawTable, title } = state || {};

  return (
    <Dashboard rawTable={rawTable} title={title} />
  );
};

export default DashboardPage;
