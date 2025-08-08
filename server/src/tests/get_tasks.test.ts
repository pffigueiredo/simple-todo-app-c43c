import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test data for creating tasks
const testTasks: CreateTaskInput[] = [
  { name: 'First Task' },
  { name: 'Second Task' },
  { name: 'Third Task' }
];

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all tasks from database', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values(testTasks.map(task => ({
        name: task.name,
        completed: false
      })))
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].completed).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify all task names are present
    const taskNames = result.map(task => task.name);
    expect(taskNames).toContain('First Task');
    expect(taskNames).toContain('Second Task');
    expect(taskNames).toContain('Third Task');
  });

  it('should return tasks with correct structure', async () => {
    // Create a single test task
    await db.insert(tasksTable)
      .values({
        name: 'Test Task',
        completed: true
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];

    // Verify task structure matches schema
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('number');
    expect(task.name).toEqual('Test Task');
    expect(typeof task.name).toBe('string');
    expect(task.completed).toEqual(true);
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({ name: 'Old Task', completed: false })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({ name: 'New Task', completed: false })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    // Newest task should be first
    expect(result[0].name).toEqual('New Task');
    expect(result[1].name).toEqual('Old Task');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle both completed and uncompleted tasks', async () => {
    // Create tasks with different completion states
    await db.insert(tasksTable)
      .values([
        { name: 'Completed Task', completed: true },
        { name: 'Pending Task', completed: false }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    const completedTask = result.find(task => task.name === 'Completed Task');
    const pendingTask = result.find(task => task.name === 'Pending Task');

    expect(completedTask).toBeDefined();
    expect(completedTask!.completed).toBe(true);
    expect(pendingTask).toBeDefined();
    expect(pendingTask!.completed).toBe(false);
  });

  it('should handle tasks with long names', async () => {
    const longTaskName = 'A'.repeat(500); // Very long task name
    
    await db.insert(tasksTable)
      .values({ name: longTaskName, completed: false })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual(longTaskName);
    expect(result[0].name).toHaveLength(500);
  });
});