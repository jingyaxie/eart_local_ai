import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import axios from 'axios';

const Permissions = () => {
  // 状态管理
  const [tabValue, setTabValue] = useState(0);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [filePermissions, setFilePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 对话框状态
  const [roleDialog, setRoleDialog] = useState(false);
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [userRoleDialog, setUserRoleDialog] = useState(false);
  const [filePermissionDialog, setFilePermissionDialog] = useState(false);

  // 表单状态
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [newPermission, setNewPermission] = useState({
    name: '',
    description: '',
    resource_type: '',
    action: ''
  });
  const [newUserRole, setNewUserRole] = useState({ user_id: '', role_id: '' });
  const [newFilePermission, setNewFilePermission] = useState({
    file_id: '',
    user_id: '',
    permission_type: ''
  });

  // 获取数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes, userRolesRes, filePermissionsRes] = await Promise.all([
        axios.get('/api/permissions/roles'),
        axios.get('/api/permissions/permissions'),
        axios.get('/api/permissions/user-roles'),
        axios.get('/api/permissions/file-permissions')
      ]);

      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);
      setUserRoles(userRolesRes.data);
      setFilePermissions(filePermissionsRes.data);
    } catch (err) {
      setError('获取数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 角色管理
  const handleCreateRole = async () => {
    try {
      const response = await axios.post('/api/permissions/roles', newRole);
      setRoles([...roles, response.data]);
      setRoleDialog(false);
      setNewRole({ name: '', description: '' });
      setSuccess('角色创建成功');
    } catch (err) {
      setError('创建角色失败: ' + err.message);
    }
  };

  const handleUpdateRole = async (roleId, updatedRole) => {
    try {
      const response = await axios.put(`/api/permissions/roles/${roleId}`, updatedRole);
      setRoles(roles.map(role => role.id === roleId ? response.data : role));
      setSuccess('角色更新成功');
    } catch (err) {
      setError('更新角色失败: ' + err.message);
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await axios.delete(`/api/permissions/roles/${roleId}`);
      setRoles(roles.filter(role => role.id !== roleId));
      setSuccess('角色删除成功');
    } catch (err) {
      setError('删除角色失败: ' + err.message);
    }
  };

  // 权限管理
  const handleCreatePermission = async () => {
    try {
      const response = await axios.post('/api/permissions/permissions', newPermission);
      setPermissions([...permissions, response.data]);
      setPermissionDialog(false);
      setNewPermission({
        name: '',
        description: '',
        resource_type: '',
        action: ''
      });
      setSuccess('权限创建成功');
    } catch (err) {
      setError('创建权限失败: ' + err.message);
    }
  };

  // 用户角色管理
  const handleAssignUserRole = async () => {
    try {
      await axios.post('/api/permissions/user-roles', newUserRole);
      setUserRoleDialog(false);
      setNewUserRole({ user_id: '', role_id: '' });
      fetchData(); // 刷新数据
      setSuccess('用户角色分配成功');
    } catch (err) {
      setError('分配用户角色失败: ' + err.message);
    }
  };

  const handleRemoveUserRole = async (userId, roleId) => {
    try {
      await axios.delete(`/api/permissions/user-roles/${userId}/${roleId}`);
      setUserRoles(userRoles.filter(ur => !(ur.user_id === userId && ur.role_id === roleId)));
      setSuccess('用户角色移除成功');
    } catch (err) {
      setError('移除用户角色失败: ' + err.message);
    }
  };

  // 文件权限管理
  const handleCreateFilePermission = async () => {
    try {
      const response = await axios.post('/api/permissions/file-permissions', newFilePermission);
      setFilePermissions([...filePermissions, response.data]);
      setFilePermissionDialog(false);
      setNewFilePermission({
        file_id: '',
        user_id: '',
        permission_type: ''
      });
      setSuccess('文件权限创建成功');
    } catch (err) {
      setError('创建文件权限失败: ' + err.message);
    }
  };

  const handleDeleteFilePermission = async (fileId, userId) => {
    try {
      await axios.delete(`/api/permissions/file-permissions/${fileId}/${userId}`);
      setFilePermissions(filePermissions.filter(fp => 
        !(fp.file_id === fileId && fp.user_id === userId)
      ));
      setSuccess('文件权限删除成功');
    } catch (err) {
      setError('删除文件权限失败: ' + err.message);
    }
  };

  // 渲染标签页内容
  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">角色管理</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setRoleDialog(true)}
              >
                创建角色
              </Button>
            </Box>
            <List>
              {roles.map(role => (
                <ListItem key={role.id}>
                  <ListItemText
                    primary={role.name}
                    secondary={role.description}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleUpdateRole(role.id, role)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">权限管理</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setPermissionDialog(true)}
              >
                创建权限
              </Button>
            </Box>
            <List>
              {permissions.map(permission => (
                <ListItem key={permission.id}>
                  <ListItemText
                    primary={permission.name}
                    secondary={`${permission.resource_type} - ${permission.action}`}
                  />
                  <Chip
                    label={permission.resource_type}
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">用户角色管理</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setUserRoleDialog(true)}
              >
                分配角色
              </Button>
            </Box>
            <List>
              {userRoles.map(userRole => (
                <ListItem key={`${userRole.user_id}-${userRole.role_id}`}>
                  <ListItemText
                    primary={`用户ID: ${userRole.user_id}`}
                    secondary={`角色ID: ${userRole.role_id}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveUserRole(userRole.user_id, userRole.role_id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">文件权限管理</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setFilePermissionDialog(true)}
              >
                创建文件权限
              </Button>
            </Box>
            <List>
              {filePermissions.map(fp => (
                <ListItem key={`${fp.file_id}-${fp.user_id}`}>
                  <ListItemText
                    primary={`文件ID: ${fp.file_id}`}
                    secondary={`用户ID: ${fp.user_id} - 权限类型: ${fp.permission_type}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteFilePermission(fp.file_id, fp.user_id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        权限管理
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<SecurityIcon />} label="角色管理" />
          <Tab icon={<SecurityIcon />} label="权限管理" />
          <Tab icon={<PersonIcon />} label="用户角色" />
          <Tab icon={<FolderIcon />} label="文件权限" />
        </Tabs>
      </Paper>

      {renderTabContent()}

      {/* 创建角色对话框 */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)}>
        <DialogTitle>创建新角色</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="角色名称"
            fullWidth
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="角色描述"
            fullWidth
            multiline
            rows={3}
            value={newRole.description}
            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)}>取消</Button>
          <Button onClick={handleCreateRole} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建权限对话框 */}
      <Dialog open={permissionDialog} onClose={() => setPermissionDialog(false)}>
        <DialogTitle>创建新权限</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="权限名称"
            fullWidth
            value={newPermission.name}
            onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="权限描述"
            fullWidth
            multiline
            rows={2}
            value={newPermission.description}
            onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>资源类型</InputLabel>
            <Select
              value={newPermission.resource_type}
              onChange={(e) => setNewPermission({ ...newPermission, resource_type: e.target.value })}
            >
              <MenuItem value="file">文件</MenuItem>
              <MenuItem value="course">课程</MenuItem>
              <MenuItem value="user">用户</MenuItem>
              <MenuItem value="role">角色</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>操作类型</InputLabel>
            <Select
              value={newPermission.action}
              onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
            >
              <MenuItem value="create">创建</MenuItem>
              <MenuItem value="read">读取</MenuItem>
              <MenuItem value="update">更新</MenuItem>
              <MenuItem value="delete">删除</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialog(false)}>取消</Button>
          <Button onClick={handleCreatePermission} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 分配用户角色对话框 */}
      <Dialog open={userRoleDialog} onClose={() => setUserRoleDialog(false)}>
        <DialogTitle>分配用户角色</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="用户ID"
            fullWidth
            value={newUserRole.user_id}
            onChange={(e) => setNewUserRole({ ...newUserRole, user_id: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>角色</InputLabel>
            <Select
              value={newUserRole.role_id}
              onChange={(e) => setNewUserRole({ ...newUserRole, role_id: e.target.value })}
            >
              {roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserRoleDialog(false)}>取消</Button>
          <Button onClick={handleAssignUserRole} variant="contained">
            分配
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建文件权限对话框 */}
      <Dialog open={filePermissionDialog} onClose={() => setFilePermissionDialog(false)}>
        <DialogTitle>创建文件权限</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文件ID"
            fullWidth
            value={newFilePermission.file_id}
            onChange={(e) => setNewFilePermission({ ...newFilePermission, file_id: e.target.value })}
          />
          <TextField
            margin="dense"
            label="用户ID"
            fullWidth
            value={newFilePermission.user_id}
            onChange={(e) => setNewFilePermission({ ...newFilePermission, user_id: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>权限类型</InputLabel>
            <Select
              value={newFilePermission.permission_type}
              onChange={(e) => setNewFilePermission({ ...newFilePermission, permission_type: e.target.value })}
            >
              <MenuItem value="read">只读</MenuItem>
              <MenuItem value="write">读写</MenuItem>
              <MenuItem value="admin">管理</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilePermissionDialog(false)}>取消</Button>
          <Button onClick={handleCreateFilePermission} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Permissions; 