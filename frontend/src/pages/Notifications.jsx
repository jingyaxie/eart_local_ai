import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Badge,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Notifications() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    inApp: true,
    digest: false,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchNotificationSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/notifications`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error('获取通知失败:', error);
      setError('加载通知失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/notifications/settings`
      );
      setSettings(response.data);
    } catch (error) {
      console.error('获取通知设置失败:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}/read`
      );
      fetchNotifications();
    } catch (error) {
      console.error('标记通知为已读失败:', error);
      setError('标记通知为已读失败');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}`
      );
      fetchNotifications();
    } catch (error) {
      console.error('删除通知失败:', error);
      setError('删除通知失败');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/notifications/settings`,
        settings
      );
      setSettingsDialogOpen(false);
    } catch (error) {
      console.error('保存通知设置失败:', error);
      setError('保存通知设置失败');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <WarningIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !notification.read;
    return notification.type === selectedFilter;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          通知
        </Typography>
        <Box>
          <IconButton
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            sx={{ mr: 1 }}
          >
            <FilterListIcon />
          </IconButton>
          <IconButton onClick={() => setSettingsDialogOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        {filteredNotifications.map((notification) => (
          <React.Fragment key={notification.id}>
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      setSelectedNotification(notification);
                      setMenuAnchorEl(e.currentTarget);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemAvatar>
                <Avatar>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1">
                      {notification.title}
                    </Typography>
                    {!notification.read && (
                      <Chip
                        label="新"
                        color="primary"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      {notification.message}
                    </Typography>
                    <br />
                    <Typography component="span" variant="caption" color="text.secondary">
                      {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={() => {
            handleMarkAsRead(selectedNotification.id);
            setMenuAnchorEl(null);
          }}>
            标记为已读
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          handleDelete(selectedNotification.id);
          setMenuAnchorEl(null);
        }}>
          删除
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setSelectedFilter('all');
          setFilterAnchorEl(null);
        }}>
          所有通知
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedFilter('unread');
          setFilterAnchorEl(null);
        }}>
          未读通知
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedFilter('success');
          setFilterAnchorEl(null);
        }}>
          成功通知
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedFilter('warning');
          setFilterAnchorEl(null);
        }}>
          警告通知
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedFilter('error');
          setFilterAnchorEl(null);
        }}>
          错误通知
        </MenuItem>
      </Menu>

      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>通知设置</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: e.target.checked,
                  })}
                />
              }
              label="邮件通知"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.push}
                  onChange={(e) => setSettings({
                    ...settings,
                    push: e.target.checked,
                  })}
                />
              }
              label="推送通知"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.inApp}
                  onChange={(e) => setSettings({
                    ...settings,
                    inApp: e.target.checked,
                  })}
                />
              }
              label="应用内通知"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.digest}
                  onChange={(e) => setSettings({
                    ...settings,
                    digest: e.target.checked,
                  })}
                />
              }
              label="邮件摘要"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.quietHours}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: e.target.checked,
                  })}
                />
              }
              label="免打扰时间"
            />
            {settings.quietHours && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="开始时间"
                  value={settings.quietHoursStart}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHoursStart: e.target.value,
                  })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="结束时间"
                  value={settings.quietHoursEnd}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHoursEnd: e.target.value,
                  })}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            保存更改
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Notifications; 