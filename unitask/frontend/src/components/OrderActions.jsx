import React from 'react';
import { Button, Tooltip, Box } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useOrderCancellation } from '../hooks/useOrderCancellation';
import CancellationConfirmDialog from './CancellationConfirmDialog';
import { useSnackbar } from 'notistack';

const OrderActions = ({ orderId, clientId, orderStatus, onOrderUpdated }) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const {
    isDialogOpen,
    isLoading,
    openCancellationDialog,
    closeCancellationDialog,
    requestCancellation
  } = useOrderCancellation(
    clientId,
    (updatedOrder) => {
      // Success handler
      enqueueSnackbar('Cancellation request sent to freelancer', { 
        variant: 'success' 
      });
      
      if (typeof onOrderUpdated === 'function') {
        onOrderUpdated(updatedOrder);
      }
    },
    (errorMessage) => {
      // Error handler
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  );
  
  // Only show cancel button for orders that can be cancelled
  const canCancel = ['pending', 'in_progress', 'verifying'].includes(orderStatus);
  
  if (!canCancel) return null;
  
  return (
    <>
      <Box>
        <Tooltip title="Request cancellation">
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => openCancellationDialog(orderId)}
          >
            Cancel Order
          </Button>
        </Tooltip>
      </Box>
      
      <CancellationConfirmDialog
        open={isDialogOpen}
        onClose={closeCancellationDialog}
        onConfirm={requestCancellation}
        isLoading={isLoading}
        orderNumber={orderId}
      />
    </>
  );
};

export default OrderActions;
