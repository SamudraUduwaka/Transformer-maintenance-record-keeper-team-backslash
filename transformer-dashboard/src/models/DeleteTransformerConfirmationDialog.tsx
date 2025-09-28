import * as React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Types matching the Dashboard component
export type TransformerType = "Bulk" | "Distribution";

export interface Transformer {
  id?: number;
  transformerNo: string;
  poleNo: string;
  region: string;
  type: TransformerType;
  favorite?: boolean;
  location?: string;
}

export interface DeleteTransformerConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transformer: Transformer | null;
  isDeleting?: boolean;
}

export const DeleteTransformerConfirmationDialog: React.FC<DeleteTransformerConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  transformer,
  isDeleting = false,
}) => {
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Parent component will handle closing the dialog on success
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Error deleting transformer:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="error" />
            <Typography variant="h6" component="span">
              Confirm Delete
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small" disabled={isDeleting}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete this transformer?
        </Typography>

        {transformer && (
          <Paper
            sx={{
              p: 2,
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 2,
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Transformer No:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {transformer.transformerNo}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Pole No:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {transformer.poleNo}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Region:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {transformer.region}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Type:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {transformer.type}
                </Typography>
              </Stack>
              {transformer.location && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Location:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ maxWidth: "60%", textAlign: "right" }}
                  >
                    {transformer.location}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
        )}

        <Typography
          variant="body2"
          color="error"
          sx={{ mt: 2, fontStyle: "italic" }}
        >
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={handleClose} disabled={isDeleting} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={isDeleting}
          sx={{
            minWidth: 100,
            background: "linear-gradient(45deg, #f44336 30%, #d32f2f 90%)",
            "&:hover": {
              background: "linear-gradient(45deg, #d32f2f 30%, #b71c1c 90%)",
            },
          }}
        >
          {isDeleting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Delete"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};