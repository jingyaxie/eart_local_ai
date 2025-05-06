import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Help as HelpIcon,
  Book as BookIcon,
  VideoLibrary as VideoIcon,
  QuestionAnswer as FAQIcon,
  ContactSupport as ContactIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/help/search`,
        {
          params: { query: searchQuery },
        }
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error('搜索帮助内容失败:', error);
      setError('搜索帮助内容失败');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) return;

    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/help/contact`,
        contactForm
      );
      setContactDialogOpen(false);
      setContactForm({ subject: '', message: '' });
    } catch (error) {
      console.error('提交联系表单失败:', error);
      setError('提交联系表单失败');
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: '如何上传文件？',
      answer: '要上传文件，请导航到上传文件页面，然后拖放文件或点击上传按钮从计算机中选择文件。您也可以使用批量上传功能上传多个文件。',
    },
    {
      question: '如何管理通知？',
      answer: '您可以在设置页面管理通知。在这里，您可以启用/禁用邮件通知、推送通知和应用内通知。您还可以设置免打扰时间。',
    },
    {
      question: '如何更改个人头像？',
      answer: '要更改个人头像，请转到个人资料页面，点击当前头像上的相机图标。从计算机中选择新图片，它将自动上传。',
    },
    {
      question: '如何启用双因素认证？',
      answer: '要启用双因素认证，请转到个人资料页面，选择安全标签，然后切换双因素认证开关。按照提供的设置说明进行操作。',
    },
    {
      question: '如何导出文件？',
      answer: '要导出文件，请转到文件库页面，选择要导出的文件，然后点击导出按钮。您可以选择导出为ZIP文件或单个文件。',
    },
  ];

  const tutorials = [
    {
      title: '入门指南',
      description: '学习使用平台的基础知识',
      videoUrl: 'https://example.com/tutorials/getting-started',
    },
    {
      title: '文件管理',
      description: '如何上传、组织和管理文件',
      videoUrl: 'https://example.com/tutorials/file-management',
    },
    {
      title: '通知和设置',
      description: '自定义通知偏好和设置',
      videoUrl: 'https://example.com/tutorials/notifications-settings',
    },
    {
      title: '安全功能',
      description: '了解安全功能和最佳实践',
      videoUrl: 'https://example.com/tutorials/security',
    },
  ];

  const documentation = [
    {
      title: '用户指南',
      description: '使用平台的综合指南',
      url: 'https://example.com/docs/user-guide',
    },
    {
      title: 'API文档',
      description: '开发人员技术文档',
      url: 'https://example.com/docs/api',
    },
    {
      title: '安全指南',
      description: '安全最佳实践和指南',
      url: 'https://example.com/docs/security',
    },
    {
      title: '故障排除',
      description: '常见问题及其解决方案',
      url: 'https://example.com/docs/troubleshooting',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        帮助与支持
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="搜索帮助内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            搜索
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}

      {searchResults.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            搜索结果
          </Typography>
          <List>
            {searchResults.map((result, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={result.description}
                  />
                </ListItem>
                {index < searchResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FAQIcon sx={{ mr: 1 }} />
              常见问题
            </Typography>
            {faqs.map((faq, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <VideoIcon sx={{ mr: 1 }} />
              视频教程
            </Typography>
            <List>
              {tutorials.map((tutorial, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <VideoIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={tutorial.title}
                      secondary={tutorial.description}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      href={tutorial.videoUrl}
                      target="_blank"
                    >
                      观看
                    </Button>
                  </ListItem>
                  {index < tutorials.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <BookIcon sx={{ mr: 1 }} />
              文档
            </Typography>
            <List>
              {documentation.map((doc, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <BookIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.title}
                      secondary={doc.description}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      href={doc.url}
                      target="_blank"
                    >
                      查看
                    </Button>
                  </ListItem>
                  {index < documentation.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<ContactIcon />}
          onClick={() => setContactDialogOpen(true)}
        >
          联系支持
        </Button>
      </Box>

      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          联系支持
          <IconButton
            aria-label="close"
            onClick={() => setContactDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="主题"
              value={contactForm.subject}
              onChange={(e) => setContactForm({
                ...contactForm,
                subject: e.target.value,
              })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="消息内容"
              value={contactForm.message}
              onChange={(e) => setContactForm({
                ...contactForm,
                message: e.target.value,
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>
            取消
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleContactSubmit}
            disabled={loading}
          >
            {loading ? '发送中...' : '发送消息'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Help; 