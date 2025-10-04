import { useState, useEffect } from "react";
import { Container, TextField, Button, List, ListItem, ListItemText, IconButton } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { nanoid } from "nanoid";

export default function Home() {
  const [todos, setTodos] = useState<{ id: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  // 📌 画面読み込み時にローカルストレージからデータを取得
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // 📌 ToDoを追加する
  const addTodo = () => {
    if (!input.trim()) return;
    const newTodos = [...todos, { id: nanoid(), text: input }];
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

  return (
    <Container maxWidth="sm">
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
          <ListItem key={todo.id} secondaryAction={
            <IconButton edge="end" onClick={() => deleteTodo(todo.id)}>
              <Delete />
            </IconButton>
          }>
            <ListItemText primary={todo.text} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
