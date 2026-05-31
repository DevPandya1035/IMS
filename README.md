# IMS — Enterprise Inventory Management & AI Forecasting System

IMS is a state-of-the-art, modern Software-as-a-Service (SaaS) inventory management system. It provides real-time multi-warehouse tracking, granular role-based access control (RBAC), and automated auditing. It features a client-side mathematical engine that simulates demand predictions using the **Holt-Winters (triple exponential smoothing)** model, ABC/XYZ Pareto inventory classification, and an interactive Economic Order Quantity (EOQ) calculator.

---

## 🚀 Key Modules & Core Features

### 1. Core Inventory Management
*   **Asset Catalogs**: Manage products, automated SKUs, barcode mappings, and categorization.
*   **Warehouse Logistics**: Multi-warehouse storage allocation and stock movement tracking.
*   **Order Workflow**: Purchase Orders (PO) and Sales Orders (SO) tracking with dynamic status transitions.
*   **Invoicing & Auditing**: Instant tax invoices, supplier bills, payment tracking, and automated, granular system-wide audit logs.

### 2. Interactive Inventory Analytics (`/analytics`)
*   **Demand & Seasonality Charts**: Historical actual vs. predicted demand graphs, seasonality indexing, and transactional frequency histograms.
*   **ABC / XYZ Multi-Criteria Matrix**: Lorenz Pareto curves segmenting inventory into strategic A, B, C value tiers and X, Y, Z demand predictability buckets.
*   **Real-Time Cost Slider (EOQ)**: Real-time sliders adjusting annual demand, setup fees, and holding costs to immediately compute optimal order volume and render dynamic total-cost curves.

### 3. AI Forecasting Engine (`/forecasting`)
*   **Holt-Winters Simulator**: Client-side mathematical implementation of Holt-Winters triple exponential smoothing. Fine-tune level ($\alpha$), trend ($\beta$), and seasonality ($\gamma$) values with confidence bands.
*   **Anomaly & Outlier Detector**: Interactive standard-deviation threshold slider highlighting demand spikes/drops and outputting them in outlier logs.
*   **Safety Stock & Reorder Points**: Automated Reorder Point (ROP), safety stock limits, and stock urgency rankings based on lead-time variances.
*   **Pipeline Auditing**: Visual maps explaining the model fitting, cache invalidation cycles, and automated cron pipelines.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Redux Toolkit, Tailwind CSS v4, Framer Motion, Chart.js, Recharts.
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, tsx.
*   **Storage & Caching**: PostgreSQL (relational storage), Redis (session/data cache).
*   **Environment**: Docker, Docker Compose.

---

## ⚡ Quick Start (Docker Development)

The easiest way to spin up the entire database, cache, backend API, and frontend server is using Docker Compose:

1.  **Clone and Enter Repository**:
    ```bash
    git clone https://github.com/DevPandya1035/IMS.git
    cd IMS
    ```

2.  **Launch Docker Containers**:
    ```bash
    docker-compose up --build
    ```
    This launches:
    *   **Frontend**: `http://localhost:3000`
    *   **Backend API**: `http://localhost:4000`
    *   **Database**: PostgreSQL on `localhost:5432`
    *   **Cache**: Redis on `localhost:6379`

---

## 💡 Manual Setup (Local Development)

### Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Copy `.env.example` to `.env` and fill in your details (e.g. `DATABASE_URL` for PostgreSQL).
4. Run migrations and seed the database:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
5. Start backend development server:
   ```bash
   npm run dev
   ```

### Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard at `http://localhost:3000`.

---

## 🔑 Demo Access Credentials

The database comes pre-seeded with rich enterprise fixtures representing **Enthrall Foods Private Limited** ( Ahmedabad, Gujarat). You can log in using any of the following accounts:

| Role | Username | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@ims.com` | `Admin@123` |
| **Owner / CEO** | `sdave@enthrallfoods.com` | `Admin@1234` |
| **Operations Manager** | `ravi.mehta@enthrallfoods.com` | `Manager@1234` |
| **Warehouse Staff** | `priya.shah@enthrallfoods.com` | `Staff@1234` |
| **Finance Auditor** | `ankit.joshi@enthrallfoods.com` | `Auditor@1234` |

---

## 🔒 Security & Authorization

The system utilizes custom JWT tokens for authentication, stored securely on the client. Authorization is validated on both API gateways and Next.js page guards via a dynamic **Role-Permission Matrix**:
*   `VIEW_PRODUCT`, `CREATE_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`
*   `MANAGE_CATEGORIES`, `MANAGE_WAREHOUSES`
*   `CREATE_PO`, `CREATE_SO`
*   `VIEW_INVOICE`, `VIEW_REPORTS`, `VIEW_FORECAST`, `VIEW_AUDIT_LOGS`
