import { useEffect, useRef, useState } from "react";
import "./App.css";

const PRIORITIES = {
  high: { label: "High", icon: "🔴" },
  medium: { label: "Medium", icon: "🟡" },
  low: { label: "Low", icon: "🟢" },
};

const DEFAULT_PRIORITY = "medium";

function formatDeadline(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSubjectProgress(subject) {
  return {
    completed: subject.tasks.filter((t) => t.done).length,
    total: subject.tasks.length,
  };
}

function updateSubjectTasks(subjects, subjectId, update) {
  return subjects.map((s) =>
    s.id === subjectId ? { ...s, tasks: update(s.tasks) } : s
  );
}

function App() {
  const [name, setName] = useState(() => {
    return localStorage.getItem("tasklyName") || "";
  });

  const [nameInput, setNameInput] = useState("");
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState(DEFAULT_PRIORITY);
  const [deadline, setDeadline] = useState("");

  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem("tasklySubjects");

    if (!saved) return [];

    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectInput, setSubjectInput] = useState("");

  useEffect(() => {
    if (name) {
      localStorage.setItem("tasklyName", name);
    }
  }, [name]);

  useEffect(() => {
    localStorage.setItem("tasklySubjects", JSON.stringify(subjects));
  }, [subjects]);

  const nextId = useRef(
    Math.max(
      0,
      ...subjects.flatMap((subject) => [
        Number(subject.id) || 0,
        ...subject.tasks.map((task) => Number(task.id) || 0),
      ])
    ) + 1
  );

  function getNextId() {
    const id = nextId.current;
    nextId.current += 1;
    return id;
  }

  function continueToApp(e) {
    e.preventDefault();

    const trimmed = nameInput.trim();

    if (trimmed === "") return;

    setName(trimmed);
  }

  function openSubject(id) {
    setTask("");
    setPriority(DEFAULT_PRIORITY);
    setDeadline("");
    setSelectedSubjectId(id);
  }

  function backToSubjects() {
    setTask("");
    setPriority(DEFAULT_PRIORITY);
    setDeadline("");
    setSelectedSubjectId(null);
  }

  function addSubject(e) {
    e.preventDefault();

    const trimmed = subjectInput.trim();

    if (trimmed === "") return;

    const existing = subjects.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );

    setSubjectInput("");
    setIsAddingSubject(false);

    if (existing) {
      openSubject(existing.id);
      return;
    }

    const newSubject = {
      id: getNextId(),
      name: trimmed,
      tasks: [],
    };

    setSubjects((prev) => [...prev, newSubject]);
  }

  function cancelAddSubject() {
    setSubjectInput("");
    setIsAddingSubject(false);
  }

  function addTask(e) {
    e.preventDefault();

    const text = task.trim();

    if (text === "" || deadline === "" || selectedSubjectId === null) {
      return;
    }

    const newTask = {
      id: getNextId(),
      text,
      done: false,
      priority: PRIORITIES[priority] ? priority : DEFAULT_PRIORITY,
      deadline,
    };

    setSubjects((prev) =>
      updateSubjectTasks(prev, selectedSubjectId, (tasks) => [
        ...tasks,
        newTask,
      ])
    );

    setTask("");
    setPriority(DEFAULT_PRIORITY);
    setDeadline("");
  }

  function deleteTask(taskId) {
    setSubjects((prev) =>
      updateSubjectTasks(prev, selectedSubjectId, (tasks) =>
        tasks.filter((t) => t.id !== taskId)
      )
    );
  }

  function completeTask(taskId) {
    setSubjects((prev) =>
      updateSubjectTasks(prev, selectedSubjectId, (tasks) =>
        tasks.map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        )
      )
    );
  }

  const selectedSubject = subjects.find(
    (s) => s.id === selectedSubjectId
  );

  if (name === "") {
    return (
      <div className="app welcome">
        <h1>👋 Hello there!</h1>
        <p>What's your name?</p>

        <form className="input-area" onSubmit={continueToApp}>
          <input
            type="text"
            placeholder="Enter your name..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            autoFocus
          />

          <button
            type="submit"
            disabled={nameInput.trim() === ""}
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app main">
      <header className="header">
        <h1 className="title">✦ Taskly ✦</h1>

        <p className="greeting">
          Hey {name}, let's make today productive. ♡
        </p>
      </header>

      {selectedSubject ? (
        <section className="subject-view">
          <div className="section-head">
            <button onClick={backToSubjects}>
              ← Back to Subjects
            </button>
          </div>

          <h2 className="subject-title">
            {selectedSubject.name}
          </h2>

          <form className="task-form" onSubmit={addTask}>
            <input
              type="text"
              placeholder="Enter a task..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              autoFocus
            />

            <div className="task-form-row">
              <label className="priority-field">
                <span>Priority</span>

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {Object.entries(PRIORITIES).map(
                    ([value, p]) => (
                      <option key={value} value={value}>
                        {p.icon} {p.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="deadline-field">
                <span>Deadline</span>

                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  required
                />
              </label>
            </div>

            <button type="submit" className="add-task-btn">
              + Add Task
            </button>
          </form>

          {selectedSubject.tasks.length === 0 ? (
            <p className="empty-note">
              No tasks yet. Add your first task above.
            </p>
          ) : (
            <ul>
              {selectedSubject.tasks.map((item) => {
                const p =
                  PRIORITIES[item.priority] ??
                  PRIORITIES[DEFAULT_PRIORITY];

                return (
                  <li
                    key={item.id}
                    className={item.done ? "done" : ""}
                  >
                    <div className="task-body">
                      <span
                        onClick={() =>
                          completeTask(item.id)
                        }
                      >
                        {item.text}
                      </span>

                      <div className="task-meta">
                        <small
                          className={
                            "priority-badge priority-" +
                            item.priority
                          }
                        >
                          {p.icon} {p.label}
                        </small>

                        {item.deadline && (
                          <small className="deadline-badge">
                            📅 {formatDeadline(item.deadline)}
                          </small>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        deleteTask(item.id)
                      }
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="subjects">
          <div className="section-head">
            <h2>My Subjects</h2>

            <button
              onClick={() =>
                setIsAddingSubject(!isAddingSubject)
              }
            >
              + Add Subject
            </button>
          </div>

          {isAddingSubject && (
            <form
              className="input-area subject-form"
              onSubmit={addSubject}
            >
              <input
                type="text"
                placeholder="e.g. Web Development"
                value={subjectInput}
                onChange={(e) =>
                  setSubjectInput(e.target.value)
                }
                autoFocus
              />

              <button
                type="submit"
                disabled={subjectInput.trim() === ""}
              >
                Add
              </button>

              <button
                type="button"
                onClick={cancelAddSubject}
              >
                Cancel
              </button>
            </form>
          )}

          {subjects.length === 0 ? (
            <p className="empty-note">
              No subjects yet. Try Web Development,
              Database, Networking or Mathematics.
            </p>
          ) : (
            <div className="subject-grid">
              {subjects.map((subject) => {
                const { completed, total } =
                  getSubjectProgress(subject);

                return (
                  <button
                    key={subject.id}
                    type="button"
                    className="subject-card"
                    onClick={() =>
                      openSubject(subject.id)
                    }
                  >
                    <span className="subject-name">
                      {subject.name}
                    </span>

                    {completed > 0 && (
                      <span
                        className={
                          "subject-progress" +
                          (completed === total
                            ? " complete"
                            : "")
                        }
                      >
                        🔔 {completed}/{total} tasks completed
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;