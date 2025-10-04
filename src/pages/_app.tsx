import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f4f5f7",
      paper: "#ffffff",
    },
    primary: {
      main: "#4f6d7a",
      light: "#6b8794",
      dark: "#2f4d5a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#8aa0b3",
      contrastText: "#1f2933",
    },
    text: {
      primary: "#1f2933",
      secondary: "#52606d",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderRadius: 14,
          textTransform: "none",
          fontWeight: 600,
          transition: "background-color 0.2s ease, color 0.2s ease",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
