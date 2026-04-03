import React from "react";

export default function TaskItem({ task, species, plant, zone }) {
  return (
    <div className={`task-item ${task.status}`}>
      <div className="task-date">{task.due_date}</div>
      <div className="task-info">
        <div><b>{task.action}</b> ({species?.common_name})</div>
        <div>Zone : {zone?.name}</div>
        <div className="task-notes">{task.notes}</div>
      </div>
    </div>
  );
}
