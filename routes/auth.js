const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('尝试注册用户:', name, email);

    // 检查输入是否有效
    if (!name || !email || !password) {
      console.log('缺少必要的注册信息');
      return res.status(400).json({ msg: '请填写所有必填字段' });
    }

    // 检查用户是否已存在
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    // 检查用户名是否已存在
    const { data: existingName, error: nameError } = await supabase
      .from('users')
      .select('user_id')
      .eq('name', name)
      .single();

    // 创建新用户
    console.log('尝试创建新用户:', name);
    // 生成哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          user_id: req.body.user_id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // 处理唯一约束错误
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return res.status(400).json({ msg: '用户名已被占用' });
        } else if (error.message.includes('email')) {
          return res.status(400).json({ msg: '邮箱已被注册' });
        }
      }
      return res.status(500).json({
        msg: '注册失败',
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    console.log('注册成功:', name);
    res.json({ msg: '注册成功' });
  } catch (err) {
    console.error('服务器异常:', err);
    res.status(500).json({
      msg: '服务器错误',
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

// 引入jsonwebtoken
const jwt = require('jsonwebtoken');

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ msg: '用户不存在' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: '密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({
      msg: '登录成功',
      token,
      user: {
        user_id: user.user_id,  // 改为 user_id
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;