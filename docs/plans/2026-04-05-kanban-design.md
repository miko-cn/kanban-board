# Kanban Board 设计文档

> AI Agent Friendly Personal Kanban System

---

## 1. 项目概述

### 核心定位
一个简约的、对 AI Agent 友好的个人 Kanban 管理工具，支持任务拖拽、状态流转、数据可被 AI 直接读取和操作。

### 目标用户
- 个人任务管理
- AI Agent 自动化任务管理（如自动添加/更新任务）

---

## 2. 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS + shadcn/ui
- **动画**: Framer Motion
- **拖拽**: @dnd-kit/core

### 后端
- **框架**: Fastify (轻量高性能)
- **存储**: JSON 文件存储
- **端口**: 3001
- **CORS**: 支持前端开发服务器

### 项目结构
```
kanban-board/
├── frontend/          # Vite + React
├── backend/           # Fastify API
└── data/             # JSON 数据存储
```

---

## 3. 数据模型

### Board (看板)
```typescript
interface Board {
  id: string;
  name: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}
```

### Column (列)
```typescript
interface Column {
  id: string;
  name: string;        // e.g., "待办", "进行中", "已完成"
  order: number;       // 排序
  color?: string;      // 可选列颜色
}
```

### Card (卡片)
```typescript
interface Card {
  id: string;
  columnId: string;    // 所属列
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: string;   // ISO date
  order: number;       // 列内排序
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. API 设计

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/boards | 获取所有看板 |
| POST | /api/boards | 创建看板 |
| GET | /api/boards/:id | 获取看板详情（含列和卡片） |
| PUT | /api/boards/:id | 更新看板 |
| DELETE | /api/boards/:id | 删除看板 |
| POST | /api/boards/:id/columns | 添加列 |
| PUT | /api/columns/:id | 更新列 |
| DELETE | /api/columns/:id | 删除列 |
| POST | /api/cards | 创建卡片 |
| PUT | /api/cards/:id | 更新卡片 |
| DELETE | /api/cards/:id | 删除卡片 |
| PUT | /api/cards/:id/move | 移动卡片（跨列/列内排序） |

### AI 友好设计
- 所有响应为纯 JSON，无 HTML 渲染
- 支持批量操作
- 错误信息明确，便于 AI 解析

---

## 5. 前端设计方向

### 视觉风格
- **Tone**: Brutally Minimal（极简粗犷）
- **主题**: 支持日间/夜间模式切换
  - 夜间: 深色背景 (#0a0a0a)，浅色文字
  - 日间: 浅色背景 (#fafafa)，深色文字
- **强调色**: 单一高亮色（如琥珀色 #f59e0b）
- **字体**: 无衬线 + 等宽混搭

### 布局
- 左侧：看板列表
- 右侧：看板视图（列 + 卡片）

### 交互
- 卡片拖拽跨列
- 快速添加（快捷键）
- 卡片展开详情

### 动效
- 拖拽时的流畅过渡
- 卡片hover微动效

---

## 6. MVP 功能范围

### 必须
- [ ] 创建/查看/删除看板
- [ ] 添加/编辑/删除列
- [ ] 添加/编辑/删除卡片
- [ ] 拖拽卡片跨列移动
- [ ] 列内卡片排序

### 可选（后续迭代）
- [ ] 卡片优先级筛选
- [ ] 标签过滤
- [ ] 截止日提醒

---

## 7. 部署

- 前端: Vite build → 静态文件托管
- 后端: Node 服务，可与前端同机部署

---

*设计日期: 2026-04-05*
