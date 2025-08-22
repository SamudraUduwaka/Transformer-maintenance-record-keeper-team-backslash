import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TransformerInspection from "./pages/TransformerInspection"; // 👈 import new page
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Main dashboard with Transformers + Inspections views */}
        <Route path="/" element={<Dashboard />} />

        {/* Transformer-specific inspection detail page */}
        <Route path="/inspections/:transformerNo" element={<TransformerInspection />} />
      </Routes>
    </Router>
  );
}

export default App;
