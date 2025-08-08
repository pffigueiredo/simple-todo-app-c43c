import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<{ success: boolean }> => {
  try {
    // Delete the task record
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Check if any rows were affected (task existed and was deleted)
    return {
      success: result.rowCount !== null && result.rowCount > 0
    };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};