import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import DashboardPage from './pages/DashboardPage';
import { useAuthStore } from './stores/authStore';
import './App.css';

function App() {
  const { user, loadCurrentUser } = useAuthStore();

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Sidebar user={user} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage user={user} />} />
            <Route path="/clients" element={<ClientsPage user={user} />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage user={user} />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
