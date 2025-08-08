import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingTasks, setUpdatingTasks] = useState<Set<number>>(new Set());
  const [deletingTasks, setDeletingTasks] = useState<Set<number>>(new Set());

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    setIsSubmitting(true);
    try {
      const taskInput: CreateTaskInput = { name: newTaskName.trim() };
      const newTask = await trpc.createTask.mutate(taskInput);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setNewTaskName('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: boolean) => {
    setUpdatingTasks((prev: Set<number>) => new Set([...prev, taskId]));
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: taskId,
        completed: !currentStatus
      });
      setTasks((prev: Task[]) =>
        prev.map((task: Task) => 
          task.id === taskId ? { ...task, completed: updatedTask.completed } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdatingTasks((prev: Set<number>) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setDeletingTasks((prev: Set<number>) => new Set([...prev, taskId]));
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setDeletingTasks((prev: Set<number>) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const completedTasks = tasks.filter((task: Task) => task.completed);
  const pendingTasks = tasks.filter((task: Task) => !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✅ My Todo App
          </h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Add Task Form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="flex gap-2">
              <Input
                placeholder="What needs to be done? 🎯"
                value={newTaskName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTaskName(e.target.value)
                }
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting || !newTaskName.trim()}>
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                Loading tasks... ⏳
              </div>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-lg">No tasks yet!</p>
                <p className="text-sm">Add your first task above to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Circle className="h-5 w-5 text-yellow-500" />
                    Pending Tasks ({pendingTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                        disabled={updatingTasks.has(task.id)}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{task.name}</div>
                        <div className="text-xs text-gray-500">
                          Created: {task.created_at.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Pending</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deletingTasks.has(task.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Completed Tasks ({completedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                        disabled={updatingTasks.has(task.id)}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-700 line-through">
                          {task.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {task.created_at.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deletingTasks.has(task.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Progress Section */}
        {tasks.length > 0 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">
                  Progress: {completedTasks.length} of {tasks.length} tasks completed
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {completedTasks.length === tasks.length && tasks.length > 0
                    ? "🎉 All tasks completed! Great job!"
                    : `Keep going! ${tasks.length - completedTasks.length} task${tasks.length - completedTasks.length === 1 ? '' : 's'} remaining.`
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;