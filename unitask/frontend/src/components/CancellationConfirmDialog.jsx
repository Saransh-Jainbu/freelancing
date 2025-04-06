import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';

const CancellationConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Cancel Order",
  orderNumber = ""
}) => {
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);
  
  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      setShowError(true);
      return;
    }
    
    setShowError(false);
    onConfirm(reason);
  };
  
  const handleClose = () => {
    setReason('');
    setShowError(false);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box my={2}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to cancel this order {orderNumber ? `#${orderNumber}` : ''}?
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            The freelancer will need to approve your cancellation request. 
            If approved, the order will be cancelled. If rejected, the order will continue normally.
          </Typography>
          
          <TextField
            margin="normal"
            fullWidth
            label="Reason for cancellation"
            placeholder="Please provide a detailed reason for cancellation (minimum 10 characters)"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim().length >= 10) {
                setShowError(false);
              }
            }}
            error={showError}
            helperText={showError ? "Please enter at least 10 characters" : ""}
            disabled={isLoading}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          color="inherit" 
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={reason.trim().length < 10 || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Processing...' : 'Request Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancellationConfirmDialog;
