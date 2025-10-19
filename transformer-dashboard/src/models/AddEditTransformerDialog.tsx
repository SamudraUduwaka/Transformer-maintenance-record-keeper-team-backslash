import * as React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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

export interface TransformerFormData {
  region: string;
  transformerNo: string;
  poleNo: string;
  type: TransformerType | "";
  location: string;
}

export interface AddTransformerDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transformer: TransformerFormData, isEdit: boolean) => Promise<void>;
  transformer?: Transformer | null; // If provided, this is an edit operation
  regions: readonly string[];
  types: TransformerType[];
  isSaving?: boolean;
}

export const AddTransformerDialog: React.FC<AddTransformerDialogProps> = ({
  open,
  onClose,
  onSave,
  transformer,
  regions,
  types,
  isSaving = false,
}) => {
  const isEdit = !!transformer;

  // Form state
  const [form, setForm] = React.useState<TransformerFormData>({
    region: "",
    transformerNo: "",
    poleNo: "",
    type: "",
    location: "",
  });

  // Error state
  const [errors, setErrors] = React.useState<{ [k: string]: boolean }>({});

  // Initialize form when dialog opens with transformer data
  React.useEffect(() => {
    if (open) {
      if (transformer) {
        setForm({
          region: transformer.region,
          transformerNo: transformer.transformerNo,
          poleNo: transformer.poleNo,
          type: transformer.type,
          location: transformer.location || "",
        });
      } else {
        setForm({
          region: "",
          transformerNo: "",
          poleNo: "",
          type: "",
          location: "",
        });
      }
      setErrors({});
    }
  }, [open, transformer]);

  const updateField =
    (k: keyof TransformerFormData) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | React.ChangeEvent<{ value: unknown }>
        | { target: { value: unknown } }
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    const newErrors = {
      region: !form.region,
      transformerNo: !form.transformerNo,
      poleNo: !form.poleNo,
      type: !form.type,
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      await onSave(form, isEdit);
      handleClose();
    } catch (error) {
      console.error("Error saving transformer:", error);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        {isEdit ? "Edit Transformer" : "Add New Transformer"}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small" error={!!errors.region}>
            <InputLabel id="region-label">Region *</InputLabel>
            <Select
              labelId="region-label"
              label="Region *"
              value={form.region}
              onChange={updateField("region")}
              disabled={isSaving}
            >
              {regions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
            {errors.region && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                Region is required
              </Typography>
            )}
          </FormControl>

          <TextField
            size="small"
            label="Transformer No *"
            value={form.transformerNo}
            onChange={updateField("transformerNo")}
            error={!!errors.transformerNo}
            helperText={
              errors.transformerNo ? "Transformer number is required" : ""
            }
            fullWidth
            disabled={isEdit || isSaving} // Disable editing transformer number for existing records
          />

          <TextField
            size="small"
            label="Pole No *"
            value={form.poleNo}
            onChange={updateField("poleNo")}
            error={!!errors.poleNo}
            helperText={errors.poleNo ? "Pole number is required" : ""}
            fullWidth
            disabled={isSaving}
          />

          <FormControl fullWidth size="small" error={!!errors.type}>
            <InputLabel id="type-label">Type *</InputLabel>
            <Select
              labelId="type-label"
              label="Type *"
              value={form.type}
              onChange={updateField("type")}
              disabled={isSaving}
            >
              {types.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            {errors.type && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                Type is required
              </Typography>
            )}
          </FormControl>

          <TextField
            size="small"
            label="Location Details"
            value={form.location}
            onChange={updateField("location")}
            fullWidth
            multiline
            minRows={3}
            placeholder="Enter detailed location information..."
            disabled={isSaving}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={handleClose} disabled={isSaving} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            minWidth: 100,
            background: isEdit
              ? "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)"
              : "linear-gradient(180deg, #4F46E5 0%, #2E26C3 100%)",
          }}
        >
          {isSaving ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            isEdit ? "Update" : "Add"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};