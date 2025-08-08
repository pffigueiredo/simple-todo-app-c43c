import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { desc } from 'drizzle-orm';

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Fetch all tasks from the database, ordered by creation date (newest first)
    const result = await db.select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.created_at))
      .execute();

    // Return the tasks (no numeric conversions needed for this schema)
    return result;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};