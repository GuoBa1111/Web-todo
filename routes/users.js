const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// 获取用户提醒时间
router.get('/:userId/remindTime', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('remindTime')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ msg: '获取提醒时间失败', error: error.message });
    }

    // 如果没有设置过提醒时间，返回默认值60分钟
    const remindTime = data ? data.remindTime : 60;
    res.json({ remindTime });
  } catch (err) {
    console.error('服务器异常:', err);
    res.status(500).json({ msg: '服务器错误', error: err.message });
  }
});

// 保存用户提醒时间
router.post('/:userId/remindTime', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { remindTime } = req.body;


    // 验证提醒时间是否为数字
    if (typeof remindTime !== 'number' || isNaN(remindTime) || remindTime < 1) {
      return res.status(400).json({ msg: '提醒时间必须是大于0的数字' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ remindTime })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ msg: '保存提醒时间失败', error: error.message });
    }

    res.json({ msg: '保存成功', remindTime: data.remindTime });
  } catch (err) {
    console.error('服务器异常:', err);
    res.status(500).json({ msg: '服务器错误', error: err.message });
  }
});

module.exports = router;