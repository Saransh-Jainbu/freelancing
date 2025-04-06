import React from 'react';
import { Button, Tooltip } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useClientCancellation } from '../hooks/useClientCancellation';
import CancellationDialog from './CancellationDialog';

const CancelOrderButton = ({ orderId, clientId, onOrderUpdated }) => {
  const {
    isDialogOpen,
    isLoading,
    currentOrderId,
    error,
    openCancellationDialog,
    closeCancellationDialog,
    requestCancellation
  } = useClientCancellation();

  const handleConfirm = (reason) => {
    requestCancellation(clientId, reason, (updatedOrder) => {
      // When cancellation is successful
      if (onOrderUpdated) {
        onOrderUpdated(updatedOrder);
      }
    });
  };

  return (
    <>
      <Tooltip title="Request order cancellation">
        <Button
          variant="outlined"
          color="error"
          startIcon={<CancelIcon />}
          onClick={() => openCancellationDialog(orderId)}
        >
          Cancel Order
        </Button>
      </Tooltip>
      
      <CancellationDialog
        open={isDialogOpen}
        onClose={closeCancellationDialog}
        onConfirm={handleConfirm}
        orderId={currentOrderId}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default CancelOrderButton;
