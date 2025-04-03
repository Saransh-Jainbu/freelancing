// HTML template for new order notification
function newOrderTemplate(order, buyer, seller) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          text-align: center;
          color: #888;
        }
        .button {
          display: inline-block;
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 15px;
        }
        .details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .price {
          font-size: 20px;
          font-weight: bold;
          color: #8b5cf6;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Order Placed</h1>
      </div>
      <div class="content">
        <p>Hi ${seller.display_name},</p>
        <p>Great news! You've received a new order on UniTask.</p>
        
        <div class="details">
          <h2>${order.gig_title}</h2>
          <p><strong>Order #:</strong> ${order.id}</p>
          <p><strong>Package:</strong> ${order.package_type.charAt(0).toUpperCase() + order.package_type.slice(1)}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Buyer:</strong> ${buyer.display_name}</p>
          <p><strong>Amount:</strong> <span class="price">$${order.amount}</span></p>
          <p><strong>Expected delivery:</strong> ${order.delivery_time} days</p>
        </div>
        
        <p>Please review the order details and requirements. The buyer is waiting for your response!</p>
        
        <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">View Order Details</a>
        
        <p>Thank you for being part of our platform!</p>
        <p>Best Regards,<br>The UniTask Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message, please do not reply directly to this email.</p>
        <p>&copy; ${new Date().getFullYear()} UniTask. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

// Text-only version for email clients that don't support HTML
function newOrderTextTemplate(order, buyer, seller) {
  return `
New Order Placed

Hi ${seller.display_name},

Great news! You've received a new order on UniTask.

ORDER DETAILS:
${order.gig_title}
Order #: ${order.id}
Package: ${order.package_type.charAt(0).toUpperCase() + order.package_type.slice(1)}
Quantity: ${order.quantity}
Buyer: ${buyer.display_name}
Amount: $${order.amount}
Expected delivery: ${order.delivery_time} days

Please review the order details and requirements. The buyer is waiting for your response!

View Order Details: ${process.env.FRONTEND_URL}/orders/${order.id}

Thank you for being part of our platform!

Best Regards,
The UniTask Team

This is an automated message, please do not reply directly to this email.
© ${new Date().getFullYear()} UniTask. All rights reserved.
`;
}

// HTML template for order confirmation to buyer
function orderConfirmationTemplate(order, seller) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 5px 5px;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          text-align: center;
          color: #888;
        }
        .button {
          display: inline-block;
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 15px;
        }
        .details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .price {
          font-size: 20px;
          font-weight: bold;
          color: #8b5cf6;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Confirmation</h1>
      </div>
      <div class="content">
        <p>Thank you for your order on UniTask!</p>
        
        <div class="details">
          <h2>${order.gig_title}</h2>
          <p><strong>Order #:</strong> ${order.id}</p>
          <p><strong>Package:</strong> ${order.package_type.charAt(0).toUpperCase() + order.package_type.slice(1)}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Seller:</strong> ${seller.display_name}</p>
          <p><strong>Amount:</strong> <span class="price">$${order.amount}</span></p>
          <p><strong>Expected delivery:</strong> ${order.delivery_time} days</p>
        </div>
        
        <p>The seller has been notified. You will receive updates as your order progresses.</p>
        
        <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">View Your Order</a>
        
        <p>Thank you for choosing UniTask!</p>
        <p>Best Regards,<br>The UniTask Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message, please do not reply directly to this email.</p>
        <p>&copy; ${new Date().getFullYear()} UniTask. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

// Text-only version for buyer confirmation
function orderConfirmationTextTemplate(order, seller) {
  return `
Order Confirmation

Thank you for your order on UniTask!

ORDER DETAILS:
${order.gig_title}
Order #: ${order.id}
Package: ${order.package_type.charAt(0).toUpperCase() + order.package_type.slice(1)}
Quantity: ${order.quantity}
Seller: ${seller.display_name}
Amount: $${order.amount}
Expected delivery: ${order.delivery_time} days

The seller has been notified. You will receive updates as your order progresses.

View Your Order: ${process.env.FRONTEND_URL}/orders/${order.id}

Thank you for choosing UniTask!

Best Regards,
The UniTask Team

This is an automated message, please do not reply directly to this email.
© ${new Date().getFullYear()} UniTask. All rights reserved.
`;
}

module.exports = {
  newOrderTemplate,
  newOrderTextTemplate,
  orderConfirmationTemplate,
  orderConfirmationTextTemplate
};
