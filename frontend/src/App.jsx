import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useTheme } from './contexts/ThemeContext';
import { SnackbarProvider } from 'notistack';

// Layout components
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';

// Page components
import StudentDashboard from './pages/StudentDashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import UploadFile from './pages/UploadFile';
import FileLibrary from './pages/FileLibrary';
import CategoryManager from './pages/CategoryManager';
import MediaTools from './pages/MediaTools';
import ProjectProgress from './pages/ProjectProgress';
import FeedbackPanel from './pages/FeedbackPanel';
import ChatPage from './pages/ChatPage';
import AdminPanel from './pages/AdminPanel';
import ChecklistPage from './pages/ChecklistPage';
import Chat from './pages/Chat';
import Checklist from './pages/Checklist';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Permissions from './pages/Permissions';
import LearningProgress from './pages/LearningProgress';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// 导入认证上下文
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
  const { darkMode } = useTheme();

  // 主题状态管理
  const [theme, setTheme] = useState(createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  }));

  // 处理主题切换
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      createTheme({
        ...prevTheme,
        palette: {
          mode: prevTheme.palette.mode === 'light' ? 'dark' : 'light',
        },
      })
    );
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    // 提供认证上下文
    <AuthProvider>
      {/* 提供主题上下文 */}
      <ThemeProvider theme={theme}>
        {/* 重置CSS样式 */}
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout onThemeToggle={toggleTheme} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="knowledge-base" element={<KnowledgeBase />} />
                <Route path="chat" element={<Chat />} />
                <Route path="checklist" element={<Checklist />} />
                <Route path="progress" element={<Progress />} />
                <Route path="upload" element={<UploadFile />} />
                <Route path="files" element={<FileLibrary />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="help" element={<Help />} />
                <Route path="permissions" element={<Permissions />} />
                <Route path="learning" element={<LearningProgress />} />
              </Route>
            </Routes>
          </Router>
        </SnackbarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App; 