import fastify from 'fastify';
import cors from '@fastify/cors';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({ logger: false });

// 配置 CORS
app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// 数据目录
const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(file) {
  const filepath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filepath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  const filepath = path.join(DATA_DIR, file);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// ========== REST API ==========

app.get('/api/health', async () => ({ status: 'ok' }));

app.get('/api/columns', async () => readJson('columns.json'));

app.post('/api/columns', async (request) => {
  const columns = readJson('columns.json');
  const newColumn = { id: nanoid(), title: request.body.title, order: columns.length };
  columns.push(newColumn);
  writeJson('columns.json', columns);
  return newColumn;
});

app.get('/api/tasks', async () => readJson('tasks.json'));

app.post('/api/tasks', async (request) => {
  const tasks = readJson('tasks.json');
  const newTask = {
    id: nanoid(),
    columnId: request.body.columnId,
    title: request.body.title,
    description: request.body.description || '',
    order: tasks.filter(t => t.columnId === request.body.columnId).length
  };
  tasks.push(newTask);
  writeJson('tasks.json', tasks);
  return newTask;
});

app.put('/api/tasks/:id', async (request) => {
  const tasks = readJson('tasks.json');
  const index = tasks.findIndex(t => t.id === request.params.id);
  if (index === -1) {
    throw { statusCode: 404, message: 'Task not found' };
  }
  tasks[index] = { ...tasks[index], ...request.body };
  writeJson('tasks.json', tasks);
  return tasks[index];
});

app.delete('/api/tasks/:id', async (request) => {
  let tasks = readJson('tasks.json');
  tasks = tasks.filter(t => t.id !== request.params.id);
  writeJson('tasks.json', tasks);
  return { success: true };
});

app.post('/api/tasks/archive', async () => {
  const tasks = readJson('tasks.json');
  const columns = readJson('columns.json');
  
  const doneColumn = columns.find(c => 
    c.title.toLowerCase().includes('完成') || c.title.toLowerCase().includes('done')
  );
  if (!doneColumn) throw { statusCode: 400, message: 'No done column found' };
  
  const doneTasks = tasks.filter(t => t.columnId === doneColumn.id);
  if (doneTasks.length === 0) return { archived: 0, message: 'No completed tasks to archive' };
  
  let archived = [];
  const archivePath = path.join(DATA_DIR, 'archive.json');
  if (fs.existsSync(archivePath)) {
    try { archived = JSON.parse(fs.readFileSync(archivePath, 'utf-8')); } catch {}
  }
  
  const archivedTasks = doneTasks.map(t => ({ ...t, archivedAt: new Date().toISOString() }));
  archived = [...archived, ...archivedTasks];
  fs.writeFileSync(archivePath, JSON.stringify(archived, null, 2));
  
  const remainingTasks = tasks.filter(t => t.columnId !== doneColumn.id);
  writeJson('tasks.json', remainingTasks);
  return { archived: doneTasks.length, total: archived.length };
});

// 启动服务器
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Kanban Server running at http://localhost:3001');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();