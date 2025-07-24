# Web-API 项目
## 项目概述
这是一个基于 Node.js 和 Express 的 Web API 项目，用于管理用户的任务列表。项目使用 Supabase 作为数据库，提供了用户认证、任务管理和提醒时间设置等功能。

## 技术栈
- 后端 : Node.js, Express
- 数据库 : Supabase
- 认证 : JWT (JSON Web Tokens)
- 密码加密 : bcryptjs
- 其他依赖 : body-parser, cors, dotenv, mongoose, uuid
## 项目结构
```
Web-API/
├── .gitignore
├── config/
│   └── supabase.js
├── docker-compose.yml
├── middleware/
│   └── auth.js
├── package-lock.json
├── package.json
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── todolist.css
│   ├── index.html
│   ├── js/
│   │   ├── main.js
│   │   └── todolist.js
│   └── todolist.html
├── routes/
│   ├── auth.js
│   ├── tasks.js
│   └── users.js
├── server.js
├── supabase/
│   └── migrations/
│       └── 
20250718095506_frosty_lantern.sql
├── vercel.json
└── 任务要求.txt
```
## 功能特点
1. 1.
   用户认证
   
   - 注册新用户
   - 用户登录
   - JWT 认证中间件
2. 2.
   任务管理
   
   - 获取用户的所有任务
   - 创建新任务
   - 更新任务
   - 删除任务
3. 3.
   用户设置
   
   - 获取用户提醒时间
   - 保存用户提醒时间
4. 4.
   前端界面
   
   - 提供了 todolist.html 作为前端界面
   - 响应式设计
## 如何运行
1. 1.
   克隆项目
```
git clone <项目地址>
cd Web-API
```
2. 1.
   安装依赖
```
npm install
```
3. 1.
   配置环境变量
创建 .env 文件，并添加以下内容：

```
PORT=5000
SUPABASE_URL=<你的Supabase URL>
SUPABASE_KEY=<你的Supabase密钥>
JWT_SECRET=<你的JWT密钥>
```
4. 1.
   运行项目
```
npm start
```
## API 文档
### 认证 API
- 注册 : POST /api/auth/register
  
  - body 参数: name , email , password , user_id
  - 响应: { "msg": "注册成功" } 或错误信息
- 登录 : POST /api/auth/login
  
  - body 参数: email , password
  - 响应: 包含 JWT 令牌的对象 或错误信息
### 任务 API
- 获取所有任务 : GET /api/tasks
  
  - headers: Authorization: Bearer <JWT令牌>
  - 响应: 任务列表 或错误信息
- 创建任务 : POST /api/tasks
  
  - headers: Authorization: Bearer <JWT令牌>
  - body 参数: id , userId , title , status , startTime , endTime , tags , priority , notes , starred
  - 响应: 创建的任务 或错误信息
- 更新任务 : PUT /api/tasks/:id
  
  - headers: Authorization: Bearer <JWT令牌>
  - body 参数: 要更新的任务字段
  - 响应: 更新后的任务 或错误信息
- 删除任务 : DELETE /api/tasks/:id
  
  - headers: Authorization: Bearer <JWT令牌>
  - 响应: 成功信息 或错误信息
### 用户设置 API
- 获取提醒时间 : GET /api/users/:userId/remindTime
  
  - headers: Authorization: Bearer <JWT令牌>
  - 响应: { "remindTime": <分钟数> } 或错误信息
- 保存提醒时间 : POST /api/users/:userId/remindTime
  
  - headers: Authorization: Bearer <JWT令牌>
  - body 参数: remindTime
  - 响应: { "msg": "保存成功", "remindTime": <分钟数> } 或错误信息
## 部署说明
项目可以部署在 Vercel、Heroku 或其他支持 Node.js 的平台上。

1. 1.
   确保所有依赖都在 package.json 中列出
2. 2.
   配置环境变量
3. 3.
   部署代码
## 贡献
欢迎贡献代码，提出问题或建议。

## 许可证
本项目使用 MIT 许可证。