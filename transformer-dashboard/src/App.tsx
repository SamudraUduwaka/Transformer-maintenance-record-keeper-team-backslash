import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TransformerInspection from "./pages/TransformerInspection";
import InspectionDetails from "./pages/InspectionDetails"; // 👈 new page
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Main dashboard with Transformers + Inspections views */}
        <Route path="/" element={<Dashboard />} />

        {/* Transformer-specific page (all inspections for a transformer) */}
        <Route
          path="/:transformerNo"
          element={<TransformerInspection />}
        />

        {/* Single inspection detail view */}
        <Route
          path="/:transformerNo/:inspectionNo"
          element={<InspectionDetails />}
        />
      </Routes>
    </Router>
  );
}

export default App;
