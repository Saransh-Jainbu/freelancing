// ... existing code ...

// Mark messages as read
router.post('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds, userId } = req.body;
    
    if (!messageIds || !messageIds.length || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // Update message read status
    await query(
      `UPDATE messages 
       SET is_read = true, read_at = NOW() 
       WHERE id = ANY($1::int[]) AND conversation_id = $2 AND sender_id != $3`,
      [messageIds, conversationId, userId]
    );
    
    // Emit read status through socket.io
    const io = req.app.get('io');
    io.to(`conversation-${conversationId}`).emit('message-read', {
      messageIds,
      userId,
      conversationId
    });
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// ... existing code ...
