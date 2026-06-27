# 知序 - AI 智能刷题平台

一个基于 Vue3 + Node.js + MySQL 的在线刷题平台，支持 Word 文档 AI 智能解析拆题，提供顺序刷题、随机刷题、错题本等多种学习模式。

## 功能特性

### 🎯 核心功能
- **Word 智能解析**：支持 .doc/.docx 格式，AI 自动识别题干、选项、答案、解析
- **双模式刷题**：顺序刷题（按原文档顺序）、随机刷题（打乱顺序）
- **错题本管理**：自动收集错题，支持标记重点，反复练习
- **学习统计**：实时显示正确率、做题进度，云端保存学习记录

### 👥 用户权限
- **游客模式**：无需注册即可体验，数据仅保存在当前会话（sessionStorage），刷新页面后数据清除
- **注册用户**：所有数据云端保存，支持多设备同步，历史记录永久保存

### 📱 页面结构
- 首页：功能介绍、上传文档入口、登录注册入口
- 文档上传 & AI 解析页：文件上传、解析进度、试题预览编辑
- 刷题主页面：试题展示、选项作答、模式切换、错题标记、解析弹窗
- 个人中心：我的题库、错题本、刷题数据统计、账号设置

## 技术栈

### 前端
- Vue 3 + Composition API
- Vite 构建工具
- Vue Router 路由管理
- Pinia 状态管理
- Element Plus UI 组件库
- Axios HTTP 客户端

### 后端
- Node.js + Express
- MySQL 数据库
- JWT 身份认证
- Multer 文件上传
- Bcrypt 密码加密
- Mammoth Word 文档解析

### AI 服务
- 讯飞星辰 MaaS 平台
- 支持模型：xopqwen36v35b（默认）

## 项目结构

```
知序/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── components/    # 公共组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # 状态管理
│   │   ├── utils/         # 工具函数
│   │   ├── views/         # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/               # 后端项目
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── routes/            # 路由
│   ├── services/          # 业务服务
│   ├── utils/             # 工具函数
│   ├── app.js             # 入口文件
│   ├── package.json
│   └── .env.example       # 环境变量示例
├── database/              # 数据库
│   └── init.sql           # 初始化脚本
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7
- npm 或 yarn

### 一、数据库初始化

1. 创建数据库并导入表结构：

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source /path/to/知序/database/init.sql
```

或使用命令行直接导入：

```bash
mysql -u root -p < database/init.sql
```

### 二、后端配置

1. 进入后端目录并安装依赖：

```bash
cd backend
npm install
```

2. 复制环境变量配置文件：

```bash
cp .env.example .env
```

3. 修改 `.env` 文件，配置数据库连接和 AI API 密钥：

```env
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=zhixu

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 讯飞星辰 AI 配置
XUNFEI_API_URL=https://maas-api.cn-huabei-1.xf-yun.com/v2
XUNFEI_API_KEY=your_api_key
XUNFEI_MODEL=xopqwen36v35b

# SMTP 邮件配置（找回密码功能需要）
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your_email@qq.com
SMTP_PASS=your_email_password
```

4. 启动后端服务：

```bash
npm start
```

后端服务将运行在 `http://localhost:3001`

### 三、前端配置

1. 进入前端目录并安装依赖：

```bash
cd frontend
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

前端服务将运行在 `http://localhost:5173`

3. 构建生产版本：

```bash
npm run build
```

## AI 接口对接方案

### 讯飞星辰 MaaS 平台接入

#### 1. 注册账号
访问 [讯飞开放平台](https://www.xfyun.cn/) 注册账号并开通 MaaS 服务。

#### 2. 获取 API Key
在控制台创建应用，获取 API Key。

#### 3. 配置环境变量
在后端 `.env` 文件中配置：

```env
XUNFEI_API_URL=https://maas-api.cn-huabei-1.xf-yun.com/v2
XUNFEI_API_KEY=your_api_key_here
XUNFEI_MODEL=xopqwen36v35b
```

#### 4. 支持的模型
- `xopqwen36v35b` - 通义千问 36B（默认）
- 可根据实际开通的模型修改配置

#### 5. 接口说明

**请求方式**：POST

**请求地址**：`{XUNFEI_API_URL}/chat/completions`

**请求头**：
```
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

**请求体**：
```json
{
  "model": "xopqwen36v35b",
  "messages": [
    {
      "role": "user",
      "content": "prompt 内容"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 4000
}
```

#### 6. 降级方案
当 AI 服务不可用时，系统会自动切换到基于规则的解析方案（`parseQuestionsFallback`），支持以下格式的题目：

- 题号格式：`1.`、`（1）`、`第1题`
- 选项格式：`A.`、`B.` 等
- 答案格式：`答案：A`、`答案：正确`
- 解析格式：`解析：xxx`、`分析：xxx`

## API 接口文档

### 用户模块

| 接口 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|
| 注册 | POST | /api/auth/register | 用户注册 | 否 |
| 登录 | POST | /api/auth/login | 用户登录 | 否 |
| 发送重置密码邮件 | POST | /api/auth/forgot-password | 发送重置密码邮件 | 否 |
| 重置密码 | POST | /api/auth/reset-password | 重置密码 | 否 |
| 获取用户信息 | GET | /api/user/profile | 获取当前用户信息 | 是 |
| 更新用户信息 | PUT | /api/user/profile | 更新用户信息 | 是 |
| 修改密码 | PUT | /api/user/password | 修改密码 | 是 |
| 获取统计数据 | GET | /api/user/stats | 获取学习统计数据 | 是 |
| 刷题历史 | GET | /api/user/practice-history | 获取刷题历史记录 | 是 |

### 上传模块

| 接口 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|
| 上传 Word（登录） | POST | /api/upload/word | 上传并解析 Word 文档 | 是 |
| 上传 Word（游客） | POST | /api/upload/word/guest | 游客模式上传解析 | 否 |

### 题库模块

| 接口 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|
| 题库列表 | GET | /api/bank/list | 获取我的题库列表 | 是 |
| 题库详情 | GET | /api/bank/:id | 获取题库详情和题目 | 是 |
| 更新题目 | PUT | /api/bank/:id/question/:questionId | 更新题目信息 | 是 |
| 删除题库 | DELETE | /api/bank/:id | 删除题库 | 是 |

### 刷题模块

| 接口 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|
| 开始刷题 | POST | /api/practice/start | 开始一次刷题 | 是 |
| 提交答案 | POST | /api/practice/submit | 提交题目答案 | 是 |
| 结束刷题 | POST | /api/practice/end | 结束刷题 | 是 |
| 获取记录 | GET | /api/practice/record/:id | 获取刷题记录详情 | 是 |
| 错题列表 | GET | /api/practice/wrong-questions | 获取错题本 | 是 |
| 移除错题 | DELETE | /api/practice/wrong-questions/:questionId | 从错题本移除 | 是 |

## 部署教程

### 一、服务器环境准备

#### 1. 安装 Node.js

```bash
# 使用 NodeSource 安装
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

#### 2. 安装 MySQL

```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# 登录并创建数据库
sudo mysql
```

```sql
CREATE DATABASE zhixu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zhixu'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zhixu.* TO 'zhixu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 导入表结构
mysql -u zhixu -p zhixu < database/init.sql
```

#### 3. 安装 Nginx

```bash
sudo apt-get install nginx
```

### 二、后端部署

1. 上传代码到服务器

2. 安装依赖并配置

```bash
cd /var/www/zhixu/backend
npm install --production
cp .env.example .env
# 修改 .env 配置
```

3. 使用 PM2 管理进程

```bash
npm install -g pm2

# 启动应用
pm2 start app.js --name zhixu-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 三、前端部署

1. 构建生产版本

```bash
cd frontend
npm install
npm run build
```

2. 上传 `dist` 目录到服务器

3. 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/zhixu/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

4. 重启 Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 四、HTTPS 配置（推荐）

使用 Let's Encrypt 免费证书：

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 数据库表结构

### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱 |
| password | VARCHAR(255) | 密码（bcrypt加密） |
| avatar | VARCHAR(255) | 头像 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### question_banks（题库表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| title | VARCHAR(255) | 题库标题 |
| description | TEXT | 描述 |
| file_name | VARCHAR(255) | 原文件名 |
| total_questions | INT | 题目总数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### questions（题目表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| bank_id | INT | 题库ID |
| type | ENUM | 题型：single/multiple/judge |
| stem | TEXT | 题干 |
| options | JSON | 选项数组 |
| answer | VARCHAR(50) | 正确答案 |
| analysis | TEXT | 解析 |
| sort_order | INT | 排序 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### practice_records（刷题记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| bank_id | INT | 题库ID |
| mode | ENUM | 模式：sequential/random |
| current_index | INT | 当前题目索引 |
| total_answered | INT | 已做题数 |
| correct_count | INT | 正确数 |
| wrong_count | INT | 错误数 |
| status | ENUM | 状态：in_progress/completed |
| started_at | TIMESTAMP | 开始时间 |
| ended_at | TIMESTAMP | 结束时间 |

### practice_answers（答题明细表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| record_id | INT | 记录ID |
| question_id | INT | 题目ID |
| user_answer | VARCHAR(50) | 用户答案 |
| is_correct | BOOLEAN | 是否正确 |
| is_marked | BOOLEAN | 是否标记 |
| answered_at | TIMESTAMP | 答题时间 |

### wrong_questions（错题本表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| question_id | INT | 题目ID |
| bank_id | INT | 题库ID |
| wrong_count | INT | 错误次数 |
| last_wrong_at | TIMESTAMP | 最后错误时间 |
| created_at | TIMESTAMP | 创建时间 |

## 后续拓展方向

- 📄 **导出 PDF 试卷**：支持将题库导出为 PDF 格式的试卷
- 📚 **批量导入**：支持一次性上传多个文档，批量创建题库
- 🏷️ **题目分类**：支持题目标签、分类管理
- 📊 **数据可视化**：更丰富的学习数据统计图表
- 👥 **团队功能**：支持班级、小组等团队学习模式
- 📱 **移动端 App**：开发移动端应用

## 常见问题

### Q: 为什么上传 .doc 格式文件失败？
A: 当前版本仅支持 .docx 格式。.doc 格式需要安装 LibreOffice 进行转换，或将文件另存为 .docx 格式后上传。

### Q: AI 解析不准确怎么办？
A: 可以在解析完成后，点击题目旁的「编辑」按钮手动调整。同时系统提供了基于规则的降级解析方案。

### Q: 游客模式的数据会保存吗？
A: 不会。游客模式下所有数据仅保存在当前浏览器会话中，关闭页面或刷新后数据将丢失。建议注册账号以保存数据。

### Q: 如何修改 AI 模型？
A: 在后端 `.env` 文件中修改 `XUNFEI_MODEL` 配置为你开通的模型名称。

## 许可证

MIT License
