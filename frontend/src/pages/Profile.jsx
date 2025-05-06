import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        inApp: true,
      },
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: null,
      loginHistory: [],
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/profile`
      );
      setProfile(response.data);
    } catch (error) {
      console.error('获取个人资料失败:', error);
      setError('加载个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/profile`,
        profile
      );
      setSuccess('个人资料更新成功');
      setEditing(false);
    } catch (error) {
      console.error('更新个人资料失败:', error);
      setError('更新个人资料失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/profile/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setProfile({
        ...profile,
        avatar: response.data.avatarUrl,
      });
      setSuccess('头像更新成功');
    } catch (error) {
      console.error('上传头像失败:', error);
      setError('上传头像失败');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        个人资料
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={profile.avatar}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
              </Box>
              <Typography variant="h6">
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography color="textSecondary">
                {profile.email}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab icon={<EditIcon />} label="个人信息" />
              <Tab icon={<SecurityIcon />} label="安全设置" />
              <Tab icon={<NotificationsIcon />} label="通知设置" />
              <Tab icon={<LanguageIcon />} label="偏好设置" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="名字"
                        value={profile.firstName}
                        onChange={(e) => setProfile({
                          ...profile,
                          firstName: e.target.value,
                        })}
                        disabled={!editing}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="姓氏"
                        value={profile.lastName}
                        onChange={(e) => setProfile({
                          ...profile,
                          lastName: e.target.value,
                        })}
                        disabled={!editing}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="邮箱"
                        value={profile.email}
                        onChange={(e) => setProfile({
                          ...profile,
                          email: e.target.value,
                        })}
                        disabled={!editing}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="电话"
                        value={profile.phone}
                        onChange={(e) => setProfile({
                          ...profile,
                          phone: e.target.value,
                        })}
                        disabled={!editing}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="个人简介"
                        value={profile.bio}
                        onChange={(e) => setProfile({
                          ...profile,
                          bio: e.target.value,
                        })}
                        disabled={!editing}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <SecurityIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="双因素认证"
                        secondary="为您的账户添加额外的安全层"
                      />
                      <Switch
                        edge="end"
                        checked={profile.security.twoFactorEnabled}
                        onChange={(e) => setProfile({
                          ...profile,
                          security: {
                            ...profile.security,
                            twoFactorEnabled: e.target.checked,
                          },
                        })}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="最后密码修改时间"
                        secondary={profile.security.lastPasswordChange
                          ? new Date(profile.security.lastPasswordChange).toLocaleString()
                          : '从未修改'}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="登录历史"
                        secondary={`${profile.security.loginHistory.length} 次最近登录`}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="邮件通知"
                        secondary="通过邮件接收通知"
                      />
                      <Switch
                        edge="end"
                        checked={profile.preferences.notifications.email}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              email: e.target.checked,
                            },
                          },
                        })}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="推送通知"
                        secondary="接收推送通知"
                      />
                      <Switch
                        edge="end"
                        checked={profile.preferences.notifications.push}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              push: e.target.checked,
                            },
                          },
                        })}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="应用内通知"
                        secondary="在应用内接收通知"
                      />
                      <Switch
                        edge="end"
                        checked={profile.preferences.notifications.inApp}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            notifications: {
                              ...profile.preferences.notifications,
                              inApp: e.target.checked,
                            },
                          },
                        })}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PaletteIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="主题"
                        secondary="选择您喜欢的主题"
                      />
                      <Switch
                        edge="end"
                        checked={profile.preferences.theme === 'dark'}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            theme: e.target.checked ? 'dark' : 'light',
                          },
                        })}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <LanguageIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="语言"
                        secondary="选择您喜欢的语言"
                      />
                      <TextField
                        select
                        value={profile.preferences.language}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            language: e.target.value,
                          },
                        })}
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="en">英语</option>
                        <option value="es">西班牙语</option>
                        <option value="fr">法语</option>
                        <option value="de">德语</option>
                      </TextField>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <LanguageIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="时区"
                        secondary="选择您的时区"
                      />
                      <TextField
                        select
                        value={profile.preferences.timezone}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            timezone: e.target.value,
                          },
                        })}
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">EST</option>
                        <option value="PST">PST</option>
                        <option value="GMT">GMT</option>
                      </TextField>
                    </ListItem>
                  </List>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {editing ? (
          <>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => {
                setEditing(false);
                fetchProfile();
              }}
              sx={{ mr: 1 }}
            >
              取消
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存更改'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditing(true)}
          >
            编辑资料
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default Profile; 