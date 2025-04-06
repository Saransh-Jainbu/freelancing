import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import OrderActions from '../components/OrderActions';
import { useAuth } from '../contexts/AuthContext'; // Adjust import path as needed

const OrderDetail = ({ order, refreshOrder }) => {
  const { currentUser } = useAuth();
  const isClient = currentUser?.id === order?.client_id;
  
  const handleOrderUpdated = (updatedOrder) => {
    // Refresh order data with the updated order
    if (typeof refreshOrder === 'function') {
      refreshOrder();
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">
          Order #{order?.id}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Status: {order?.status}
        </Typography>
      </Box>
      
      {/* Order details go here */}
      
      {/* Only show actions to the client */}
      {isClient && (
        <Box sx={{ mt: 3 }}>
          <OrderActions 
            orderId={order?.id} 
            clientId={currentUser?.id}
            orderStatus={order?.status}
            onOrderUpdated={handleOrderUpdated}
          />
        </Box>
      )}
    </Paper>
  );
};

export default OrderDetail;
