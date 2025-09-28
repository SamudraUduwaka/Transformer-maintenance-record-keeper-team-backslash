import * as React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
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
export type ImageStatus = "baseline" | "maintenance" | "no image";

export type InspectionRow = {
  id: number;
  transformerNo: string;
  inspectionNo: string;
  inspectedDate: string;
  maintenanceDate: string;
  status: ImageStatus;
  branch: string;
  inspector: string;
  inspectionTime: string;
};

export interface EditInspectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    id: number,
    inspectionData: {
      branch: string;
      transformerNo: string;
      inspector: string;
      inspectionTime: string;
    }
  ) => Promise<void>;
  inspectionData: InspectionRow | null;
  isSaving?: boolean;
}

export const EditInspectionDialog: React.FC<EditInspectionDialogProps> = ({
  open,
  onClose,
  onSave,
  inspectionData,
  isSaving = false,
}) => {
  // Dialog state
  const [editBranch, setEditBranch] = React.useState("");
  const [editTransformerNo, setEditTransformerNo] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editTime, setEditTime] = React.useState("");
  const [editInspector, setEditInspector] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<ImageStatus>("no image");

  // Validation
  const canSave =
    editBranch.trim() &&
    editTransformerNo.trim() &&
    editDate &&
    editTime &&
    editInspector.trim();

  // Initialize form with inspection data when dialog opens
  React.useEffect(() => {
    if (open && inspectionData) {
      setEditBranch(inspectionData.branch);
      setEditTransformerNo(inspectionData.transformerNo);
      setEditInspector(inspectionData.inspector);
      setEditStatus(inspectionData.status);

      // Parse the ISO string back to date and time
      const inspectionDate = new Date(inspectionData.inspectionTime);
      setEditDate(inspectionDate.toISOString().split("T")[0]); // yyyy-mm-dd
      setEditTime(inspectionDate.toTimeString().slice(0, 5)); // hh:mm
    }
  }, [open, inspectionData]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setEditBranch("");
      setEditTransformerNo("");
      setEditDate("");
      setEditTime("");
      setEditInspector("");
      setEditStatus("no image");
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!canSave || !inspectionData) return;

    try {
      // Format date correctly for backend (remove milliseconds and timezone)
      const inspectionTime = new Date(`${editDate}T${editTime}`)
        .toISOString()
        .split(".")[0];

      const updates = {
        branch: editBranch.trim(),
        transformerNo: editTransformerNo.trim(),
        inspector: editInspector.trim(),
        inspectionTime,
      };

      await onSave(inspectionData.id, updates);
    } catch (error) {
      // Error handling is done by parent component
      console.error("Error in EditInspectionDialog:", error);
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
            Edit Inspection
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
              value={editBranch}
              onChange={(e) => setEditBranch(e.target.value)}
            />

            <TextField
              label="Transformer No"
              placeholder="Transformer No"
              fullWidth
              value={editTransformerNo}
              onChange={(e) => setEditTransformerNo(e.target.value)}
            />

            <TextField
              label="Inspector"
              placeholder="Inspector Name"
              fullWidth
              value={editInspector}
              onChange={(e) => setEditInspector(e.target.value)}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DatePicker
                label="Date of Inspection"
                value={editDate ? dayjs(editDate) : null}
                onChange={(v) => setEditDate(v ? v.format("YYYY-MM-DD") : "")}
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
                value={editTime ? dayjs(`1970-01-01T${editTime}`) : null}
                onChange={(v) => setEditTime(v ? v.format("HH:mm") : "")}
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

            <Select
              label="Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as ImageStatus)}
              fullWidth
              displayEmpty
              renderValue={(value) => value || "Select Status"}
            >
              <MenuItem value="baseline">Baseline</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="no image">No Image</MenuItem>
            </Select>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!canSave || isSaving}
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
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save Changes"
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

export default EditInspectionDialog;
