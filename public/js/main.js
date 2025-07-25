// DOM元素
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');

// 切换表单
loginBtn.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
});

registerBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
});

// 注册表单提交
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 输入验证
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    // 前端验证
    if (!name.trim()) {
        registerMessage.textContent = '请输入姓名';
        registerMessage.style.color = 'red';
        return;
    }
    
    if (!email.trim() || !isValidEmail(email)) {
        registerMessage.textContent = '请输入有效的邮箱地址';
        registerMessage.style.color = 'red';
        return;
    }
    
    if (password.length < 6) {
        registerMessage.textContent = '密码长度至少6位';
        registerMessage.style.color = 'red';
        return;
    }

    try {
        // 生成UUID作为user_id
        const user_id = generateUUID();
        
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, user_id })
        });

        const data = await res.json();
        registerMessage.textContent = data.msg;
        registerMessage.style.color = res.ok ? 'green' : 'red';

        // 注册成功后切换到登录表单
        if (res.ok) {
            // 清空表单
            registerForm.reset();
            setTimeout(() => {
                loginBtn.click();
            }, 1500);
        }
    } catch (err) {
        console.error('注册错误:', err);
        registerMessage.textContent = '网络连接失败，请检查网络后重试';
        registerMessage.style.color = 'red';
    }
});

// 登录表单提交
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // 前端验证
    if (!email.trim() || !isValidEmail(email)) {
        loginMessage.textContent = '请输入有效的邮箱地址';
        loginMessage.style.color = 'red';
        return;
    }

    if (!password.trim()) {
        loginMessage.textContent = '请输入密码';
        loginMessage.style.color = 'red';
        return;
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        loginMessage.textContent = data.msg;
        loginMessage.style.color = res.ok ? 'green' : 'red';

        // 登录成功后的处理 - 添加页面跳转
        if (res.ok) {
            // 安全地保存用户信息和令牌到本地存储
            const userInfo = {
                user_id: data.user.user_id,
                name: data.user.name,
                email: data.user.email,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('user', JSON.stringify(userInfo));
            localStorage.setItem('token', data.token);

            // 跳转到todolist页面
            setTimeout(() => {
                window.location.href = '/todolist.html';
            }, 1000);
        }
    } catch (err) {
        console.error('登录错误:', err);
        loginMessage.textContent = '网络连接失败，请检查网络后重试';
        loginMessage.style.color = 'red';
    }
});

// 邮箱验证函数
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 生成UUID函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}