import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Chat as ChatIcon,
  Checklist as ChecklistIcon,
  Timeline as TimelineIcon,
  Upload as UploadIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  Security as SecurityIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

const drawerWidth = 240;

const menuItems = [
  { text: '仪表板', icon: <DashboardIcon />, path: '/' },
  { text: '知识库', icon: <SchoolIcon />, path: '/knowledge' },
  { text: 'AI助手', icon: <ChatIcon />, path: '/chat' },
  { text: '任务清单', icon: <ChecklistIcon />, path: '/checklist' },
  { text: '学习进度', icon: <TimelineIcon />, path: '/progress' },
  { text: '上传文件', icon: <UploadIcon />, path: '/upload' },
  { text: '文件库', icon: <FolderIcon />, path: '/files' },
  { text: '设置', icon: <SettingsIcon />, path: '/settings' },
  { text: '通知', icon: <NotificationsIcon />, path: '/notifications' },
  { text: '个人资料', icon: <PersonIcon />, path: '/profile' },
  { text: '帮助', icon: <HelpIcon />, path: '/help' },
  { text: '权限管理', icon: <SecurityIcon />, path: '/permissions' }
];

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useAppTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          AI课程系统
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'AI课程系统'}
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleProfileMenuOpen}
          >
            <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px'
        }}
      >
        {children}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => {
          navigate('/profile');
          handleProfileMenuClose();
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          个人资料
        </MenuItem>
        <MenuItem onClick={() => {
          navigate('/settings');
          handleProfileMenuClose();
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          设置
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          退出登录
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayout; 