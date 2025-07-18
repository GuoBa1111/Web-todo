const express = require('express');
const connectDB = require('./config/db');
const path = require('path');

const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(express.json());

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 生产环境配置
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}`));