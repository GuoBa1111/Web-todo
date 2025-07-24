// 任务数据管理
const TaskManager = {
  userId: null,
  currentCategory: '无标签',
  tasks: [],
  currentEditingTaskId: null,

  // 初始化函数
  async init() {
    console.log('================ 开始初始化 TaskManager ================');
    const startTime = Date.now();

    // 检查本地存储
    this.userId = this.getUserIdFromLocalStorage();
    console.log('获取到的userId:', this.userId);

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

    // 添加定时检查任务截止时间 (新增代码)
    this.checkDeadlineInterval = setInterval(() => {
      this.checkTaskDeadlines();
    }, 60000); // 每分钟检查一次

    // 检查通知权限状态
    this.checkNotificationPermission();

    // 计算初始化耗时
    const endTime = Date.now();
    console.log(`================ 初始化完成，耗时: ${endTime - startTime}ms ================`);
  },

  // 从本地存储获取用户ID
  getUserIdFromLocalStorage() {
    console.log('从本地存储获取用户信息...');
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('本地存储中的用户信息:', user);
    return user?.user_id || null;
  },

  // 加载任务数据
  async loadTasks() {
    try {
      console.log(`开始加载任务`);
      const requestStartTime = Date.now();

      // 从本地存储获取令牌
      const token = localStorage.getItem('token');
      console.log('令牌:', token);
      console.log('用户信息:', JSON.parse(localStorage.getItem('user')));

      const response = await fetch(`/api/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        credentials: 'include'
      });

      const requestEndTime = Date.now();
      console.log(`请求耗时: ${requestEndTime - requestStartTime}ms, 状态码: ${response.status}`);

      if (response.ok) {
        console.log('请求成功，开始解析数据...');
        this.tasks = await response.json();
        console.log(`成功加载到 ${this.tasks.length} 个任务`);
        console.log('任务数据:', this.tasks);

        // 转换字段名以保持兼容性 (修改代码)
        this.tasks = this.tasks.map(task => ({
          ...task,
          _id: task.id,
          userId: task.user_id,
          notified: false // 添加提醒状态标记
        }));

        // 新增：自动更新任务状态
        this.autoUpdateTaskStatuses();
      } else if (response.status === 401) {
        // 未授权，10秒后重定向到登录页
        console.log('未授权(401)，清除本地存储，10秒后重定向到登录页');
        console.log('401错误时的令牌:', token);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 10000);
      } else {
        console.log(`加载任务失败，状态码: ${response.status}`);
        // 尝试获取错误信息
        try {
          const errorData = await response.json();
          console.log('错误信息:', errorData);
        } catch (e) {
          console.log('无法解析错误响应');
        }
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  },

  // 新增：自动更新所有任务状态
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
    console.log('taskId',taskId);
    try {
    // 从本地存储获取令牌
    const token = localStorage.getItem('token');
    
    if (status !== '已完成') {
      // 取消勾选时，直接计算并设置正确的状态
      const task = this.tasks.find(t => t._id === taskId);
      if (task) {
        const now = new Date();
        const startTime = new Date(task.startTime);
        const endTime = new Date(task.endTime);
        let newStatus = '未开始';
        
        if (now >= startTime && now < endTime) {
          newStatus = '进行中';
        } else if (now >= endTime) {
          newStatus = '已结束';
        }
        
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token  // 包含令牌
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }) // 直接设置计算出的状态
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
      }
    } else {
      // 勾选完成时，直接设置状态
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token  // 包含令牌
        },
        credentials: 'include',
        body: JSON.stringify({ status }) // 直接使用传入的状态
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
    }
  } catch (error) {
    console.error('更新任务状态失败:', error);
  }
  },

  // 新增：检查任务截止时间并发送提醒
  checkTaskDeadlines() {
    console.log('开始检查任务截止时间');
    const now = new Date();
    const oneHour = 3600000; // 1小时的毫秒数

    this.tasks.forEach(task => {
      // 跳过已完成、已提醒或无结束时间的任务
      if (task.status === '已完成') {
        console.log(`任务 ${task.title} 已完成，跳过提醒`);
        return;
      }
      if (task.notified) {
        console.log(`任务 ${task.title} 已提醒，跳过`);
        return;
      }
      if (!task.endTime) {
        console.log(`任务 ${task.title} 无结束时间，跳过`);
        return;
      }

      const endTime = new Date(task.endTime);
      const timeDiff = endTime - now;

      // 如果任务将在1小时内结束且尚未提醒
      if (timeDiff > 0 && timeDiff <= oneHour) {
        console.log(`任务 ${task.title} 将在1小时内结束，发送提醒`);
        this.showExpiringAlert(task);
        task.notified = true; // 标记为已提醒，避免重复弹窗
      } else if (timeDiff <= 0) {
        console.log(`任务 ${task.title} 已过期`);
      } else {
        console.log(`任务 ${task.title} 距离结束还有 ${Math.ceil(timeDiff / oneHour)} 小时`);
      }
    });
  },

  // 新增：显示任务即将结束弹窗
  showExpiringAlert(task) {
    console.log(`显示任务 ${task.title} 的即将结束弹窗`);
    // 检查浏览器是否支持Notification API
    if (!('Notification' in window)) {
        console.log('浏览器不支持系统通知功能');
        alert('您的浏览器不支持系统通知功能');
        return;
    }

    // 检查通知权限
    console.log(`通知权限状态: ${Notification.permission}`);
    if (Notification.permission !== 'granted') {
        console.log('请求通知权限');
        Notification.requestPermission().then(permission => {
            console.log(`权限请求结果: ${permission}`);
        });
        return;
    }

    // 创建系统通知
    try {
        console.log(`创建系统通知: 任务 ${task.title} 即将到期`);
        // 简化通知配置
        const notification = new Notification('任务即将到期', {
            body: `任务: ${task.title}\n截止时间: ${this.formatDateTime(new Date(task.endTime))}`,
            // 移除可能导致问题的配置
            requireInteraction: false,
            silent: false
        });

        // 添加更多事件监听器
        notification.onshow = () => {
            console.log('通知显示成功');
        };

        notification.onerror = (error) => {
            console.error('通知错误:', error);
        };

        notification.onclose = () => {
            console.log('通知关闭');
        };

        notification.onclick = () => {
            console.log('通知被点击');
            window.focus();
            notification.close();
        };
    } catch (error) {
        console.error('创建通知失败:', error);
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
      case '已归档':contentArea.classList.add('yellow-bg');break;
      case '个人':contentArea.classList.add('green-bg');break;
      case '工作':contentArea.classList.add('blue-bg');break;
      case '重要':contentArea.classList.add('red-bg');break;
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

    // 添加模态框关闭按钮事件
    document.querySelector('.close-btn').addEventListener('click', () => {
        this.hideAddTaskModal();
    });
    // 添加登出按钮事件
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        }
    });

    // 任务状态切换
    document.getElementById('taskList').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const taskId = e.target.dataset.id;
        this.updateTaskStatus(taskId, e.target.checked ? '已完成' : '未开始');
      }
    });

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

    // 添加新任务
    document.getElementById('addTaskBtn').addEventListener('click', () => {
      this.showAddTaskModal();
    });

    // 提交新任务
    document.getElementById('taskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.currentEditingTaskId) {
        this.updateTask(this.currentEditingTaskId);
      } else {
        this.addNewTask();
      }
    });
  },


  // 删除任务
  async deleteTask(taskId) {
    if (!confirm('确定要删除这个任务吗？')) return;

    try {
      // 从本地存储获取令牌
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token  // 包含令牌
        },
        credentials: 'include'
      });

      if (response.ok) {
        this.tasks = this.tasks.filter(task => task._id !== taskId);
        this.renderTaskCategories();
        this.renderTasks();
      }
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  },

  // 显示添加任务模态框
  showAddTaskModal() {
    document.getElementById('taskModal').style.display = 'block';
    
    // 只有在非编辑模式下才设置默认时间
    if (!this.currentEditingTaskId) {
        // 设置开始时间默认值为当前时间
        const now = new Date();
        
        // 手动格式化本地时间为YYYY-MM-DDTHH:MM格式
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const formattedNow = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('taskStartTime').value = formattedNow;
      
        // 修改：设置结束时间默认值为1天后
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        
        const tomorrowYear = tomorrow.getFullYear();
        const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowHours = String(tomorrow.getHours()).padStart(2, '0');
        const tomorrowMinutes = String(tomorrow.getMinutes()).padStart(2, '0');
        
        const formattedTomorrow = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T${tomorrowHours}:${tomorrowMinutes}`;
        document.getElementById('taskEndTime').value = formattedTomorrow;
    }
},

  // 隐藏添加任务模态框
  hideAddTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('taskForm').reset();
    this.currentEditingTaskId = null; // 重置编辑状态
  },

  // 添加新任务
  async addNewTask() {
    try {
      console.log('开始添加新任务...');
      
      // 生成UUID作为任务ID
      const taskId = this.generateUUID();
      
      // 从表单获取任务数据
      const title = document.getElementById('taskTitle').value;
      const priority = document.getElementById('taskPriority').value;
      const notes = document.getElementById('taskNotes').value;
      const startTime = document.getElementById('taskStartTime').value || new Date().toISOString();
      const endTime = document.getElementById('taskEndTime').value;
      const tags = Array.from(document.querySelectorAll('input[name="taskTag"]:checked')).map(el => el.value);
      const starred = document.getElementById('taskStarred').checked;
      
      if (!title) {
        alert('请输入任务标题');
        return;
      }
      
      // 准备任务数据
      const newTask = {
        id: taskId,
        userId: this.userId,
        title: title,
        status: '未开始',
        startTime: startTime,
        endTime: endTime ? endTime : null,
        tags: tags || [],
        priority: priority || '中',
        notes: notes,
        starred: starred,
        createdAt: new Date().toISOString()
      };
      
      // 从本地存储获取令牌
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(newTask),
        credentials: 'include'
      });
  
      if (response.ok) {
        const addedTask = await response.json();
        // 添加字段映射
        const mappedTask = {
          ...addedTask,
          _id: addedTask.id,
          userId: addedTask.user_id
        };
        this.tasks.push(mappedTask);
        this.hideAddTaskModal();
        this.renderTaskCategories();
        this.renderTasks();
      } else {
        // 添加错误处理
        const error = await response.json();
        alert('保存任务失败: ' + (error.msg || '未知错误'));
      }
    } catch (error) {
      console.error('添加任务失败:', error);
      alert('网络错误，无法保存任务');
    }
  },
  // 添加编辑任务方法
editTask(taskId) {
    const task = this.tasks.find(t => t._id === taskId);
    if (!task) return;

    // 填充表单数据
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskNotes').value = task.notes || '';
    
    // 手动格式化开始时间
    if (task.startTime) {
        const startTime = new Date(task.startTime);
        const year = startTime.getFullYear();
        const month = String(startTime.getMonth() + 1).padStart(2, '0');
        const day = String(startTime.getDate()).padStart(2, '0');
        const hours = String(startTime.getHours()).padStart(2, '0');
        const minutes = String(startTime.getMinutes()).padStart(2, '0');
        const formattedStartTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('taskStartTime').value = formattedStartTime;
    } else {
        document.getElementById('taskStartTime').value = '';
    }
    
    // 手动格式化结束时间
    if (task.endTime) {
        const endTime = new Date(task.endTime);
        const year = endTime.getFullYear();
        const month = String(endTime.getMonth() + 1).padStart(2, '0');
        const day = String(endTime.getDate()).padStart(2, '0');
        const hours = String(endTime.getHours()).padStart(2, '0');
        const minutes = String(endTime.getMinutes()).padStart(2, '0');
        const formattedEndTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('taskEndTime').value = formattedEndTime;
    } else {
        document.getElementById('taskEndTime').value = '';
    }
    
    document.getElementById('taskStarred').checked = task.starred || false;

    // 处理标签复选框
    const tagCheckboxes = document.querySelectorAll('input[name="taskTag"]');
    tagCheckboxes.forEach(checkbox => {
        checkbox.checked = task.tags.includes(checkbox.value);
    });

    // 设置当前编辑任务ID
    this.currentEditingTaskId = taskId;

    // 显示模态框
    this.showAddTaskModal();
},

  // 更新任务方法
async updateTask(taskId) {
    const title = document.getElementById('taskTitle').value;
    const priority = document.getElementById('taskPriority').value;
    const notes = document.getElementById('taskNotes').value;
    const startTime = document.getElementById('taskStartTime').value;
    const endTime = document.getElementById('taskEndTime').value;
    const tags = Array.from(document.querySelectorAll('input[name="taskTag"]:checked')).map(el => el.value);
    const starred = document.getElementById('taskStarred').checked;

    if (!title) {
        alert('请输入任务标题');
        return;
    }

    const updatedTask = {
        title,
        priority,
        notes,
        tags,
        startTime: startTime ? startTime : null,
        endTime: endTime ? endTime : null,
        starred
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token  // 包含令牌
            },
            credentials: 'include',
            body: JSON.stringify(updatedTask)
        });

        if (response.ok) {
            const task = await response.json();
            // 字段映射
            const mappedTask = {
                ...task,
                _id: task.id,
                userId: task.user_id
            };
            const index = this.tasks.findIndex(t => t._id === taskId);
            if (index !== -1) {
                this.tasks[index] = mappedTask;
                // 新增：更新任务状态
                this.autoUpdateTaskStatuses();
                this.hideAddTaskModal();
                this.renderTaskCategories();
                this.renderTasks();
                this.currentEditingTaskId = null; // 重置编辑状态
            }
        } else {
            const error = await response.json();
            alert('更新任务失败: ' + (error.msg || '未知错误'));
        }
    } catch (error) {
        console.error('更新任务失败:', error);
        alert('网络错误，无法更新任务');
    }
},
// 生成UUID
generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
              v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
},
// 检查通知权限状态
checkNotificationPermission() {
  // 检查浏览器是否支持Notification API
  if (!('Notification' in window)) {
    console.log('您的浏览器不支持系统通知功能');
    return;
  }

  // 检查权限状态
  if (Notification.permission === 'granted') {
    console.log('通知权限已授予');
  } else if (Notification.permission === 'denied') {
    console.log('通知权限已拒绝');
    this.showPermissionDeniedAlert();
  } else {
    console.log('通知权限尚未决定');
  }
},

// 显示权限被拒绝的提示
showPermissionDeniedAlert() {
  // 这里可以实现一个提示用户如何启用通知权限的方法
  console.log('请在浏览器设置中启用通知权限以接收任务提醒');
}



};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  TaskManager.init();
});


