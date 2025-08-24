import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4F46E5" },
    secondary: { main: "#7C3AED" },
    background: { default: "#F7F7FB" },
    text: { primary: "#101828", secondary: "#667085" },
    success: { main: "#16A34A" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 14, fontWeight: 600 },
      },
    },
  },
});

export default theme;