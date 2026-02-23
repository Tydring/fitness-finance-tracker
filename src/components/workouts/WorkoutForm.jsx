import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useWorkouts } from "../../hooks/useFirestore";
import { useUserStats } from "../../context/UserStatsContext";
import { useAuth } from "../../hooks/useAuth";
import {
  EXERCISE_CATEGORY_MAP,
  isStrengthExercise,
  isCardioExercise,
  isFlexibilityExercise,
} from "../../config/exercises";
import { todayISO, dateInputToTimestamp } from "../../utils/dateHelpers";
import ExerciseSelect from "./ExerciseSelect";
import CompletionModal from "../common/CompletionModal";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import "./WorkoutForm.css";

const INITIAL_EXERCISE = {
  exercise: "",
  category: "",
  sets: "",
  reps: "",
  weight_kg: "",
  duration_min: "",
  distance_km: "",
  rpe: 5,
  notes: "",
};

const INITIAL_STATE = {
  name: "",
  date: todayISO(),
  exercises: [{ ...INITIAL_EXERCISE }],
};

const WorkoutForm = () => {
  const [form, setForm] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, updateItem } = useWorkouts();
  const { updateWorkoutCompleted } = useUserStats();
  const { user } = useAuth();

  const editId = searchParams.get("edit");

  // Fetch existing workout if in edit mode
  useEffect(() => {
    const fetchEditItem = async () => {
      if (!editId) return;
      try {
        const docRef = doc(db, "workouts", editId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Firestore timestamp to YYYY-MM-DD
          let dateStr = todayISO();
          if (data.date && data.date.seconds) {
            dateStr = new Date(data.date.seconds * 1000)
              .toISOString()
              .split("T")[0];
          } else if (typeof data.date === "string") {
            dateStr = data.date.split("T")[0];
          }

          setForm({
            name: data.name || "",
            date: dateStr,
            exercises: [
              {
                exercise: data.exercise || "",
                category: data.category || "",
                sets: data.sets || "",
                reps: data.reps || "",
                weight_kg: data.weight_kg || "",
                duration_min: data.duration_min || "",
                distance_km: data.distance_km || "",
                rpe: data.rpe || 5,
                notes: data.notes || "",
              },
            ],
          });
        }
      } catch (err) {
        console.error("Failed to fetch workout for edit:", err);
      }
    };
    fetchEditItem();
  }, [editId]);

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExerciseChange = (index, e) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      const newExercises = [...prev.exercises];
      const newValue =
        type === "number" ? (value === "" ? "" : Number(value)) : value;

      newExercises[index] = {
        ...newExercises[index],
        [name]: newValue,
      };

      // Auto-fill category when exercise changes
      if (name === "exercise") {
        newExercises[index].category = EXERCISE_CATEGORY_MAP[value] || "";
      }

      return { ...prev, exercises: newExercises };
    });
  };

  const addExerciseRow = () => {
    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { ...INITIAL_EXERCISE }],
    }));
  };

  const removeExerciseRow = (index) => {
    setForm((prev) => {
      const newExercises = [...prev.exercises];
      newExercises.splice(index, 1);
      return { ...prev, exercises: newExercises };
    });
  };

  const handleRepeatLast = async (index) => {
    const currentExercise = form.exercises[index].exercise;
    if (!currentExercise) return;
    try {
      const q = query(
        collection(db, "workouts"),
        where("userId", "==", user.uid),
        where("exercise", "==", currentExercise),
        orderBy("date", "desc"),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const last = snap.docs[0].data();
        setForm((prev) => {
          const newExercises = [...prev.exercises];
          newExercises[index] = {
            ...newExercises[index],
            sets: last.sets || "",
            reps: last.reps || "",
            weight_kg: last.weight_kg || "",
            duration_min: last.duration_min || "",
            distance_km: last.distance_km || "",
            rpe: last.rpe || 5,
          };
          return { ...prev, exercises: newExercises };
        });
      }
    } catch (err) {
      console.error("Failed to fetch last workout:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validExercises = form.exercises.filter(
      (ex) => ex.exercise && ex.exercise.trim() !== "",
    );
    if (validExercises.length === 0) {
      alert("Please select at least one exercise.");
      return;
    }

    setSaving(true);

    try {
      const baseWorkoutName = form.name.trim();
      const timestamp = dateInputToTimestamp(form.date);

      if (editId) {
        // Update the single existing document with the first exercise in the list
        const ex = validExercises[0];
        await updateItem(editId, {
          name: baseWorkoutName || `${ex.exercise} - ${form.date}`,
          date: timestamp,
          exercise: ex.exercise,
          category: ex.category,
          sets: ex.sets || null,
          reps: ex.reps || null,
          weight_kg: ex.weight_kg || null,
          duration_min: ex.duration_min || null,
          distance_km: ex.distance_km || null,
          rpe: ex.rpe || null,
          notes: ex.notes || null,
        });

        // Add any additional exercises that were dynamically added to the form as NEW items
        for (let i = 1; i < validExercises.length; i++) {
          const extraEx = validExercises[i];
          await addItem({
            name: baseWorkoutName || `${extraEx.exercise} - ${form.date}`,
            date: timestamp,
            exercise: extraEx.exercise,
            category: extraEx.category,
            sets: extraEx.sets || null,
            reps: extraEx.reps || null,
            weight_kg: extraEx.weight_kg || null,
            duration_min: extraEx.duration_min || null,
            distance_km: extraEx.distance_km || null,
            rpe: extraEx.rpe || null,
            notes: extraEx.notes || null,
          });
        }
      } else {
        // Batch create mode: Just add all of them
        for (let i = 0; i < validExercises.length; i++) {
          const ex = validExercises[i];
          await addItem({
            name: baseWorkoutName || `${ex.exercise} - ${form.date}`,
            date: timestamp,
            exercise: ex.exercise,
            category: ex.category,
            sets: ex.sets || null,
            reps: ex.reps || null,
            weight_kg: ex.weight_kg || null,
            duration_min: ex.duration_min || null,
            distance_km: ex.distance_km || null,
            rpe: ex.rpe || null,
            notes: ex.notes || null,
          });
        }
      }
      // Calculate streak/stats updates
      const result = await updateWorkoutCompleted(form.date);
      if (result) {
        setCompletionResult(result);
      } else {
        navigate("/workouts");
      }
    } catch (err) {
      console.error("Failed to save workout session:", err);
      alert(
        "Encountered an error saving. Please check connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h2 className="form-title">
        {editId ? "Edit Workout" : "Log Workout Session"}
      </h2>

      <form onSubmit={handleSubmit} className="workout-form">
        {/* Session Details */}
        <div className="session-header-card">
          <div className="form-group">
            <label htmlFor="name">Session Name (optional)</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleGeneralChange}
              placeholder="e.g. Morning Push Day"
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleGeneralChange}
              required
            />
          </div>
        </div>

        <div className="exercises-container">
          <h3 className="section-subtitle">Exercises</h3>

          {form.exercises.map((ex, index) => {
            const showStrength = isStrengthExercise(ex.exercise);
            const showCardio = isCardioExercise(ex.exercise);
            const showFlexibility = isFlexibilityExercise(ex.exercise);

            return (
              <div key={index} className="exercise-card">
                <div className="exercise-card-header">
                  <span className="exercise-number">{index + 1}</span>
                  {form.exercises.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon btn-remove"
                      onClick={() => removeExerciseRow(index)}
                      title="Remove Exercise"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Exercise Selection</label>
                  <ExerciseSelect
                    value={ex.exercise}
                    onChange={(e) => handleExerciseChange(index, e)}
                  />
                </div>

                {/* Tools Row (Category / Repeat) */}
                {(ex.category || ex.exercise) && (
                  <div className="exercise-tools-row">
                    {ex.category && (
                      <div className="category-badge">{ex.category}</div>
                    )}
                    {ex.exercise && (
                      <button
                        type="button"
                        className="btn-repeat"
                        onClick={() => handleRepeatLast(index)}
                      >
                        <RotateCcw size={14} /> Repeat Last
                      </button>
                    )}
                  </div>
                )}

                {/* Strength Fields */}
                {showStrength && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Sets</label>
                      <input
                        name="sets"
                        type="number"
                        min="1"
                        max="20"
                        value={ex.sets}
                        onChange={(e) => handleExerciseChange(index, e)}
                        placeholder="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Reps</label>
                      <input
                        name="reps"
                        type="number"
                        min="1"
                        max="100"
                        value={ex.reps}
                        onChange={(e) => handleExerciseChange(index, e)}
                        placeholder="10"
                      />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        name="weight_kg"
                        type="number"
                        min="0"
                        step="0.5"
                        value={ex.weight_kg}
                        onChange={(e) => handleExerciseChange(index, e)}
                        placeholder="60"
                      />
                    </div>
                  </div>
                )}

                {/* Cardio Fields */}
                {(showCardio || showFlexibility) && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration (min)</label>
                      <input
                        name="duration_min"
                        type="number"
                        min="1"
                        value={ex.duration_min}
                        onChange={(e) => handleExerciseChange(index, e)}
                        placeholder="30"
                      />
                    </div>
                    {showCardio && (
                      <div className="form-group">
                        <label>Distance (km)</label>
                        <input
                          name="distance_km"
                          type="number"
                          min="0"
                          step="0.1"
                          value={ex.distance_km}
                          onChange={(e) => handleExerciseChange(index, e)}
                          placeholder="5.0"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* RPE Fields */}
                {ex.exercise && (
                  <div className="form-group">
                    <label>RPE: {ex.rpe}</label>
                    <input
                      name="rpe"
                      type="range"
                      min="1"
                      max="10"
                      value={ex.rpe}
                      onChange={(e) => handleExerciseChange(index, e)}
                      className="rpe-slider"
                    />
                    <div className="rpe-labels">
                      <span>Easy</span>
                      <span>Max</span>
                    </div>
                  </div>
                )}

                {/* Specific Notes */}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={ex.notes}
                    onChange={(e) => handleExerciseChange(index, e)}
                    rows={2}
                    placeholder="Specific notes for this exercise..."
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-add-exercise"
          onClick={addExerciseRow}
        >
          <Plus size={18} />
          <span>Add Another Exercise</span>
        </button>

        <hr className="divider" />

        <button
          type="submit"
          className="btn btn-primary btn-submit"
          disabled={saving}
        >
          {saving
            ? "Saving Session..."
            : editId
              ? "Update Workout"
              : `Log Session (${form.exercises.length} Exercises)`}
        </button>
      </form>

      {completionResult && (
        <CompletionModal
          result={completionResult}
          onClose={() => navigate("/workouts")}
        />
      )}
    </div>
  );
};

export default WorkoutForm;
