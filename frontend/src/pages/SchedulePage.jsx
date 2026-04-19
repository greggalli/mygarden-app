import React from "react";
import { useGardenData } from "../data/GardenDataContext";
import TaskItem from "../components/TaskItem";

function sortByDate(a, b) {
  return new Date(a.due_date) - new Date(b.due_date);
}

export default function SchedulePage() {
  const sorted = [...tasks].sort(sortByDate);
  const { data } = useGardenData();
  const { zones, instances, species, tasks } = data;
  
  return (
    <div className="schedule-page">
      <h2>Planning d’entretien</h2>
      {sorted.map((t) => {
        const plant = instances.find((p) => p.id === t.plant_instance_id);
        const sp = plant ? species.find((s) => s.id === plant.species_id) : null;
        const zone = zones.find((z) => z.id === t.zone_id);
        return (
          <TaskItem key={t.id} task={t} species={sp} plant={plant} zone={zone} />
        );
      })}
    </div>
  );
}
