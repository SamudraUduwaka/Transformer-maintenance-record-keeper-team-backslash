import * as React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export interface DeleteInspectionConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  inspectionId: number | null;
  isDeleting?: boolean;
}

export const DeleteInspectionConfirmationDialog: React.FC<DeleteInspectionConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  inspectionId,
  isDeleting = false,
}) => {
  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    if (inspectionId === null) return;

    try {
      await onConfirm(inspectionId);
    } catch (error) {
      console.error("Error in DeleteInspectionConfirmationDialog:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
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
          Confirm Delete
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography>
          Are you sure you want to delete this inspection? This action cannot
          be undone.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={isDeleting}
          sx={{
            mr: 1,
            borderRadius: 999,
            px: 3,
            py: 1,
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          {isDeleting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Delete"
          )}
        </Button>

        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteInspectionConfirmationDialog;