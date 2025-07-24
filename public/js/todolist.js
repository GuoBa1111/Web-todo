const TaskManager = {
  userId: null,
  currentCategory: '无标签',
  tasks: [],
  currentEditingTaskId: null,

  async init() {
    console.log('开始初始化 TaskManager');
    this.userId = this.getUserIdFromLocalStorage();

    if (!this.userId) {
      console.log('userId为空，10秒后重定向到登录页');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 10000);
      return;
    }

    await this.loadTasks();
    this.renderTaskCategories();
    this.renderTasks();
    this.bindEventListeners();
  },

  getUserIdFromLocalStorage() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.user_id || null;
  },

  async loadTasks() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        credentials: 'include'
      });

      if (response.ok) {
        this.tasks = await response.json();
        // 转换字段名以保持兼容性
        this.tasks = this.tasks.map(task => ({
          ...task,
          _id: task.id,
          userId: task.user_id
        }));
        // 自动更新任务状态
        this.autoUpdateTaskStatuses();
      } else if (response.status === 401) {
        // 未授权，10秒后重定向到登录页
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 10000);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  },

  // 自动更新所有任务状态
  autoUpdateTaskStatuses() {
    const now = new Date();
    this.tasks.forEach(task => {
      // 只有当任务状态不是'已完成'时才自动更新
      if (task.status !== '已完成') {
        const startTime = new Date(task.startTime);
        const endTime = new Date(task.endTime);

        if (now < startTime) {
          task.status = '未开始';
        } else if (now >= startTime && now < endTime) {
          task.status = '进行中';
        } else if (now >= endTime) {
          task.status = '已结束';
        }
      }
    });
  },

  // 更新任务状态
  async updateTaskStatus(taskId, status) {
    try {
      const token = localStorage.getItem('token');
      let newStatus = status;

      if (status !== '已完成') {
        // 取消勾选时，直接计算并设置正确的状态
        const task = this.tasks.find(t => t._id === taskId);
        if (task) {
          const now = new Date();
          const startTime = new Date(task.startTime);
          const endTime = new Date(task.endTime);
          newStatus = '未开始';

          if (now >= startTime && now < endTime) {
            newStatus = '进行中';
          } else if (now >= endTime) {
            newStatus = '已结束';
          }
        }
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedTask = await response.json();
        // 字段映射
        const mappedTask = {
          ...updatedTask,
          _id: updatedTask.id,
          userId: updatedTask.user_id
        };
        const index = this.tasks.findIndex(task => task._id === taskId);
        if (index !== -1) {
          this.tasks[index] = mappedTask;
          this.renderTaskCategories();
          this.renderTasks();
        }
      }
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  },

  // 渲染任务分类
  renderTaskCategories() {
    const categories = [
      { name: '无标签', count: this.getTaskCountByCategory('无标签') },
      { name: '星标', count: this.getTaskCountByCategory('星标') },
      { name: '今日截止', count: this.getTaskCountByCategory('今日截止') },
      { name: '已归档', count: this.getTaskCountByCategory('已归档') },
      { name: '个人', count: this.getTaskCountByCategory('个人') },
      { name: '工作', count: this.getTaskCountByCategory('工作') },
      { name: '重要', count: this.getTaskCountByCategory('重要') }
    ];

    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';

    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = `category-item ${this.currentCategory === category.name ? 'active' : ''}`;
      categoryItem.dataset.category = category.name;
      categoryItem.innerHTML = `
        <span>${category.name}</span>
        <span class="task-count">${category.count}</span>
      `;
      categoryList.appendChild(categoryItem);
    });

    // 设置右侧内容区域颜色
    this.setContentAreaColor();
  },

  // 根据分类获取任务数量
  getTaskCountByCategory(category) {
    switch (category) {
      case '无标签':
        return this.tasks.filter(task => task.tags.length === 0).length;
      case '星标':
        return this.tasks.filter(task => task.starred).length;
      case '今日截止':
        return this.tasks.filter(task => this.isToday(new Date(task.endTime))).length;
      case '已归档':
        return this.tasks.filter(task => task.status === '已完成').length;
      default:
        return this.tasks.filter(task => task.tags.includes(category)).length;
    }
  },

  // 判断日期是否为今天
  isToday(date) {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  },

  // 设置内容区域颜色
  setContentAreaColor() {
    const contentArea = document.getElementById('taskContent');
    contentArea.className = 'task-content';

    switch (this.currentCategory) {
      case '无标签':
      case '星标':
      case '今日截止':
      case '已归档':
        contentArea.classList.add('yellow-bg');
        break;
      case '个人':
        contentArea.classList.add('green-bg');
        break;
      case '工作':
        contentArea.classList.add('blue-bg');
        break;
      case '重要':
        contentArea.classList.add('red-bg');
        break;
    }
  },

  // 渲染任务列表
  renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<div class="empty-state">该分类下暂无任务</div>';
      return;
    }

    filteredTasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${task.status === '已完成' ? 'completed' : ''}`;
      taskItem.dataset.id = task._id;

      // 格式化日期显示
      const createdAt = new Date(task.createdAt);
      const formattedDate = this.formatDateTime(createdAt);

      taskItem.innerHTML = `
        <div class="task-checkbox">
          <input type="checkbox" ${task.status === '已完成' ? 'checked' : ''} data-id="${task._id}">
        </div>
        <div class="task-details">
          <h3 class="task-title">${task.title} ${task.starred ? '<span class="star">★</span>' : ''}</h3>
          <div class="task-meta">
            <span class="task-status">${task.status}</span>
            <span class="task-priority">优先级: ${task.priority}</span>
            <span class="task-date">创建时间: ${formattedDate}</span>
          </div>
          ${task.notes ? `<div class="task-notes">备注: ${task.notes}</div>` : ''}
          ${task.tags.length > 0 ? `<div class="task-tags">${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
          ${task.startTime && task.endTime ? `
            <div class="task-duration">
              持续时间: ${this.formatDateTime(new Date(task.startTime))} - ${this.formatDateTime(new Date(task.endTime))}
            </div>
          ` : ''}
        </div>
        <div class="task-actions">
          <button class="edit-btn" data-id="${task._id}">编辑</button>
          <button class="delete-btn" data-id="${task._id}">删除</button>
        </div>
      `;

      taskList.appendChild(taskItem);
    });
  },

  // 格式化日期
  formatDateTime(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  },

  // 根据当前分类筛选任务
  getFilteredTasks() {
    switch (this.currentCategory) {
      case '无标签':
        return this.tasks.filter(task => task.tags.length === 0);
      case '星标':
        return this.tasks.filter(task => task.starred);
      case '今日截止':
        return this.tasks.filter(task => this.isToday(new Date(task.endTime)));
      case '已归档':
        return this.tasks.filter(task => task.status === '已完成');
      default:
        return this.tasks.filter(task => task.tags.includes(this.currentCategory));
    }
  },

  // 绑定事件监听器
  bindEventListeners() {
    // 分类切换
    document.getElementById('categoryList').addEventListener('click', (e) => {
      const categoryItem = e.target.closest('.category-item');
      if (categoryItem) {
        this.currentCategory = categoryItem.dataset.category;
        this.renderTaskCategories();
        this.renderTasks();
      }
    });

    // 任务状态切换
    document.getElementById('taskList').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const taskId = e.target.dataset.id;
        this.updateTaskStatus(taskId, e.target.checked ? '已完成' : '未开始');
      }
    });

    // 任务操作按钮
    document.getElementById('taskList').addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const taskId = e.target.dataset.id;
        this.deleteTask(taskId);
      }
      else if (e.target.classList.contains('edit-btn')) {
        const taskId = e.target.dataset.id;
        this.editTask(taskId);
      }
    });
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  TaskManager.init();
});

