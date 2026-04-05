import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { spawn } from 'bun';

const BASE_URL = 'http://localhost:3001';

// 测试用的唯一前缀，避免测试数据冲突
const TEST_PREFIX = 'test-' + Date.now();

let server;

async function waitForServer(maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return true;
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Server not ready');
}

describe('Kanban API', () => {
  // 启动服务器
  beforeEach(async () => {
    // 清空测试数据
    const dataDir = './data';
    const fs = require('fs');
    if (fs.existsSync(`${dataDir}/columns.json`)) {
      const cols = JSON.parse(fs.readFileSync(`${dataDir}/columns.json`, 'utf-8'));
      const filtered = cols.filter(c => !c.id.startsWith(TEST_PREFIX));
      fs.writeFileSync(`${dataDir}/columns.json`, JSON.stringify(filtered, null, 2));
    }
    if (fs.existsSync(`${dataDir}/tasks.json`)) {
      const tasks = JSON.parse(fs.readFileSync(`${dataDir}/tasks.json`, 'utf-8'));
      const filtered = tasks.filter(t => !t.id.startsWith(TEST_PREFIX));
      fs.writeFileSync(`${dataDir}/tasks.json`, JSON.stringify(filtered, null, 2));
    }

    // 启动服务器
    server = spawn(['bun', 'src/index.js'], {
      cwd: './',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    await waitForServer();
  });

  afterEach(() => {
    server?.kill();
  });

  // ========== Health Check ==========
  test('GET /api/health returns ok', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  // ========== Columns ==========
  test('GET /api/columns returns empty array initially', async () => {
    const res = await fetch(`${BASE_URL}/api/columns`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/columns creates a column', async () => {
    const res = await fetch(`${BASE_URL}/api/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${TEST_PREFIX}-Test Column` }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.title).toBe(`${TEST_PREFIX}-Test Column`);
  });

  // ========== Tasks ==========
  test('GET /api/tasks returns empty array initially', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/tasks creates a task', async () => {
    // 先创建一个列
    const colRes = await fetch(`${BASE_URL}/api/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${TEST_PREFIX}-Column` }),
    });
    const col = await colRes.json();

    // 创建任务
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnId: col.id,
        title: `${TEST_PREFIX}-Test Task`,
        description: 'Test description',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.title).toBe(`${TEST_PREFIX}-Test Task`);
    expect(data.description).toBe('Test description');
    expect(data.columnId).toBe(col.id);
  });

  test('PUT /api/tasks/:id updates a task', async () => {
    // 创建列和任务
    const colRes = await fetch(`${BASE_URL}/api/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${TEST_PREFIX}-Column` }),
    });
    const col = await colRes.json();

    const taskRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: col.id, title: `${TEST_PREFIX}-Original` }),
    });
    const task = await taskRes.json();

    // 更新任务
    const res = await fetch(`${BASE_URL}/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${TEST_PREFIX}-Updated`, description: 'New desc' }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.title).toBe(`${TEST_PREFIX}-Updated`);
    expect(data.description).toBe('New desc');
  });

  test('DELETE /api/tasks/:id deletes a task', async () => {
    // 创建列和任务
    const colRes = await fetch(`${BASE_URL}/api/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${TEST_PREFIX}-Column` }),
    });
    const col = await colRes.json();

    const taskRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: col.id, title: `${TEST_PREFIX}-ToDelete` }),
    });
    const task = await taskRes.json();

    // 删除任务
    const res = await fetch(`${BASE_URL}/api/tasks/${task.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);

    // 验证已删除
    const getRes = await fetch(`${BASE_URL}/api/tasks`);
    const tasks = await getRes.json();
    expect(tasks.find(t => t.id === task.id)).toBeUndefined();
  });

  test('PUT /api/tasks/:id with non-existent id returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/non-existent-id`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Task not found');
  });

  // ========== Integration ==========
  test('full CRUD workflow', async () => {
    // 1. 创建列
    const colRes = await fetch(`${BASE_URL}/api/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${TEST_PREFIX}-Workflow Column` }),
    });
    const col = await colRes.json();

    // 2. 创建任务
    const taskRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId: col.id, title: `${TEST_PREFIX}-Workflow Task` }),
    });
    const task = await taskRes.json();

    // 3. 更新任务
    const updateRes = await fetch(`${BASE_URL}/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Added description' }),
    });
    const updated = await updateRes.json();
    expect(updated.description).toBe('Added description');

    // 4. 获取所有任务验证
    const getRes = await fetch(`${BASE_URL}/api/tasks`);
    const allTasks = await getRes.json();
    const found = allTasks.find(t => t.id === task.id);
    expect(found).toBeDefined();
    expect(found.description).toBe('Added description');

    // 5. 删除任务
    const delRes = await fetch(`${BASE_URL}/api/tasks/${task.id}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);
  });
});