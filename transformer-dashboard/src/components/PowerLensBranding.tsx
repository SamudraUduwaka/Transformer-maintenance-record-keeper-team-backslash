import React from "react";
import { Stack, Typography } from "@mui/material";
import { Bolt as BoltIcon } from "@mui/icons-material";

const PowerLensBranding: React.FC = () => {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2 }}>
      <BoltIcon
        sx={{
          fontSize: 32,
          color: "#1E3A8A",
          filter: "drop-shadow(0 2px 4px rgba(30, 58, 138, 0.5))",
        }}
      />
      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          background:
            "linear-gradient(45deg, #1E3A8A 20%, #E91E63 60%, #4C1D95 90%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 1px 2px rgba(233, 30, 99, 0.4))",
          fontFamily: "'Orbitron', 'Roboto Mono', 'Courier New', monospace",
          letterSpacing: "0.5px",
        }}
      >
        PowerLens
      </Typography>
    </Stack>
  );
};

export default PowerLensBranding;
