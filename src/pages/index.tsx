import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Container,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Box,
  Typography,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { nanoid } from "nanoid";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type Goal = {
  id: string;
  description: string;
  deadline: string;
  requiredCount: number;
  penaltyPoints: number;
  penaltyApplied: boolean;
};

type GoalProgress = {
  progressPercentage: number;
  remainingTimeText: string;
  completedCount: number;
  requiredCount: number;
  isAchieved: boolean;
  isPastDeadline: boolean;
};

type NotificationState = {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error";
};

const EXPERIENCE_PER_TASK = 50;
const POINTS_PER_TASK = 10;

const calculateLevel = (experience: number) => Math.floor(experience / 100) + 1;

const getRemainingTimeText = (deadline: Date, now: Date) => {
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) {
    return "締切を過ぎています";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}日`);
  }
  if (hours > 0) {
    parts.push(`${hours}時間`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}分`);
  }

  return parts.length > 0 ? `残り${parts.join(" ")}` : "1分未満で締切です";
};

const evaluateGoalStatus = (
  goal: Goal,
  completedCount: number,
  referenceDate: Date,
): GoalProgress => {
  const deadlineDate = new Date(goal.deadline);
  const isDeadlineValid = !Number.isNaN(deadlineDate.getTime());
  const normalizedCompleted = Math.max(0, completedCount);
  const requiredCount = Math.max(goal.requiredCount, 0);

  const isAchieved = requiredCount === 0 ? true : normalizedCompleted >= requiredCount;
  const isPastDeadline = isDeadlineValid ? referenceDate.getTime() >= deadlineDate.getTime() : false;

  const progressRate = requiredCount === 0 ? 1 : Math.min(normalizedCompleted / requiredCount, 1);
  const progressPercentage = Math.round(progressRate * 100);

  let remainingTimeText = "締切が正しく設定されていません";
  if (isDeadlineValid) {
    remainingTimeText = getRemainingTimeText(deadlineDate, referenceDate);
  }

  return {
    progressPercentage,
    remainingTimeText,
    completedCount: normalizedCompleted,
    requiredCount,
    isAchieved,
    isPastDeadline,
  };
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [points, setPoints] = useState(0);
  const [experience, setExperience] = useState(0);
  const [level, setLevel] = useState(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [goalForm, setGoalForm] = useState({
    description: "",
    deadline: "",
    requiredCount: "",
    penaltyPoints: "",
  });
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info",
  });

  // 📌 画面読み込み時にローカルストレージからデータを取得
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      try {
        const parsedTodos: unknown = JSON.parse(savedTodos);
        if (Array.isArray(parsedTodos)) {
          const normalizedTodos: Todo[] = parsedTodos
            .map((item) => {
              if (typeof item !== "object" || item === null) return null;
              const potentialTodo = item as Partial<Todo> & { text?: unknown };
              if (typeof potentialTodo.id !== "string" || typeof potentialTodo.text !== "string") {
                return null;
              }
              return {
                id: potentialTodo.id,
                text: potentialTodo.text,
                completed: Boolean(potentialTodo.completed),
              };
            })
            .filter((todo): todo is Todo => Boolean(todo));

          setTodos(normalizedTodos);
        }
      } catch (error) {
        console.error("Failed to parse todos from localStorage", error);
      }
    }

    const savedPoints = localStorage.getItem("points");
    if (savedPoints) {
      const parsedPoints = Number(savedPoints);
      if (!Number.isNaN(parsedPoints)) {
        setPoints(parsedPoints);
      }
    }

    const savedExperience = localStorage.getItem("experience");
    let experienceLoaded = false;
    if (savedExperience) {
      const parsedExperience = Number(savedExperience);
      if (!Number.isNaN(parsedExperience)) {
        setExperience(parsedExperience);
        setLevel(calculateLevel(parsedExperience));
        experienceLoaded = true;
      }
    }

    if (!experienceLoaded) {
      const savedLevel = localStorage.getItem("level");
      if (savedLevel) {
        const parsedLevel = Number(savedLevel);
        if (!Number.isNaN(parsedLevel)) {
          setLevel(parsedLevel);
        }
      }
    }

    const savedGoal = localStorage.getItem("goal");
    if (savedGoal) {
      try {
        const parsedGoal: unknown = JSON.parse(savedGoal);
        if (typeof parsedGoal === "object" && parsedGoal !== null) {
          const potentialGoal = parsedGoal as Partial<Goal> & {
            description?: unknown;
            deadline?: unknown;
            requiredCount?: unknown;
            penaltyPoints?: unknown;
            penaltyApplied?: unknown;
          };
          if (
            typeof potentialGoal.description === "string" &&
            typeof potentialGoal.deadline === "string" &&
            typeof potentialGoal.requiredCount === "number" &&
            !Number.isNaN(potentialGoal.requiredCount) &&
            typeof potentialGoal.penaltyPoints === "number" &&
            !Number.isNaN(potentialGoal.penaltyPoints)
          ) {
            const restoredGoal: Goal = {
              id: potentialGoal.id ?? nanoid(),
              description: potentialGoal.description,
              deadline: potentialGoal.deadline,
              requiredCount: Math.max(0, Math.floor(potentialGoal.requiredCount)),
              penaltyPoints: Math.max(0, Math.floor(potentialGoal.penaltyPoints)),
              penaltyApplied: Boolean(potentialGoal.penaltyApplied),
            };
            setGoal(restoredGoal);
            setGoalForm({
              description: restoredGoal.description,
              deadline: restoredGoal.deadline,
              requiredCount: restoredGoal.requiredCount ? restoredGoal.requiredCount.toString() : "",
              penaltyPoints: restoredGoal.penaltyPoints ? restoredGoal.penaltyPoints.toString() : "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to parse goal from localStorage", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem("points", points.toString());
  }, [points]);

  useEffect(() => {
    localStorage.setItem("experience", experience.toString());
  }, [experience]);

  useEffect(() => {
    localStorage.setItem("level", level.toString());
  }, [level]);

  useEffect(() => {
    if (goal) {
      localStorage.setItem("goal", JSON.stringify(goal));
    } else {
      localStorage.removeItem("goal");
    }
  }, [goal]);

  // 📌 ToDoを追加する
  const addTodo = () => {
    if (!input.trim()) return;
    const newTodos = [...todos, { id: nanoid(), text: input, completed: false }];
    setTodos(newTodos);
    localStorage.setItem("todos", JSON.stringify(newTodos)); // ← ローカルストレージに保存
    setInput("");
  };

  // 📌 ToDoを削除する
  const deleteTodo = (id: string) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    localStorage.setItem("todos", JSON.stringify(newTodos)); // ← 削除後に保存
  };

  // 📌 完了状態を切り替える
  const toggleTodo = (id: string) => {
    setTodos(prevTodos => {
      const updatedTodos = prevTodos.map(todo => {
        if (todo.id !== id) return todo;

        const newCompleted = !todo.completed;
        const experienceDelta = newCompleted ? EXPERIENCE_PER_TASK : -EXPERIENCE_PER_TASK;
        const pointsDelta = newCompleted ? POINTS_PER_TASK : -POINTS_PER_TASK;

        setExperience(prevExperience => {
          const updatedExperience = Math.max(0, prevExperience + experienceDelta);
          const updatedLevel = calculateLevel(updatedExperience);
          setLevel(updatedLevel);
          return updatedExperience;
        });

        setPoints(prevPoints => Math.max(0, prevPoints + pointsDelta));

        return { ...todo, completed: newCompleted };
      });

      localStorage.setItem("todos", JSON.stringify(updatedTodos));
      return updatedTodos;
    });
  };

  const completedCount = todos.filter((todo) => todo.completed).length;

  useEffect(() => {
    if (!goal) {
      setGoalProgress(null);
      return;
    }

    const updateGoalStatus = () => {
      const status = evaluateGoalStatus(goal, completedCount, new Date());
      setGoalProgress(status);

      if (status.isPastDeadline && !status.isAchieved && !goal.penaltyApplied && goal.penaltyPoints > 0) {
        setPoints((prevPoints) => Math.max(0, prevPoints - goal.penaltyPoints));
        setGoal((prevGoal) => {
          if (!prevGoal) return prevGoal;
          return { ...prevGoal, penaltyApplied: true };
        });
        setNotification({
          open: true,
          message: `目標「${goal.description}」を達成できなかったため、${goal.penaltyPoints}ポイント減算しました。`,
          severity: "warning",
        });
      }
    };

    updateGoalStatus();
    const intervalId = setInterval(updateGoalStatus, 60000);
    return () => clearInterval(intervalId);
  }, [goal, completedCount]);

  const handleGoalFormChange = (field: keyof typeof goalForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setGoalForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedDescription = goalForm.description.trim();
    const requiredCount = Number(goalForm.requiredCount);
    const penaltyPoints = Number(goalForm.penaltyPoints || "0");

    if (!trimmedDescription || !goalForm.deadline) {
      setNotification({
        open: true,
        message: "目標内容と締切日時を入力してください。",
        severity: "error",
      });
      return;
    }

    if (Number.isNaN(requiredCount) || requiredCount <= 0) {
      setNotification({
        open: true,
        message: "必要完了数は1以上の数値で入力してください。",
        severity: "error",
      });
      return;
    }

    if (Number.isNaN(penaltyPoints) || penaltyPoints < 0) {
      setNotification({
        open: true,
        message: "ポイント減算は0以上の数値で入力してください。",
        severity: "error",
      });
      return;
    }

    const newGoal: Goal = {
      id: nanoid(),
      description: trimmedDescription,
      deadline: goalForm.deadline,
      requiredCount: Math.floor(requiredCount),
      penaltyPoints: Math.floor(penaltyPoints),
      penaltyApplied: false,
    };

    setGoal(newGoal);
    setGoalForm({
      description: newGoal.description,
      deadline: newGoal.deadline,
      requiredCount: newGoal.requiredCount.toString(),
      penaltyPoints: newGoal.penaltyPoints.toString(),
    });
    setNotification({
      open: true,
      message: "新しい目標を設定しました！",
      severity: "success",
    });
  };

  const clearGoal = () => {
    setGoal(null);
    setGoalProgress(null);
    setGoalForm({
      description: "",
      deadline: "",
      requiredCount: "",
      penaltyPoints: "",
    });
    setNotification({
      open: true,
      message: "目標をリセットしました。",
      severity: "info",
    });
  };

  const handleNotificationClose = (_event?: unknown, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return "締切未設定";
    }
    return deadlineDate.toLocaleString();
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        px: { xs: 2, sm: 0 },
        py: { xs: 3, sm: 4 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 3, sm: 4 },
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#f5f5f5",
          borderRadius: 2,
          gap: { xs: 2, sm: 3 },
          flexDirection: { xs: "column", sm: "row" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        <Box>
          <Typography variant="h6">現在のステータス</Typography>
          <Typography variant="body2" color="text.secondary">
            経験値が100貯まるごとにレベルアップ！
          </Typography>
        </Box>
        <Box textAlign={{ xs: "center", sm: "right" }}>
          <Typography variant="subtitle1">レベル: {level}</Typography>
          <Typography variant="subtitle1">経験値: {experience}</Typography>
          <Typography variant="subtitle1">ポイント: {points}</Typography>
        </Box>
      </Box>
      <Box
        component="form"
        onSubmit={handleGoalSubmit}
        sx={{
          mt: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 3 },
          p: { xs: 2, sm: 3 },
          bgcolor: "#fff8e1",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" gutterBottom>
          目標を設定
        </Typography>
        <TextField
          label="目標内容"
          fullWidth
          margin="dense"
          sx={{ mt: { xs: 1.5, sm: 2 } }}
          value={goalForm.description}
          onChange={handleGoalFormChange("description")}
        />
        <TextField
          label="締切日時"
          type="datetime-local"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          sx={{ mt: { xs: 1.5, sm: 2 } }}
          value={goalForm.deadline}
          onChange={handleGoalFormChange("deadline")}
        />
        <TextField
          label="必要完了数"
          type="number"
          fullWidth
          margin="dense"
          inputProps={{ min: 1 }}
          sx={{ mt: { xs: 1.5, sm: 2 } }}
          value={goalForm.requiredCount}
          onChange={handleGoalFormChange("requiredCount")}
        />
        <TextField
          label="未達時のポイント減算"
          type="number"
          fullWidth
          margin="dense"
          inputProps={{ min: 0 }}
          sx={{ mt: { xs: 1.5, sm: 2 } }}
          value={goalForm.penaltyPoints}
          onChange={handleGoalFormChange("penaltyPoints")}
        />
        <Box
          display="flex"
          justifyContent={{ xs: "stretch", sm: "flex-end" }}
          gap={1.5}
          mt={3}
          flexDirection={{ xs: "column", sm: "row" }}
          className="mobile-button-spacing"
        >
          {goal && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearGoal}
              sx={{
                py: { xs: 1.25, sm: 0.75 },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              リセット
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{
              py: { xs: 1.25, sm: 0.75 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            目標を設定
          </Button>
        </Box>
      </Box>
      {goal && goalProgress && (
        <Box
          mb={{ xs: 2.5, sm: 4 }}
          p={{ xs: 2, sm: 3 }}
          bgcolor="#e3f2fd"
          borderRadius={2}
          boxShadow={1}
        >
          <Typography variant="h6" gutterBottom>
            目標の進捗状況
          </Typography>
          <Typography variant="subtitle1">{goal.description}</Typography>
          <Typography variant="body2" color="text.secondary">
            締切: {formatDeadline(goal.deadline)}
          </Typography>
          <LinearProgress variant="determinate" value={goalProgress.progressPercentage} sx={{ mt: 2 }} />
          <Typography variant="body2" mt={1}>
            進捗率: {goalProgress.progressPercentage}% ({goalProgress.completedCount}/{goalProgress.requiredCount})
          </Typography>
          <Typography variant="body2">残り時間: {goalProgress.remainingTimeText}</Typography>
          {goalProgress.isAchieved ? (
            <Typography variant="body2" color="success.main" mt={1}>
              目標を成しました！お疲れさま♡
            </Typography>
          ) : goalProgress.isPastDeadline ? (
            <Typography variant="body2" color="error" mt={1}>
              締切を過ぎています。
            </Typography>
          ) : null}
        </Box>
      )}
      <Typography
        variant="h4"
        component="h1"
        className="mobile-heading"
        sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}
      >
        ToDo App
      </Typography>
      <TextField
        label="ToDoを入力"
        fullWidth
        value={input}
        sx={{ mt: { xs: 1, sm: 1.5 } }}
        onChange={(e) => setInput(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={addTodo}
        sx={{
          mt: { xs: 2, sm: 2.5 },
          py: { xs: 1.25, sm: 0.75 },
          width: { xs: "100%", sm: "auto" },
        }}
      >
        追加
      </Button>
      <List sx={{ mt: { xs: 3, sm: 4 } }}>
        {todos.map((todo) => (
          <ListItem
            key={todo.id}
            sx={{
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              mb: { xs: 1.5, sm: 2 },
              bgcolor: "background.paper",
              boxShadow: { xs: 1, sm: 0 },
            }}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => deleteTodo(todo.id)}
                sx={{
                  width: 48,
                  height: 48,
                  ml: { xs: 0.5, sm: 1 },
                }}
              >
                <Delete />
              </IconButton>
            }
          >
            <Checkbox
              edge="start"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              sx={{ mr: { xs: 1.5, sm: 2 } }}
            />
            <ListItemText
              primary={todo.text}
              primaryTypographyProps={{
                style: { textDecoration: todo.completed ? "line-through" : "none" },
              }}
            />
          </ListItem>
        ))}
      </List>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
