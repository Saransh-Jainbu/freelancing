import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress
} from '@mui/material';

const CancellationDialog = ({ open, onClose, onConfirm, orderId, isLoading }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    setError('');
  };

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters)');
      return;
    }
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Order Cancellation</DialogTitle>
      <DialogContent>
        <DialogContentText mb={2}>
          Are you sure you want to cancel order #{orderId}? This request will be sent to the freelancer for approval.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="reason"
          label="Cancellation Reason"
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={reason}
          onChange={handleReasonChange}
          error={!!error}
          helperText={error}
          disabled={isLoading}
          placeholder="Please explain why you want to cancel this order..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained" 
          disabled={isLoading || reason.trim().length < 10}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Submitting...' : 'Request Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancellationDialog;
