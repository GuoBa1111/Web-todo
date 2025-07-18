const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['未开始', '进行中', '已完成'],
    default: '未开始'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  tags: [{
    type: String,
    enum: ['个人', '工作', '重要']
  }],
  priority: {
    type: String,
    enum: ['极低', '低', '中', '高', '极高'],
    default: '中'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('task', TaskSchema);