import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InvitePage } from './pages/InvitePage.js';
import { AdminLoginPage } from './pages/AdminLoginPage.js';
import { AdminOverviewPage } from './pages/AdminOverviewPage.js';
import { AdminGuestsPage } from './pages/AdminGuestsPage.js';
import { AdminTablesPage } from './pages/AdminTablesPage.js';
import { AdminMediaPage } from './pages/AdminMediaPage.js';
import { AdminContentPage } from './pages/AdminContentPage.js';
import { ScreenPage } from './pages/ScreenPage.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/screen" element={<ScreenPage />} />
        <Route path="/telao" element={<ScreenPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/guests" element={<AdminGuestsPage />} />
        <Route path="/admin/convidados" element={<Navigate to="/admin/guests" replace />} />
        <Route path="/admin/tables" element={<AdminTablesPage />} />
        <Route path="/admin/mesas" element={<Navigate to="/admin/tables" replace />} />
        <Route path="/admin/media" element={<AdminMediaPage />} />
        <Route path="/admin/content" element={<AdminContentPage />} />
        <Route path="/admin/conteudo" element={<Navigate to="/admin/content" replace />} />
        <Route path="/admin/schedule" element={<Navigate to="/admin/content?tab=schedule" replace />} />
        <Route path="/admin/programacao" element={<Navigate to="/admin/content?tab=schedule" replace />} />
        <Route path="/admin/menu" element={<Navigate to="/admin/content?tab=menu" replace />} />
        <Route path="/admin/cardapio" element={<Navigate to="/admin/content?tab=menu" replace />} />
        <Route path="/admin/notices" element={<Navigate to="/admin/content?tab=notices" replace />} />
        <Route path="/admin/avisos" element={<Navigate to="/admin/content?tab=notices" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminOverviewPage />} />
        <Route path="/c/:token" element={<InvitePage />} />
        <Route path="/" element={<InvitePage />} />
        <Route path="*" element={<InvitePage />} />
      </Routes>
    </BrowserRouter>
  );
};


