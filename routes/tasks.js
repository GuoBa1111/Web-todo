const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 获取所有任务
router.get('/', async (req, res) => {
  try {
    // 从中间件获取用户ID
    const userId = req.user?.user_id;
    console.log('用户ID:', userId);

    if (!userId) {
      return res.status(401).json({ msg: '用户未授权' });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });

    console.log('查询结果:', tasks);
    console.log('查询错误:', error);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        msg: '获取任务失败',
        error: error.message,
        details: error.details
      });
    }

    res.json(tasks);
  } catch (err) {
    console.error('服务器错误:', err);
    res.status(500).json({
      msg: '服务器错误',
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

// 创建任务
router.post('/', async (req, res) => {
  try {
    // 验证 id 和 userId 不为空
    if (!req.body.id || req.body.id === '') {
      return res.status(400).json({ msg: '任务 ID 不能为空' });
    }
    if (!req.body.userId || req.body.userId === '') {
      return res.status(400).json({ msg: '用户 ID 不能为空' });
    }

    const taskData = {
      id: req.body.id,
      user_id: req.body.userId,
      title: req.body.title,
      status: req.body.status || '未开始',
      startTime: req.body.startTime || new Date().toISOString(),
      endTime: req.body.endTime,
      tags: req.body.tags || [],
      priority: req.body.priority || '中',
      notes: req.body.notes
    };

    // 打印 taskData 及其类型
    console.log('创建任务数据:', taskData);

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        msg: '创建任务失败',
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    res.json(task);
  } catch (err) {
    console.error('服务器错误:', err);
    res.status(500).json({
      msg: '服务器错误',
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

// 更新任务 - 支持多字段更新
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    
    // 只更新提供的字段
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.priority !== undefined) updates.priority = req.body.priority;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.tags !== undefined) updates.tags = req.body.tags;
    if (req.body.endTime !== undefined) updates.endTime = req.body.endTime;
    if (req.body.startTime !== undefined) updates.startTime = req.body.startTime;
    
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ msg: '更新任务失败' });
    }
    
    if (!task) {
      return res.status(404).json({ msg: '任务不存在' });
    }
    
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ msg: '删除任务失败' });
    }

    res.json({ msg: '任务已删除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;