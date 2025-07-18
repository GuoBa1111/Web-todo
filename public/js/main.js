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
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        registerMessage.textContent = data.msg;
        registerMessage.style.color = res.ok ? 'green' : 'red';

        // 注册成功后切换到登录表单
        if (res.ok) {
            setTimeout(() => {
                loginBtn.click();
            }, 1500);
        }
    } catch (err) {
        registerMessage.textContent = '注册失败，请重试';
    }
});

// 登录表单提交
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

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
            // 保存用户信息到本地存储
            localStorage.setItem('user', JSON.stringify(data.user));
            // 跳转到todolist页面
            setTimeout(() => {
                window.location.href = '/todolist.html';
            }, 1000);
        }
    } catch (err) {
        loginMessage.textContent = '登录失败，请重试';
    }
});