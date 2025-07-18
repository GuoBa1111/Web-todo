const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 检查用户是否已存在
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: '用户已存在' });
    }

    // 创建新用户
    user = new User({
      name,
      email,
      password
    });

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 保存用户
    await user.save();

    res.json({ msg: '注册成功' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 检查用户是否存在
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: '用户不存在' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: '密码错误' });
    }

    res.json({ msg: '登录成功', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;