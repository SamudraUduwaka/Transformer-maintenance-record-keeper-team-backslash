// import React from 'react';
// import {
//   Button,
//   ButtonGroup,
//   Chip,
//   Divider,
//   IconButton,
//   Paper,
//   Stack,
//   Tooltip,
//   Typography,
// } from '@mui/material';
// import {
//   Add as AddIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Download as DownloadIcon,
//   Refresh as RefreshIcon,
//   Visibility as VisibilityIcon,
//   VisibilityOff as VisibilityOffIcon,
// } from '@mui/icons-material';

// interface AnnotationToolbarProps {
//   // Counts
//   aiPredictionsCount: number;
//   manualAnnotationsCount: number;
  
//   // Visibility toggles
//   showAiPredictions: boolean;
//   showManualAnnotations: boolean;
//   onToggleAiPredictions: () => void;
//   onToggleManualAnnotations: () => void;
  
//   // Actions
//   onAddAnnotation: () => void;
//   onEditMode: () => void;
//   onDeleteMode: () => void;
//   onExportFeedback: () => void;
//   onRefresh: () => void;
  
//   // States
//   isEditMode?: boolean;
//   isDeleteMode?: boolean;
//   disabled?: boolean;
// }

// export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
//   aiPredictionsCount,
//   manualAnnotationsCount,
//   showAiPredictions,
//   showManualAnnotations,
//   onToggleAiPredictions,
//   onToggleManualAnnotations,
//   onAddAnnotation,
//   onEditMode,
//   onDeleteMode,
//   onExportFeedback,
//   onRefresh,
//   isEditMode = false,
//   isDeleteMode = false,
//   disabled = false,
// }) => {
//   return (
//     <Paper
//       elevation={2}
//       sx={{
//         p: 1.5,
//         mb: 2,
//         borderRadius: 2,
//         bgcolor: '#f8f9fa',
//         border: '1px solid',
//         borderColor: 'divider',
//       }}
//     >
//       <Stack
//         direction={{ xs: 'column', md: 'row' }}
//         spacing={2}
//         alignItems={{ xs: 'stretch', md: 'center' }}
//         justifyContent="space-between"
//       >
//         {/* Left: Annotation Counts */}
//         <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
//           <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
//             Annotations:
//           </Typography>
          
//           <Tooltip title={showAiPredictions ? "Hide AI predictions" : "Show AI predictions"}>
//             <Chip
//               label={`AI: ${aiPredictionsCount}`}
//               size="small"
//               color="info"
//               variant={showAiPredictions ? 'filled' : 'outlined'}
//               onClick={onToggleAiPredictions}
//               icon={showAiPredictions ? <VisibilityIcon /> : <VisibilityOffIcon />}
//               sx={{ cursor: 'pointer' }}
//             />
//           </Tooltip>
          
//           <Tooltip title={showManualAnnotations ? "Hide manual annotations" : "Show manual annotations"}>
//             <Chip
//               label={`Manual: ${manualAnnotationsCount}`}
//               size="small"
//               color="secondary"
//               variant={showManualAnnotations ? 'filled' : 'outlined'}
//               onClick={onToggleManualAnnotations}
//               icon={showManualAnnotations ? <VisibilityIcon /> : <VisibilityOffIcon />}
//               sx={{ cursor: 'pointer' }}
//             />
//           </Tooltip>
//         </Stack>

//         {/* Right: Action Buttons */}
//         <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
//           <ButtonGroup size="small" variant="outlined" disabled={disabled}>
//             <Tooltip title="Add new annotation">
//               <Button
//                 startIcon={<AddIcon />}
//                 onClick={onAddAnnotation}
//                 sx={{ textTransform: 'none' }}
//               >
//                 Add
//               </Button>
//             </Tooltip>
            
//             <Tooltip title="Edit existing annotations">
//               <Button
//                 startIcon={<EditIcon />}
//                 onClick={onEditMode}
//                 variant={isEditMode ? 'contained' : 'outlined'}
//                 sx={{ textTransform: 'none' }}
//               >
//                 Edit
//               </Button>
//             </Tooltip>
            
//             <Tooltip title="Delete annotations">
//               <Button
//                 startIcon={<DeleteIcon />}
//                 onClick={onDeleteMode}
//                 variant={isDeleteMode ? 'contained' : 'outlined'}
//                 color={isDeleteMode ? 'error' : 'primary'}
//                 sx={{ textTransform: 'none' }}
//               >
//                 Delete
//               </Button>
//             </Tooltip>
//           </ButtonGroup>

//           <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

//           <Tooltip title="Export feedback for model training">
//             <IconButton
//               size="small"
//               onClick={onExportFeedback}
//               disabled={disabled}
//               color="primary"
//             >
//               <DownloadIcon />
//             </IconButton>
//           </Tooltip>

//           <Tooltip title="Refresh annotations">
//             <IconButton
//               size="small"
//               onClick={onRefresh}
//               disabled={disabled}
//               color="primary"
//             >
//               <RefreshIcon />
//             </IconButton>
//           </Tooltip>
//         </Stack>
//       </Stack>
//     </Paper>
//   );
// };

// export default AnnotationToolbar;
