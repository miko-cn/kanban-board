# Kanban Board 实现计划

> 日期: 2026-04-05

---

## 实现顺序

```
后端 → 前端基础 → 前端功能 → 集成测试
```

---

## 阶段 1: 后端 API (Fastify)

### 任务 1.1: 项目初始化
- [ ] 初始化 backend 目录，package.json
- [ ] 安装 fastify, @fastify/cors, pino
- [ ] 创建 data/ 目录
- [ ] 编写 index.js 入口，基础服务器配置

### 任务 1.2: Board API
- [ ] 编写测试: GET /api/boards 返回空数组
- [ ] 实现: GET /api/boards（读取 data/boards.json）
- [ ] 编写测试: POST /api/boards 创建看板
- [ ] 实现: POST /api/boards
- [ ] 编写测试: GET /api/boards/:id
- [ ] 实现: GET /api/boards/:id
- [ ] 编写测试: PUT /api/boards/:id
- [ ] 实现: PUT /api/boards/:id
- [ ] 编写测试: DELETE /api/boards/:id
- [ ] 实现: DELETE /api/boards/:id

### 任务 1.3: Column API
- [ ] 编写测试: POST /api/boards/:id/columns
- [ ] 实现: 添加列到看板
- [ ] 编写测试: PUT /api/columns/:id
- [ ] 实现: 更新列（名称、颜色、排序）
- [ ] 编写测试: DELETE /api/columns/:id
- [ ] 实现: 删除列（同时删除列内所有卡片）

### 任务 1.4: Card API
- [ ] 编写测试: POST /api/cards
- [ ] 实现: 创建卡片
- [ ] 编写测试: GET /api/cards/:id
- [ ] 实现: 获取卡片详情
- [ ] 编写测试: PUT /api/cards/:id
- [ ] 实现: 更新卡片
- [ ] 编写测试: DELETE /api/cards/:id
- [ ] 实现: 删除卡片

### 任务 1.5: Card Move API
- [ ] 编写测试: PUT /api/cards/:id/move
- [ ] 实现: 移动卡片（跨列 + 排序）
- [ ] 验证: 数据持久化正确

---

## 阶段 2: 前端基础 (Vite + React)

### 任务 2.1: 项目初始化
- [ ] 使用 frontend-design-ultimate skill 初始化 Vite 项目
- [ ] 配置 Tailwind CSS
- [ ] 安装 shadcn/ui 基础组件
- [ ] 安装 @dnd-kit/core, @dnd-kit/sortable
- [ ] 安装 axios

### 任务 2.2: 主题系统
- [ ] 实现日间/夜间模式切换
- [ ] 使用 CSS 变量管理主题色
- [ ] 本地存储记住用户偏好

### 任务 2.3: API 客户端
- [ ] 创建 api/client.ts
- [ ] 配置 baseURL 和拦截器
- [ ] 封装 boards, columns, cards API 方法

### 任务 2.4: 布局框架
- [ ] 左侧：看板列表侧边栏
- [ ] 右侧：看板内容区
- [ ] 响应式布局（移动端适配）

---

## 阶段 3: 前端功能

### 任务 3.1: 看板列表
- [ ] 展示所有看板
- [ ] 创建新看板
- [ ] 删除看板

### 任务 3.2: 看板视图
- [ ] 展示列（按 order 排序）
- [ ] 添加/编辑/删除列
- [ ] 列颜色自定义

### 任务 3.3: 卡片 CRUD
- [ ] 卡片列表（按 order 排序）
- [ ] 创建卡片（弹窗/内联）
- [ ] 编辑卡片详情
- [ ] 删除卡片

### 任务 3.4: 拖拽功能
- [ ] 卡片拖拽跨列
- [ ] 列内卡片排序
- [ ] 拖拽时视觉反馈

### 任务 3.5: 主题切换
- [ ] 切换按钮
- [ ] 平滑过渡动画

---

## 阶段 4: 集成测试

### 任务 4.1: 端到端测试
- [ ] 创建看板 → 添加列 → 添加卡片
- [ ] 拖拽卡片到新列
- [ ] 刷新页面数据持久化
- [ ] 日间/夜间模式切换

### 任务 4.2: 部署
- [ ] 前端 build
- [ ] 后端启动验证

---

## 预计时间

| 阶段 | 任务数 | 预计时间 |
|------|--------|----------|
| 后端 | 15 | ~2h |
| 前端基础 | 4 | ~1h |
| 前端功能 | 5 | ~2h |
| 集成 | 2 | ~30m |

---

## 执行模式

选择执行方式：
- **A**: 我用 subagent 逐个任务执行（每任务 TDD）
- **B**: 手动执行，你来跑命令

选哪个？