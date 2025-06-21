# E-Commerce Full-Stack Website

A complete e-commerce solution built with vanilla JavaScript, HTML, CSS for the frontend and Node.js, Express.js for the backend with MongoDB database.

## Features

### User Features
- Browse, search, and sort products
- Add products to cart and place orders
- Multiple payment options (online payment and cash on delivery)
- Order tracking system
- FAQ and customer support section

### Admin Features
- Product management (add, edit, delete)
- Order management and status updates
- User activity monitoring
- Sales analytics and reports
- Inventory control
- Customer support management

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (online connection)
- **No frameworks**: Pure vanilla implementation without React, Next.js, or TypeScript

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ecommerce-fullstack
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up MongoDB:
   - Create a MongoDB Atlas account
   - Create a new cluster and database
   - Get your connection string
   - Replace the MONGODB_URI in server.js with your connection string

4. Start the server:
\`\`\`bash
npm start
\`\`\`

For development with auto-restart:
\`\`\`bash
npm run dev
\`\`\`

5. Open your browser and navigate to:
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Environment Variables

Create a `.env` file in the root directory and add:

\`\`\`
MONGODB_URI=your_mongodb_connection_string
PORT=3000
\`\`\`

## Project Structure

\`\`\`
ecommerce-fullstack/
├── public/
│   ├── index.html          # Main website
│   ├── admin.html          # Admin panel
│   ├── styles/
│   │   ├── main.css        # Main site styles
│   │   └── admin.css       # Admin panel styles
│   └── js/
│       ├── main.js         # Main site JavaScript
│       └── admin.js        # Admin panel JavaScript
├── server.js               # Express server
├── package.json
└── README.md
\`\`\`

## API Endpoints

### Public Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId/track` - Track order
- `POST /api/support` - Submit support message

### Admin Endpoints
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `POST /api/admin/products` - Add new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/support` - Get support messages

## Database Collections

### Products
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  stock: Number,
  rating: Number,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Orders
\`\`\`javascript
{
  _id: ObjectId,
  orderId: String,
  items: Array,
  shipping: Object,
  payment: Object,
  total: Number,
  status: String,
  orderDate: Date,
  updatedAt: Date
}
\`\`\`

### Support
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  message: String,
  status: String,
  createdAt: Date
}
\`\`\`

## Features Implementation

### Search and Filter
- Real-time product search
- Category filtering
- Price sorting (low to high, high to low)
- Rating-based sorting

### Shopping Cart
- Add/remove items
- Quantity management
- Persistent cart (localStorage)
- Real-time total calculation

### Order Management
- Order placement with shipping details
- Payment method selection
- Order tracking with status updates
- Order history

### Admin Dashboard
- Sales statistics
- Recent orders overview
- Top-selling products
- Revenue analytics

## Responsive Design

The website is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact [your-email@example.com] or create an issue in the repository.
