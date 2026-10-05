require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 5000;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

let tasksCollection;

app.use(cors());
app.use(express.json());

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await tasksCollection
      .find({}, { projection: { _id: 0 } })
      .toArray();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Could not load tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Task title is required" });
  }

  const newTask = {
    id: Date.now(),
    title: title.trim(),
    completed: false,
  };

  try {
    await tasksCollection.insertOne(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Could not create task" });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);
  const updates = {};

  if (typeof req.body.completed === "boolean") {
    updates.completed = req.body.completed;
  }

  if (typeof req.body.title === "string" && req.body.title.trim()) {
    updates.title = req.body.title.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "Provide a title or completed value" });
  }

  try {
    const result = await tasksCollection.updateOne(
      { id: taskId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updatedTask = await tasksCollection.findOne(
      { id: taskId },
      { projection: { _id: 0 } }
    );

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Could not update task" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);

  try {
    const result = await tasksCollection.deleteOne({ id: taskId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete task" });
  }
});

async function startServer() {
  try {
    await mongoClient.connect();

    const database = mongoClient.db("task_tracker");
    tasksCollection = database.collection("tasks");

    if ((await tasksCollection.countDocuments()) === 0) {
      await tasksCollection.insertMany([
        { id: 1, title: "Learn React", completed: false },
        { id: 2, title: "Build my first project", completed: false },
      ]);
    }

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
  }
}

startServer();