import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useClientCancellation = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [error, setError] = useState(null);

  const openCancellationDialog = (orderId) => {
    setCurrentOrderId(orderId);
    setIsDialogOpen(true);
    setError(null);
  };

  const closeCancellationDialog = () => {
    setIsDialogOpen(false);
    setError(null);
  };

  const requestCancellation = async (clientId, reason, onSuccess) => {
    if (!currentOrderId || !clientId || !reason) {
      setError('Missing required information');
      return;
    }

    setIsLoading(true);

    try {
      // Use the new client-cancel endpoint instead of the status endpoint
      const response = await axios.post(`${API_URL}/api/orders/${currentOrderId}/client-cancel`, {
        clientId,
        reason
      });

      setIsLoading(false);

      if (response.data.success) {
        closeCancellationDialog();
        if (typeof onSuccess === 'function') {
          onSuccess(response.data.order);
        }
      } else {
        setError(response.data.message || 'Failed to request cancellation');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Error requesting cancellation');
      console.error('Cancellation request error:', err);
    }
  };

  return {
    isDialogOpen,
    isLoading,
    currentOrderId,
    error,
    openCancellationDialog,
    closeCancellationDialog,
    requestCancellation
  };
};
