import React from 'react';

import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/Login';

const PublicRoutes: React.FC = () => {
  return (
    <div className="min-h-full h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
};

export default PublicRoutes;
