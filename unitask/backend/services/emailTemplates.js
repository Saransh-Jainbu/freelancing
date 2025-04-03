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
        .steps {
          margin: 20px 0;
        }
        .step {
          display: flex;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        .step-number {
          background-color: #8b5cf6;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          flex-shrink: 0;
        }
        .step-content {
          flex: 1;
        }
        .thank-you-box {
          background: linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
          border-left: 4px solid #8b5cf6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 5px 5px 0;
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
        
        <div class="thank-you-box">
          <h3 style="margin-top: 0;">Your order has been successfully placed!</h3>
          <p>The seller has been notified and will begin working on your order soon.</p>
        </div>
        
        <h3>Next Steps:</h3>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <strong>Wait for seller acceptance</strong>
              <p>The seller will review and accept your order soon.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <strong>Communicate with the seller</strong>
              <p>Use the order chat to discuss requirements in detail.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <strong>Receive and review delivery</strong>
              <p>You'll be notified when your order is delivered.</p>
            </div>
          </div>
        </div>
        
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
