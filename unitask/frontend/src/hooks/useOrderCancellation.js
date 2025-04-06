import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useOrderCancellation = (clientId, onSuccess, onError) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  
  const openCancellationDialog = (orderId) => {
    setCurrentOrderId(orderId);
    setIsDialogOpen(true);
  };
  
  const closeCancellationDialog = () => {
    setIsDialogOpen(false);
  };
  
  const requestCancellation = async (reason) => {
    if (!currentOrderId || !clientId) return;
    
    setIsLoading(true);
    
    try {
      // Send cancellation request
      const response = await axios.post(
        `${API_URL}/api/orders/${currentOrderId}/request-cancellation`,
        {
          clientId,
          reason
        }
      );
      
      setIsLoading(false);
      
      if (response.data.success) {
        setIsDialogOpen(false);
        
        // Call success callback with updated order
        if (typeof onSuccess === 'function') {
          onSuccess(response.data.order);
        }
      }
    } catch (error) {
      setIsLoading(false);
      
      console.error('Error requesting cancellation:', error);
      
      // Call error callback with error message
      if (typeof onError === 'function') {
        onError(error.response?.data?.message || 'Error requesting cancellation');
      }
    }
  };
  
  return {
    isDialogOpen,
    isLoading,
    currentOrderId,
    openCancellationDialog,
    closeCancellationDialog,
    requestCancellation
  };
};
