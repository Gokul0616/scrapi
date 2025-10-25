import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Actors from './pages/Actors';
import ActorDetail from './pages/ActorDetail';
import Runs from './pages/Runs';
import Dataset from './pages/Dataset';
import DatasetV2 from './pages/DatasetV2';
import RunsV2 from './pages/RunsV2';
import ActorsV2 from './pages/ActorsV2';
import Marketplace from './pages/Marketplace';
import MyScrapers from './pages/MyScrapers';
import CreateScraper from './pages/CreateScraper';
import GlobalChat from './components/GlobalChat';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🕷️</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      <GlobalChat />
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/actors" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actors"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ActorsV2 />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/actor/:actorId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ActorDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/runs"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RunsV2 />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dataset/:runId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DatasetV2 />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/run/:runId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Runs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* Marketplace & Scraper Creation Routes */}
      <Route 
        path="/marketplace" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Marketplace />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-scrapers" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <MyScrapers />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-scraper" 
        element={
          <ProtectedRoute>
            <CreateScraper />
          </ProtectedRoute>
        } 
      />
      {/* Placeholder routes */}
      <Route path="/home" element={<ProtectedRoute><DashboardLayout><div className="p-8">Home</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><DashboardLayout><div className="p-8">Store</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/development" element={<ProtectedRoute><DashboardLayout><div className="p-8">Development</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><DashboardLayout><div className="p-8">Saved Tasks</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><DashboardLayout><div className="p-8">Integrations</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/schedules" element={<ProtectedRoute><DashboardLayout><div className="p-8">Schedules</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/storage" element={<ProtectedRoute><DashboardLayout><div className="p-8">Storage</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/proxy" element={<ProtectedRoute><DashboardLayout><div className="p-8">Proxy</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><div className="p-8">Settings</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><DashboardLayout><div className="p-8">Billing</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/docs" element={<ProtectedRoute><DashboardLayout><div className="p-8">Documentation</div></DashboardLayout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><DashboardLayout><div className="p-8">Help</div></DashboardLayout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
