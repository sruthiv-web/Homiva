# Homiva-Home Decor E-commerce platform
Homiva is an online home decor and living products shopping platform.
Users can browse products, search and filter products, add products to their cart and wishlist, apply coupons, and place orders.
The platform also provides an admin dashboard to manage products, customers, orders, coupons, and view business analytics.


## Technologies used

### frontend
HTML
CSS
JavaScript
EJS
Bootstrap

### backend
Node.js
Express.js

### Database
MongoDB
Mongoose

### Authentication & Security
JWT
bcrypt
HTTP-only Cookies

### Other Tools & Libraries
Chart.js
Cloudinary
Razorpay
Git & GitHub


## Main Features

### Customer
- User Registration and Login
- Browse and Search Products
- Product Filtering and Sorting
- Product Details
- Wishlist Management
- Shopping Cart
- Coupon Application
- Secure Checkout and Payment
- Order Management
- User Profile Management


### Admin
- Admin Login
- Dashboard and Analytics
- Product Management
- user Management
- Order Management
- Coupon Management


## Installation and Setup

### 1. Clone the Repository

   git clone https://github.com/sruthiv-web/Homiva.git

### 2. Navigate to the Project Folder

   cd homiva

### 3. Install Dependencies

    npm install

### 4. Configure Environment Variables

     Create a .env file in the root directory and add the required environment variables.

     PORT=
     LOCAL_MONGODB_URI=
     MONGODB_URI=

     ADMIN_EMAIL=
     ADMIN_PASSWORD=

     CLOUDINARY_CLOUD_NAME=
     CLOUDINARY_API_KEY=
     CLOUDINARY_API_SECRET=

     JWT_SECRET=
     JWT_EXPIRES_IN=

     RAZORPAY_KEY_ID=
     RAZORPAY_KEY_SECRET=
     
     The admin password must contain at least 12 characters.

     Add any additional variables required by the project, including payment gateway credentials

 ### 5. Start the Development Server

     npm run dev



## Database Setup

### 1. Connect MongoDB

     Create a MongoDB database and add the MongoDB connection string to the .env file.


### 2. Create Admin User

- Run the following command to create a new admin user:

     node scripts/createAdmin.js

 -   This script creates a new admin user in the MongoDB database.

 -   Make sure the required admin credentials are configured in the .env file.


## Project Structure
```text
homiva/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── scripts/
├── public/
│   ├── css/
│   └── js/
├── views/
├── .env
├── .gitignore
├── app.js
├── package.json
└── README.md
```

## Author

- Sruthi

Project: Homiva – Home Decor E-commerce Platform