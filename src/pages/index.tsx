import { useState, useEffect } from "react";
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
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { nanoid } from "nanoid";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const EXPERIENCE_PER_TASK = 50;
const POINTS_PER_TASK = 10;

const calculateLevel = (experience: number) => Math.floor(experience / 100) + 1;

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [points, setPoints] = useState(0);
  const [experience, setExperience] = useState(0);
  const [level, setLevel] = useState(1);

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

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        p={2}
        bgcolor="#f5f5f5"
        borderRadius={2}
      >
        <Box>
          <Typography variant="h6">現在のステータス</Typography>
          <Typography variant="body2" color="text.secondary">
            経験値が100貯まるごとにレベルアップ！
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="subtitle1">レベル: {level}</Typography>
          <Typography variant="subtitle1">経験値: {experience}</Typography>
          <Typography variant="subtitle1">ポイント: {points}</Typography>
        </Box>
      </Box>
      <h1>ToDo App</h1>
      <TextField
        label="ToDoを入力"
        fullWidth
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={addTodo} style={{ marginTop: "10px" }}>
        追加
      </Button>
      <List>
        {todos.map((todo) => (
          <ListItem
            key={todo.id}
            secondaryAction={
            <IconButton edge="end" onClick={() => deleteTodo(todo.id)}>
              <Delete />
            </IconButton>
            }
          >
            <Checkbox edge="start" checked={todo.completed} onChange={() => toggleTodo(todo.id)} />
            <ListItemText
              primary={todo.text}
              primaryTypographyProps={{
                style: { textDecoration: todo.completed ? "line-through" : "none" },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
