import * as React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

// Types matching the backend DTOs
export type InspectionDTO = {
  inspectionId: number;
  inspectionTime: string; // ISO string from backend
  branch: string;
  inspector: string;
  createdAt: string;
  updatedAt: string;
  transformerNo: string;
};

export interface AddInspectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (inspectionData: {
    branch: string;
    transformerNo: string;
    inspector: string;
    inspectionTime: string;
  }) => Promise<void>;
  isCreating?: boolean;
  defaultTransformerNo?: string; // Pre-populate transformer number
  defaultBranch?: string; // Pre-populate branch
}

export const AddInspectionDialog: React.FC<AddInspectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isCreating = false,
  defaultTransformerNo,
  defaultBranch,
}) => {
  // Dialog state
  const [branch, setBranch] = React.useState("");
  const [transformerNo, setTransformerNo] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [inspector, setInspector] = React.useState("");

  // Validation
  const canConfirm =
    branch.trim() && transformerNo.trim() && date && time && inspector.trim();

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setBranch(defaultBranch || "");
      setTransformerNo(defaultTransformerNo || "");
      setDate("");
      setTime("");
      setInspector("");
    }
  }, [open, defaultTransformerNo, defaultBranch]);

  // Set transformer number when defaultTransformerNo is provided
  React.useEffect(() => {
    if (defaultTransformerNo) {
      setTransformerNo(defaultTransformerNo);
    }
  }, [defaultTransformerNo]);

  // Set branch when defaultBranch is provided
  React.useEffect(() => {
    if (defaultBranch) {
      setBranch(defaultBranch);
    }
  }, [defaultBranch]);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;

    try {
      // Format date correctly for backend (remove milliseconds and timezone)
      const inspectionTime = new Date(`${date}T${time}`)
        .toISOString()
        .split(".")[0];

      const newInspection = {
        branch: branch.trim(),
        transformerNo: transformerNo.trim(),
        inspector: inspector.trim(),
        inspectionTime,
      };

      await onConfirm(newInspection);
    } catch (error) {
      // Error handling is done by parent component
      console.error("Error in AddInspectionDialog:", error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography fontWeight={700} fontSize="1.25rem">
            {defaultTransformerNo
              ? `New Inspection for ${defaultTransformerNo}`
              : "New Inspection"}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#FBFBFE" }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Branch"
              placeholder="Branch"
              fullWidth
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />

            {!defaultTransformerNo && (
              <TextField
                label="Transformer No"
                placeholder="Transformer No"
                fullWidth
                value={transformerNo}
                onChange={(e) => setTransformerNo(e.target.value)}
              />
            )}

            {defaultTransformerNo && (
              <TextField
                label="Transformer No"
                fullWidth
                value={transformerNo}
                disabled
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "rgba(0, 0, 0, 0.6)",
                  },
                }}
              />
            )}

            <TextField
              label="Inspector"
              placeholder="Inspector Name"
              fullWidth
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DatePicker
                label="Date of Inspection"
                value={date ? dayjs(date) : null}
                onChange={(v) => setDate(v ? v.format("YYYY-MM-DD") : "")}
                slotProps={{
                  textField: { fullWidth: true },
                  openPickerButton: {
                    onMouseDown: (e) => e.preventDefault(),
                    disableRipple: true,
                    disableFocusRipple: true,
                  },
                }}
              />
              <TimePicker
                label="Time"
                value={time ? dayjs(`1970-01-01T${time}`) : null}
                onChange={(v) => setTime(v ? v.format("HH:mm") : "")}
                slotProps={{
                  textField: { fullWidth: true },
                  openPickerButton: {
                    onMouseDown: (e) => e.preventDefault(),
                    disableRipple: true,
                    disableFocusRipple: true,
                  },
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!canConfirm || isCreating}
            sx={{
              mr: 1,
              borderRadius: 999,
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
              color: "#fff",
              boxShadow: "0 8px 18px rgba(79,70,229,0.35)",
              "&:hover": {
                background: "linear-gradient(180deg, #4338CA 0%, #2A21B8 100%)",
                boxShadow: "0 10px 22px rgba(79,70,229,0.45)",
              },
              "&.Mui-disabled": {
                background: "#A5B4FC",
                color: "#fff",
              },
            }}
          >
            {isCreating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirm"
            )}
          </Button>

          <Button onClick={handleClose} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddInspectionDialog;
