import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First create a task to delete
    const createResult = await db.insert(tasksTable)
      .values({
        name: 'Task to delete',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;

    // Test deleting the task
    const deleteInput: DeleteTaskInput = {
      id: taskId
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task was actually deleted from database
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should return false when deleting non-existent task', async () => {
    // Test deleting a task that doesn't exist
    const deleteInput: DeleteTaskInput = {
      id: 999 // Non-existent ID
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting', async () => {
    // Create multiple tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        name: 'Task 1',
        completed: false
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        name: 'Task 2',
        completed: true
      })
      .returning()
      .execute();

    const task1Id = task1Result[0].id;
    const task2Id = task2Result[0].id;

    // Delete only task1
    const deleteInput: DeleteTaskInput = {
      id: task1Id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task1 was deleted
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1Id))
      .execute();

    expect(deletedTasks).toHaveLength(0);

    // Verify task2 still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2Id))
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].name).toEqual('Task 2');
    expect(remainingTasks[0].completed).toBe(true);
  });

  it('should handle completed and uncompleted tasks equally', async () => {
    // Create a completed task
    const completedTaskResult = await db.insert(tasksTable)
      .values({
        name: 'Completed task',
        completed: true
      })
      .returning()
      .execute();

    const completedTaskId = completedTaskResult[0].id;

    // Delete the completed task
    const deleteInput: DeleteTaskInput = {
      id: completedTaskId
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify completed task was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTaskId))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should validate task exists before and after deletion', async () => {
    // Create a task
    const createResult = await db.insert(tasksTable)
      .values({
        name: 'Validation test task',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;

    // Verify task exists before deletion
    const tasksBeforeDeletion = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasksBeforeDeletion).toHaveLength(1);
    expect(tasksBeforeDeletion[0].name).toEqual('Validation test task');

    // Delete the task
    const deleteInput: DeleteTaskInput = {
      id: taskId
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task doesn't exist after deletion
    const tasksAfterDeletion = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasksAfterDeletion).toHaveLength(0);
  });
});