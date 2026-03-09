import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import Team from './pages/Team';
import Integrations from './pages/Integrations';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/sidebar" element={<Sidebar />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/team" element={<Team />} />
        <Route path="/integrations" element={<Integrations />} />
      </Routes>
    </div>
  )
}

export default App