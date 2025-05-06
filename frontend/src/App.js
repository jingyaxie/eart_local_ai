import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import './App.css';

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Router>
      <Layout className="layout">
        <Header>
          <div className="logo" />
          <h1 style={{ color: 'white' }}>AI Course System</h1>
        </Header>
        <Content style={{ padding: '0 50px', marginTop: 64 }}>
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<div>Welcome to AI Course System</div>} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          AI Course System ©{new Date().getFullYear()} Created by Your Company
        </Footer>
      </Layout>
    </Router>
  );
}

export default App; 