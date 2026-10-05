import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("http://localhost:5000/api/tasks")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load tasks");
        }
        return response.json();
      })
      .then((data) => setTasks(data))
      .catch((error) => {
        console.error(error);
        alert("Could not load tasks. Check that the server is running.");
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedTask = newTask.trim();
    if (!trimmedTask) return;

    try {
      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmedTask }),
      });

      if (!response.ok) {
        throw new Error("Could not create task");
      }

      const createdTask = await response.json();
      setTasks((currentTasks) => [...currentTasks, createdTask]);
      setNewTask("");
    } catch (error) {
      console.error(error);
      alert("Could not save the task. Check that the server is running.");
    }
  }

  async function toggleTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ completed: !task.completed }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not update task");
      }

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === taskId ? updatedTask : item))
      );
    } catch (error) {
      console.error(error);
      alert("Could not update the task. Check that the server is running.");
    }
  }

  async function deleteTask(taskId) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Could not delete task");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error(error);
      alert("Could not delete the task. Check that the server is running.");
    }
  }

  function startEditing(task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  }

  async function saveEdit(taskId) {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: trimmedTitle }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not edit task");
      }

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      setEditingTaskId(null);
      setEditTitle("");
    } catch (error) {
      console.error(error);
      alert("Could not edit the task. Check that the server is running.");
    }
  }

  function cancelEditing() {
    setEditingTaskId(null);
    setEditTitle("");
  }

  const visibleTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  return (
    <main className="app">
      <h1>Task Tracker</h1>
      <p className="subtitle">Keep track of what you need to do.</p>

      <form className="task-form" onSubmit={handleSubmit}>
        <input
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          placeholder="Enter a task"
          aria-label="New task"
        />
        <button type="submit">Add task</button>
      </form>

      <label>
        Show{" "}
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All tasks</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <ul className="task-list">
        {visibleTasks.map((task) => (
          <li className="task" key={task.id}>
            {editingTaskId === task.id ? (
              <form
                className="task-form"
                style={{ marginBottom: 0 }}
                onSubmit={(event) => {
                  event.preventDefault();
                  saveEdit(task.id);
                }}
              >
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  aria-label="Edit task title"
                  autoFocus
                />
                <button type="submit">Save</button>
                <button type="button" onClick={cancelEditing}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <label className={task.completed ? "completed" : ""}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  {task.title}
                </label>

                <div>
                  <button type="button" onClick={() => startEditing(task)}>
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;