// import React, { useState } from 'react';
// import { Box, Container, Paper, Typography } from '@mui/material';
// import AnnotationToolbar from '../components/AnnotationToolbar';
// import DrawingCanvas from '../components/DrawingCanvas';

// const AnnotationDemo: React.FC = () => {
//   // Mock state
//   const [showAiPredictions, setShowAiPredictions] = useState(true);
//   const [showManualAnnotations, setShowManualAnnotations] = useState(true);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [isDeleteMode, setIsDeleteMode] = useState(false);
//   const [isDrawingMode, setIsDrawingMode] = useState(false);

//   // Mock thermal image URL (replace with any image URL)
//   const mockThermalImageUrl = 'https://via.placeholder.com/640x480/ff6b6b/ffffff?text=Thermal+Image';

//   const handleSaveDrawing = async (
//     box: { x: number; y: number; width: number; height: number },
//     faultType: string,
//     comments: string
//   ) => {
//     console.log('Annotation saved:', { box, faultType, comments });
//     alert(`Annotation saved!\n\nFault Type: ${faultType}\nComments: ${comments}\nBox: ${JSON.stringify(box)}`);
//     setIsDrawingMode(false);
//   };

//   return (
//     <Container maxWidth="lg" sx={{ py: 4 }}>
//       <Typography variant="h4" fontWeight={700} gutterBottom>
//         Annotation Tools Demo
//       </Typography>
//       <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//         Test the annotation toolbar and drawing canvas UI
//       </Typography>

//       {/* Annotation Toolbar */}
//       <AnnotationToolbar
//         aiPredictionsCount={4}
//         manualAnnotationsCount={2}
//         showAiPredictions={showAiPredictions}
//         showManualAnnotations={showManualAnnotations}
//         onToggleAiPredictions={() => setShowAiPredictions(!showAiPredictions)}
//         onToggleManualAnnotations={() => setShowManualAnnotations(!showManualAnnotations)}
//         onAddAnnotation={() => setIsDrawingMode(true)}
//         onEditMode={() => {
//           setIsEditMode(!isEditMode);
//           setIsDeleteMode(false);
//         }}
//         onDeleteMode={() => {
//           setIsDeleteMode(!isDeleteMode);
//           setIsEditMode(false);
//         }}
//         onExportFeedback={() => alert('Export feedback clicked')}
//         onRefresh={() => alert('Refresh annotations clicked')}
//         isEditMode={isEditMode}
//         isDeleteMode={isDeleteMode}
//         disabled={isDrawingMode}
//       />

//       {/* Drawing Canvas (conditionally shown) */}
//       {isDrawingMode ? (
//         <Paper sx={{ p: 2.5 }}>
//           <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
//             Draw Bounding Box
//           </Typography>
//           <DrawingCanvas
//             imageUrl={mockThermalImageUrl}
//             onSave={handleSaveDrawing}
//             onCancel={() => setIsDrawingMode(false)}
//             isActive={isDrawingMode}
//           />
//         </Paper>
//       ) : (
//         <Paper sx={{ p: 3, textAlign: 'center' }}>
//           <Typography variant="h6" color="text.secondary">
//             Click "Add" to start drawing annotations
//           </Typography>
//         </Paper>
//       )}

//       {/* Debug Info */}
//       <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f5f5' }}>
//         <Typography variant="subtitle2" fontWeight={700} gutterBottom>
//           Debug Info
//         </Typography>
//         <Typography variant="body2">
//           Show AI: {showAiPredictions ? 'Yes' : 'No'} | 
//           Show Manual: {showManualAnnotations ? 'Yes' : 'No'} | 
//           Edit Mode: {isEditMode ? 'On' : 'Off'} | 
//           Delete Mode: {isDeleteMode ? 'On' : 'Off'} | 
//           Drawing Mode: {isDrawingMode ? 'On' : 'Off'}
//         </Typography>
//       </Paper>
//     </Container>
//   );
// };

// export default AnnotationDemo;
