#!/usr/bin/env bun
/**
 * Kanban 数据校验工具
 * 检查 JSON 数据的一致性问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

function verify() {
  const columns = readJson('columns.json');
  const tasks = readJson('tasks.json');
  
  const issues = [];
  
  // 检查列
  if (columns.length === 0) {
    issues.push({ type: 'warning', message: '没有任何列，建议创建至少一个列' });
  }
  
  // 检查任务的列引用
  const columnIds = new Set(columns.map(c => c.id));
  const orphanTasks = tasks.filter(t => !columnIds.has(t.columnId));
  if (orphanTasks.length > 0) {
    issues.push({ 
      type: 'error', 
      message: `${orphanTasks.length} 个任务的 columnId 引用了不存在的列`,
      data: orphanTasks.map(t => ({ id: t.id, title: t.title }))
    });
  }
  
  // 检查重复 ID
  const taskIds = tasks.map(t => t.id);
  const duplicateIds = taskIds.filter((id, i) => taskIds.indexOf(id) !== i);
  if (duplicateIds.length > 0) {
    issues.push({ 
      type: 'error', 
      message: `发现重复的任务 ID: ${duplicateIds.join(', ')}` 
    });
  }
  
  // 检查必需字段
  const invalidTasks = tasks.filter(t => !t.title || !t.columnId);
  if (invalidTasks.length > 0) {
    issues.push({ 
      type: 'error', 
      message: `${invalidTasks.length} 个任务缺少必需字段(title 或 columnId)`,
      data: invalidTasks.map(t => ({ id: t.id }))
    });
  }
  
  // 输出结果
  console.log('\n📋 Kanban 数据校验报告\n' + '='.repeat(40));
  console.log(`列数: ${columns.length}`);
  console.log(`任务数: ${tasks.length}`);
  console.log('='.repeat(40));
  
  if (issues.length === 0) {
    console.log('✅ 数据校验通过，没有发现问题\n');
    return 0;
  }
  
  console.log(`\n发现 ${issues.length} 个问题:\n`);
  issues.forEach((issue, i) => {
    const icon = issue.type === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${issue.message}`);
    if (issue.data) {
      console.log('   ', JSON.stringify(issue.data));
    }
  });
  console.log('');
  
  return issues.filter(i => i.type === 'error').length > 0 ? 1 : 0;
}

process.exit(verify());