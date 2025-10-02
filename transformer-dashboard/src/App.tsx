import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import theme from "./theme";
import Dashboard from "./pages/Dashboard";
import TransformerInspection from "./pages/TransformerInspection";
import InspectionDetails from "./pages/InspectionDetails";
import "./App.css";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Main dashboard with Transformers + Inspections views */}
            <Route path="/" element={<Dashboard />} />

            {/* Transformer-specific page (all inspections for a transformer) */}
            <Route path="/:transformerNo" element={<TransformerInspection />} />

            {/* Single inspection detail view */}
            <Route
              path="/:transformerNo/:inspectionNo"
              element={<InspectionDetails />}
            />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
