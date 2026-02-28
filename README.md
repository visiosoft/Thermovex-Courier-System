# Thermovex Courier Management System

A comprehensive courier management system built with React and Node.js.

## Features

### Phase 1: User & Role Management ✅
- JWT-based authentication
- Role-based access control (RBAC)
- User management (CRUD operations)
- Role management with granular permissions
- Activity logging
- User blocking/unblocking
- Password reset functionality

### Phase 2: Shipper Management ✅
- Shipper profile management (company, contact, address)
- Payment type configuration (COD/Prepaid/Credit)
- Credit limit and balance tracking
- Shipper verification system
- Status management (Active/Inactive/Suspended/Blocked)
- Consignee management (linked to shippers)
- Default consignee support
- Cheque payment tracking (Pending/Cleared/Bounced)
- Support ticket system integration
- Business metrics (bookings, revenue, COD)
- Return address management

### Phase 3: Booking Management ✅
- Manual booking creation with comprehensive form
- Auto-generated AWB (Airway Bill) numbers
- Shipper and consignee selection
- Multiple service types (Express, Standard, Economy, Same Day, Overnight, International)
- Shipment types (Document, Parcel, Cargo)
- Weight and dimensional calculations
- Automatic pricing calculation (shipping, insurance, COD charges, fuel surcharge, GST)
- Payment mode selection (COD/Prepaid/Credit)
- Package tracking with status history timeline
- Bulk booking upload via Excel
- Excel template download
- Booking search and filtering
- Status management (Booked, Picked Up, In Transit, Out for Delivery, Delivered, Returned, Cancelled)
- Booking cancellation
- Label printing
- Reference number tracking
- Special instructions support
- Urgent/Fragile/Insurance flags
- Manifest management (create, dispatch, track)
- Dispatch management (outbound/inbound/transfer)
- Load sheet tracking

### Phase 4: Consignment Tracking System ✅
- **Public Tracking Page** (No Login Required)
  - Track shipments by AWB number
  - Beautiful gradient UI design
  - Real-time status updates
  - Status timeline visualization
  - ETA calculation based on service type
  - Delivery information display
  - Recipient signature/name viewing
- **Proof of Delivery (POD) Management**
  - Upload delivery proof (images/PDFs)
  - File size limit: 5MB
  - Supported formats: JPEG, PNG, PDF
  - Auto-save to booking on upload
  - Delivery remarks and recipient name
- **Exception Reporting System**
  - 11 exception types (Damaged, Missing Items, Wrong Address, Delivery Delay, Package Lost, etc.)
  - Public exception reporting from tracking page
  - Auto-generated exception numbers (EXC000001)
  - Priority assignment (Low/Medium/High/Urgent)
  - Status workflow (Open → In Progress → Resolved → Closed)
  - Internal notes and resolution tracking
  - Email notifications to reporters
- **Real-time Updates**
  - Status change notifications
  - Automatic ETA updates
  - Timeline with timestamps
  - Location tracking

### Phase 5: Invoicing Module ✅
- **Invoice Management**
  - Auto-generated invoice numbers (INV000001)
  - Create invoices from delivered bookings
  - Shipper-based invoicing
  - Billing period selection
  - Line item details (AWB, service, weight, amount)
  - Invoice status tracking (Draft, Sent, Viewed, Paid, Overdue, Cancelled)
- **Payment Management**
  - Payment status (Unpaid, Partially Paid, Paid, Overdue)
  - Multiple payment methods (Cash, Cheque, Bank Transfer, Online, Credit, UPI)
  - Payment history tracking
  - Balance calculation
  - Payment reference and remarks
- **Financial Calculations**
  - Automatic subtotal calculation
  - Discount support (amount or percentage)
  - GST/Tax calculation (18% configurable)
  - Total and balance computation
  - Professional invoice PDF export
  - Company header and branding
  - Detailed line items table
  - Payment terms and conditions
  - Custom notes support
  - Download and print functionality
- **Auto-Invoice Generation**
  - Bulk invoice creation for billing periods
  - Filter by shipper or all shippers
  - Auto-include delivered bookings without invoices
  - Batch processing
- **Invoice Analytics**
  - Total invoices count
  - Total revenue tracking
  - Outstanding amount calculation
  - Overdue invoices monitoring
  - Paid vs unpaid statistics

### Phase 6: Payment Gateway Integration ✅
- **PayPal Integration**
  - Secure PayPal checkout
  - Create payment orders via PayPal API
  - Automatic payment capture
  - Transaction tracking with PayPal IDs
  - Support for sandbox and live modes
  - OAuth 2.0 authentication
  - Automatic invoice update on payment
- **Skrill Integration**
  - Skrill wallet payments
  - Secure redirect-based checkout
  - Webhook for payment notifications
  - MD5 signature verification
  - Multiple currency support
  - Transaction tracking with Skrill IDs
- **Payment Management**
  - Comprehensive payment tracking
  - Auto-generated transaction IDs (TXN00000001)
  - Payment status workflow (Pending → Processing → Completed/Failed)
  - Gateway transaction reference storage
  - Customer information capture (email, name, phone)
- **Payment Processing**
  - Real-time payment capture
  - Webhook handling for async notifications
  - Error handling and retry logic
  - Payment verification and validation
  - Automatic invoice payment recording
- **Refund System**
  - Full and partial refund support
  - PayPal API refund processing
  - Refund tracking and history
  - Reason and notes for refunds
  - Audit trail for refunded payments
- **Payment Analytics**
  - Total payments and revenue tracking
  - Revenue breakdown by gateway
  - Success/failure rate monitoring
  - Payment method statistics
  - Transaction count per gateway
- **Security Features**
  - Secure API authentication
  - Webhook signature verification
  - IP address and user agent tracking
  - PCI-DSS compliant (no card storage)
  - Encrypted communication
- **User Experience**
  - One-click checkout from invoices
  - Payment method selection (PayPal/Skrill)
  - Secure redirect to payment gateways
  - Payment success/failure pages
  - Email notifications
  - Real-time payment status updates

### Phase 7: Dashboard Enhancement ✅
- **Real-time Analytics**
  - Overview statistics (bookings, revenue, shippers, pending deliveries)
  - Growth tracking (monthly comparison)
  - Performance metrics dashboard
  - Recent activity monitoring (24-hour stats)
- **Revenue Analytics**
  - Daily revenue trends with area charts
  - Revenue breakdown by service type (pie chart)
  - Revenue by payment gateway
  - Top revenue-generating shippers
  - Paid vs invoiced comparison
- **Booking Analytics**
  - Daily booking trends (line charts)
  - Booking distribution by service type
  - Status breakdown visualization
  - Delivery performance tracking (on-time vs delayed)
  - Average delivery time by service type
- **Performance Metrics**
  - Success rate (delivered vs total)
  - Collection rate (paid vs invoiced)
  - Customer satisfaction rate
  - Average response time (booking to pickup)
  - Active shippers count
- **Interactive Charts** (Recharts)
  - Area charts for revenue trends
  - Pie charts for service distribution
  - Line charts for booking trends
  - Bar charts for status breakdown
  - Real-time data refresh
- **Period Filtering**
  - Last 7 days view
  - Last 30 days view
  - Last 90 days view
  - Custom date range support
- **Activity Feed**
  - Recent bookings list
  - Recent payments tracking
  - Recent invoices
  - Alert notifications (overdue invoices, pending deliveries)
  - System notifications

### Phase 8: Reports & Analytics Module ✅
- **Revenue Reports**
  - Comprehensive revenue analytics
  - Revenue breakdown by period (day/week/month)
  - Revenue by service type with pie charts
  - Revenue by shipper (top performers)
  - Payment gateway revenue analysis
  - Summary statistics (total, paid, outstanding)
  - Custom date range filtering
- **Booking Reports**
  - Detailed booking analytics
  - Daily booking trends (line charts)
  - Status distribution (pie charts)
  - Service type breakdown (bar charts)
  - Top shippers by booking count
  - Booking details table (top 100)
  - Average booking value calculations
  - Total weight tracking
- **Performance Reports**
  - Delivery performance by service type
  - On-time vs delayed delivery analysis
  - Average delivery time tracking
  - Customer satisfaction rate
  - Exception analysis by type
  - Resolution rate and time tracking
  - Financial performance metrics
  - COD collection tracking
- **Export Capabilities**
  - Professional PDF export with charts
  - Comprehensive Excel export
  - Custom report branding
  - Download and print functionality
  - Multiple format support
- **Interactive Visualizations**
  - Line charts for trends
  - Pie charts for distributions
  - Bar charts for comparisons
  - Data tables with sorting
  - Real-time calculations
- **Filter Options**
  - Custom date ranges
  - Shipper-specific reports
  - Status filtering
  - Service type filtering
  - Grouping options (day/week/month)
- **Report Hub**
  - Centralized report access
  - Report descriptions
  - Quick navigation to report types
  - Export format information

### Phase 9: Custom API Development ✅
- **API Authentication System**
  - API key and secret-based authentication
  - Secure SHA-256 hashing for secrets
  - API key management (create, view, revoke, regenerate)
  - Credential generation with crypto module
  - Key/secret pair authentication
- **Security Features**
  - IP whitelisting support
  - Rate limiting per API key
  - Configurable requests per minute/day
  - Usage tracking and analytics
  - Automatic daily usage reset
  - Permission-based access control
  - Environment separation (sandbox/production)
- **Third-Party API Endpoints** (/api/v1)
  - `POST /api/v1/bookings` - Create new bookings
  - `GET /api/v1/bookings/:awb` - Fetch booking details
  - `GET /api/v1/tracking/:awb` - Track shipment status
  - `POST /api/v1/rates/calculate` - Calculate shipping rates
  - `GET /api/v1/invoices` - Retrieve invoices with filters
- **Rate Limiting**
  - Per-minute request limits
  - Per-day request limits
  - Customizable limits per API key
  - Rate limit headers in responses
  - 429 error for exceeded limits
- **API Key Management**
  - Create API keys for shippers
  - Set custom permissions (booking.create, booking.read, tracking.read, etc.)
  - Configure rate limits
  - Set expiration dates
  - Add IP whitelist restrictions
  - Webhook URL configuration
  - View usage statistics
  - Regenerate secrets securely
  - Revoke compromised keys
- **API Documentation** (Swagger/OpenAPI 3.0)
  - Interactive API documentation at /api-docs
  - Complete endpoint reference
  - Request/response schemas
  - Example requests and responses
  - Authentication guide
  - Try-it-out functionality
  - Error code reference
- **Usage Analytics**
  - Total requests tracking
  - Daily usage monitoring
  - Last used timestamp
  - Remaining quota display
  - Usage trends and reports
- **API Key Management UI**
  - List all API keys with statistics
  - Create new API keys with permissions
  - View detailed usage statistics
  - Regenerate secrets (invalidates old ones)
  - Revoke API keys
  - Copy credentials to clipboard
  - Filter by environment (sandbox/production)
  - Status monitoring (Active/Inactive/Revoked)
- **Developer Experience**
  - RESTful API design
  - JSON request/response format
  - XML support (optional)
  - Comprehensive error messages
  - Detailed API documentation
  - Sandbox environment for testing
  - Example code snippets
  - Webhook notifications

### Phase 10: WordPress & Shopify Plugins 🔄

## Tech Stack

**Frontend:**
- React 18
- Material-UI (MUI)
- React Router
- Axios
- Formik & Yup
- React Toastify
- Recharts (Data visualization)
- date-fns (Date formatting)
- XLSX (for Excel import/export)

**Backend:**
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs
- PDFKit (PDF generation)
- Multer (File uploads)
- Axios (HTTP client for payment gateways)
- PayPal REST API SDK
- Skrill Payment Gateway
- ExcelJS (Excel generation and export)
- express-rate-limit (API rate limiting)
- swagger-jsdoc (API documentation)
- swagger-ui-express (Interactive API docs)
- crypto (Secure API key generation)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
```bash
cd "G:\Thermovex Web App"
```

2. **Install root dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

5. **Configure environment variables**

Copy the backend/.env.example to backend/.env and update the values:
```bash
cd backend
copy .env.example .env
```

Update the following in `.env`:
- `PAYPAL_CLIENT_ID`: Your PayPal app client ID
- `PAYPAL_CLIENT_SECRET`: Your PayPal app secret
- `PAYPAL_MODE`: sandbox or live
- `SKRILL_MERCHANT_EMAIL`: Your Skrill merchant email
- `SKRILL_MERCHANT_ID`: Your Skrill merchant ID
- `SKRILL_SECRET_WORD`: Your Skrill secret word
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string
- `SMTP_*`: Email configuration (optional)

### Running the Application

**Option 1: Run everything together (from root)**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Initialize Default Roles

After starting the backend, you can initialize default system roles by:

1. Create a Super Admin user manually in MongoDB or via API
2. Login to the system
3. Go to Role Management
4. Click "Init Defaults" button

This will create 5 default roles:
- Super Admin (full access)
- Admin (operational access)
- Operations Manager (booking & tracking)
- Agent (limited booking access)
- Shipper (own data only)

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### User Endpoints
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/block` - Block/Unblock user
- `PUT /api/users/:id/reset-password` - Reset password
- `GET /api/users/:id/activity` - Get activity log

### Role Endpoints
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `GET /api/roles/:id` - Get role by ID
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:id/duplicate` - Duplicate role
- `POST /api/roles/init-defaults` - Initialize default roles

### Shipper Endpoints
- `GET /api/shippers` - Get all shippers
- `POST /api/shippers` - Create shipper
- `GET /api/shippers/:id` - Get shipper details
- `PUT /api/shippers/:id` - Update shipper
- `DELETE /api/shippers/:id` - Delete shipper
- `PUT /api/shippers/:id/status` - Update status
- `PUT /api/shippers/:id/verify` - Toggle verification
- `GET /api/shippers/:id/stats` - Get shipper statistics

### Consignee Endpoints
- `GET /api/consignees` - Get all consignees
- `GET /api/consignees/shipper/:shipperId` - Get by shipper
- `POST /api/consignees` - Create consignee
- `GET /api/consignees/:id` - Get consignee
- `PUT /api/consignees/:id` - Update consignee
- `DELETE /api/consignees/:id` - Delete consignee

### Cheque Endpoints
- `GET /api/cheques` - Get all cheques
- `GET /api/cheques/shipper/:shipperId` - Get by shipper
- `POST /api/cheques` - Record cheque
- `PUT /api/cheques/:id/status` - Update status
- `DELETE /api/cheques/:id` - Delete cheque

### Support Ticket Endpoints
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/shipper/:shipperId` - Get by shipper
- `POST /api/tickets` - Create ticket
- `POST /api/tickets/:id/response` - Add response
- `PUT /api/tickets/:id/assign` - Assign ticket
- `PUT /api/tickets/:id/escalate` - Escalate ticket
- `PUT /api/tickets/:id/resolve` - Resolve ti

### Booking Endpoints
- `GET /api/bookings` - Get all bookings (with filters)
- `GET /api/bookings/awb/:awbNumber` - Track by AWB (public)
- `POST /api/bookings` - Create booking
- `POST /api/bookings/bulk` - Bulk create bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `PUT /api/bookings/:id/status` - Update status
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/pod` - Upload proof of delivery
- `GET /api/bookings/stats/summary` - Get statistics

### Exception Endpoints
- `POST /api/exceptions/report` - Report exception (public)
- `GET /api/exceptions` - Get all exceptions
- `GET /api/exceptions/:id` - Get exception details
- `PUT /api/exceptions/:id` - Update exception
- `DELETE /api/exceptions/:id` - Delete exception
- `PUT /api/exceptions/:id/assign` - Assign to user
- `PUT /api/exceptions/:id/resolve` - Resolve exception
- `PInvoice Endpoints
- `GET /api/invoices` - Get all invoices (with filters)
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/auto-generate` - Auto-generate invoices
- `GPayment Endpoints
- `GET /api/payments` - Get all payments (with filters)
- `GET /api/payments/stats/summary` - Get payment statistics
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments/paypal/create` - Create PayPal payment order
- `POST /api/payments/paypal/capture/:orderId` - Capture PayPal payment
- `POST /api/payments/skrill/create` - Create Skrill payment
- `POST /api/payments/skrill/webhook` - Skrill webhook handler (public)
- `POST /api/payments/:id/refund` - Refund payment

### Manifest Endpoints
- `GET /api/manifests` - Get all manifests
- `POST /api/manifests` - Create manifest
- `GET /api/manifests/:id` - Get manifest details
- `PUT /api/manifests/:id` - Update manifest
- `DELETE /api/manifests/:id` - Delete manifest
- `PUT /api/manifests/:id/dispatch` - Dispatch manifest

### Dispatch Endpoints
- `GET /api/dispatches` - Get all dispatches
- `POST /api/dispatches` - Create dispatch
- `GET /api/dispatches/:id` - Get dispatch details
- `PUT /api/dispatches/:id` - Update dispatch
- `DELETE /api/dispatches/:id` - Delete dispatch
- `PUT /api/dispatches/:id/dispatch` - Mark as dispatched
- `PUT /api/dispatches/:id/receive` - Mark as received

### Dashboard Endpoints
- `GET /api/dashboard/overview` - Get overview statistics
- `GET /api/dashboard/revenue?period=30` - Get revenue analytics
- `GET /api/dashboard/bookings?period=30` - Get booking analytics
- `GET /api/dashboard/performance` - Get performance metrics
- `GET /api/dashboard/activities?limit=20` - Get recent activities

### Report Endpoints
- `POST /api/reports/revenue` - Generate revenue report
- `POST /api/reports/bookings` - Generate booking report
- `POST /api/reports/performance` - Generate performance report
- `POST /api/reports/export/pdf` - Export report to PDF
- `POST /api/reports/export/excel` - Export report to Excel

### API Management Endpoints
- `GET /api/api-keys` - Get all API keys
- `POST /api/api-keys` - Create new API key
- `GET /api/api-keys/:id` - Get API key details
- `PUT /api/api-keys/:id` - Update API key
- `DELETE /api/api-keys/:id` - Revoke API key
- `GET /api/api-keys/:id/stats` - Get API key usage statistics
- `POST /api/api-keys/:id/regenerate` - Regenerate API secret

### Third-Party API Endpoints (v1)
**Authentication:** Requires X-API-Key and X-API-Secret headers

- `POST /api/v1/bookings` - Create new booking
  - Permission: `booking.create`
  - Rate limited per API key
- `GET /api/v1/bookings/:awb` - Get booking by AWB
  - Permission: `booking.read`
  - Rate limited per API key
- `GET /api/v1/tracking/:awb` - Track shipment
  - Permission: `tracking.read`
  - Rate limited per API key
- `POST /api/v1/rates/calculate` - Calculate shipping rate
  - Permission: `rate.calculate`
  - Rate limited per API key
- `GET /api/v1/invoices` - Get invoices with pagination
  - Permission: `invoice.read`
  - Rate limited per API key
  - Query params: page, limit, status, startDate, endDate

### API Documentation
- `GET /api-docs` - Interactive Swagger/OpenAPI documentation

## Project Roadmap
1. ✅ User & Role Management (COMPLETED)
2. ✅ Shipper Management (COMPLETED)
3. ✅ Booking Management (COMPLETED)
4. ✅ Consignment Tracking System (COMPLETED)
5. ✅ Invoicing Module (COMPLETED)
6. ✅ Payment Gateway Integration (COMPLETED)
7. ✅ Dashboard Enhancement (COMPLETED - real-time charts, analytics)
8. ✅ Reports & Analytics Module (COMPLETED - custom reports, PDF/Excel export)
9. ✅ Custom API Development (COMPLETED - RESTful API, authentication, rate limiting, Swagger docs)

## Directory Structure
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json         # Root package.json
```

## Default Login Credentials

After initializing default roles, create a user with Super Admin role to access the system.

## Next Modules (Planned)

3. ✅ Shipper Management (COMPLETED)
4. Booking Management Module
5. Consignment Tracking System
6. Invoicing Module
7. Payment Gateway Integration
8. Dashboard Enhancement (real-time data)
9. Reports & Analytics Module
10. Custom API Development (XML/JSON)
11. WordPress & Shopify Plugins

## License

Proprietary - All rights reserved
