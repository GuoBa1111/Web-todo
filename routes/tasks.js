const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// 获取所有任务 - 从查询参数获取userId
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ msg: '用户ID不能为空' });
    }
    const tasks = await Task.find({ userId });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// 创建任务
router.post('/', async (req, res) => {
  try {
    const newTask = new Task({
      userId: req.body.userId,
      title: req.body.title,
      status: req.body.status || '未开始',
      startTime: req.body.startTime || Date.now(),
      endTime: req.body.endTime,
      tags: req.body.tags || [],
      priority: req.body.priority || '中',
      notes: req.body.notes
    });

    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// 更新任务 - 支持多字段更新
router.patch('/:id', async (req, res) => {
  try {
    const updates = {
      status: req.body.status,
      title: req.body.title,
      priority: req.body.priority,
      notes: req.body.notes,
      tags: req.body.tags,
      endTime: req.body.endTime,
      startTime: req.body.startTime
    };
    
    // 移除undefined的属性
    Object.keys(updates).forEach(key => 
      updates[key] === undefined && delete updates[key]
    );
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
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
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: '任务已删除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;