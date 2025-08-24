import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Dashboard from "./pages/Dashboard";
import TransformerInspection from "./pages/TransformerInspection";
import InspectionDetails from "./pages/InspectionDetails";
import "./App.css";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
      <Routes>
        {/* Main dashboard with Transformers + Inspections views */}
        <Route path="/" element={<Dashboard />} />

        {/* Transformer-specific page (all inspections for a transformer) */}
        <Route path="/:transformerNo" element={<TransformerInspection />} />

        {/* Single inspection detail view */}
        <Route path="/:transformerNo/:inspectionNo" element={<InspectionDetails />} />

      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;

