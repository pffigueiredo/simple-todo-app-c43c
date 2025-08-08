import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task completion status to true', async () => {
    // Create a task directly in the database
    const createResult = await db.insert(tasksTable)
      .values({
        name: 'Test Task',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createResult[0];

    // Update task to completed
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };
    const result = await updateTask(updateInput);

    // Verify the update
    expect(result.id).toBe(createdTask.id);
    expect(result.name).toBe('Test Task');
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdTask.created_at);
  });

  it('should update task completion status to false', async () => {
    // Create a task directly in the database
    const createResult = await db.insert(tasksTable)
      .values({
        name: 'Another Test Task',
        completed: true // Start as completed
      })
      .returning()
      .execute();
    
    const createdTask = createResult[0];

    // Update task to not completed
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: false
    };
    const result = await updateTask(updateInput);

    // Verify the update
    expect(result.id).toBe(createdTask.id);
    expect(result.name).toBe('Another Test Task');
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated task to database', async () => {
    // Create a task directly in the database
    const createResult = await db.insert(tasksTable)
      .values({
        name: 'Database Test Task',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createResult[0];

    // Update task completion status
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };
    await updateTask(updateInput);

    // Query database to verify the update was persisted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(createdTask.id);
    expect(tasks[0].name).toBe('Database Test Task');
    expect(tasks[0].completed).toBe(true);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999, // Non-existent task ID
      completed: true
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should toggle task completion status multiple times', async () => {
    // Create a task directly in the database
    const createResult = await db.insert(tasksTable)
      .values({
        name: 'Toggle Test Task',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createResult[0];

    // Toggle to completed
    let updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };
    let result = await updateTask(updateInput);
    expect(result.completed).toBe(true);

    // Toggle back to not completed
    updateInput = {
      id: createdTask.id,
      completed: false
    };
    result = await updateTask(updateInput);
    expect(result.completed).toBe(false);

    // Toggle back to completed again
    updateInput = {
      id: createdTask.id,
      completed: true
    };
    result = await updateTask(updateInput);
    expect(result.completed).toBe(true);
  });

  it('should preserve task name and created_at when updating', async () => {
    // Create a task directly in the database
    const createResult = await db.insert(tasksTable)
      .values({
        name: 'Preserve Data Test',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = createResult[0];

    // Update task completion status
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      completed: true
    };
    const result = await updateTask(updateInput);

    // Verify that only completion status changed
    expect(result.id).toBe(createdTask.id);
    expect(result.name).toBe(createdTask.name); // Should remain unchanged
    expect(result.completed).toBe(true); // Should be updated
    expect(result.created_at).toEqual(createdTask.created_at); // Should remain unchanged
  });
});