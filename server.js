require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// 中间件
app.use(express.json());

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 生产环境配置
if (process.env.NODE_ENV === 'production') {
  // 修改为正确的public目录
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}`));