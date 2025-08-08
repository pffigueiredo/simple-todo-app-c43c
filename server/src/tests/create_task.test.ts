import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  name: 'Complete project documentation'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.name).toEqual('Complete project documentation');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toEqual('Complete project documentation');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should create task with default completed status as false', async () => {
    const result = await createTask({
      name: 'New task'
    });

    expect(result.completed).toBe(false);
    
    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].completed).toBe(false);
  });

  it('should handle different task names correctly', async () => {
    const inputs = [
      { name: 'Short task' },
      { name: 'This is a much longer task name with many words and details' },
      { name: 'Task with special characters: @#$%^&*()' }
    ];

    for (const input of inputs) {
      const result = await createTask(input);
      
      expect(result.name).toEqual(input.name);
      expect(result.id).toBeDefined();
      expect(result.completed).toBe(false);
      
      // Verify each task is saved in database
      const tasks = await db.select()
        .from(tasksTable)
        .where(eq(tasksTable.id, result.id))
        .execute();
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toEqual(input.name);
    }
  });

  it('should create multiple tasks with unique IDs', async () => {
    const task1 = await createTask({ name: 'First task' });
    const task2 = await createTask({ name: 'Second task' });
    const task3 = await createTask({ name: 'Third task' });

    // All IDs should be different
    expect(task1.id).not.toEqual(task2.id);
    expect(task2.id).not.toEqual(task3.id);
    expect(task1.id).not.toEqual(task3.id);

    // All should be saved to database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(3);
    
    const taskNames = allTasks.map(task => task.name);
    expect(taskNames).toContain('First task');
    expect(taskNames).toContain('Second task');
    expect(taskNames).toContain('Third task');
  });
});