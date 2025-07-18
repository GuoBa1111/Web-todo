const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 获取所有任务 - 从查询参数获取userId
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ msg: '用户ID不能为空' });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ msg: '获取任务失败' });
    }

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// 创建任务
router.post('/', async (req, res) => {
  try {
    const taskData = {
      user_id: req.body.userId,
      title: req.body.title,
      status: req.body.status || '未开始',
      start_time: req.body.startTime || new Date().toISOString(),
      end_time: req.body.endTime,
      tags: req.body.tags || [],
      priority: req.body.priority || '中',
      notes: req.body.notes
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ msg: '创建任务失败' });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
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
    if (req.body.endTime !== undefined) updates.end_time = req.body.endTime;
    if (req.body.startTime !== undefined) updates.start_time = req.body.startTime;
    
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