# IMS (Inventory Management System) — Comprehensive Project Specification

IMS is an enterprise-grade, high-performance Software-as-a-Service (SaaS) inventory management ecosystem. It provides multi-entity logistics tracking, granular role-based authorization (RBAC), structured transaction logging, and real-time predictive demand forecasting. 

The system leverages a decoupled layered monolithic design to deliver fast response times, high availability, and absolute transaction consistency.

---

## 📖 Table of Contents
1. [Core Features & Modules](#-core-features--modules)
2. [Technical Stack](#-technical-stack)
3. [Architecture & Folder Structure](#-architecture--folder-structure)
4. [Database Design & Schema](#-database-design--schema)
5. [AI Forecasting & Math Models](#-ai-forecasting--math-models)
6. [API Specification](#-api-specification)
7. [Auth & Permission System](#-auth--permission-system)
8. [Setup & Deployment Guide](#-setup--deployment-guide)
9. [Pre-Seeded Accounts](#-pre-seeded-accounts)
10. [Audit & Logging Policies](#-audit--logging-policies)

---

## 🚀 Core Features & Modules

### 📦 Catalog & Product Management
*   **Unique SKUs & Barcodes**: Automates generation of unique Stock Keeping Units and manages barcode assignments.
*   **Category Controls**: Hierarchical grouping of products with count-based metrics.
*   **Near-Expiry Alerting**: Auto-flags items approaching expiration thresholds (e.g. 90 days) for inventory de-risking.

### 🏢 Logistics & Multi-Warehouse Control
*   **Warehouse Isolation**: Isolates inventory partitions with bin locations (`Zone / Aisle / Rack / Bin`).
*   **Atomic Stock Movements**: Restricts warehouse transactions to double-entry accounting models (`TRANSFER_OUT` → `TRANSFER_IN`).
*   **Negative Stock Protection**: Guarantees transaction rollbacks when sales drafts attempt to deduct more than the physical layout contains.

### 💼 Purchase & Sales Order Lifecycles
*   **Purchase Orders (PO)**: Automated states (`PENDING` → `APPROVED` → `RECEIVED`). Approvals above ₹50,000 trigger authorization alerts.
*   **Sales Orders (SO)**: Automatic inventory deduction upon confirmation (`PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`).
*   **Compliance Invoicing**: Tax invoice engines automatically calculate pre-discount configurations and apply local GST (18% split as 9% CGST + 9% SGST).

### 📊 Advanced Analytics & Anomaly Detection (`/analytics`)
*   **ABC/XYZ Pareto Segments**: Ranks product catalogs into ABC margins (value) and XYZ volatility coefficients (predictability).
*   **EOQ Cost Simulator**: Real-time sliders adjusting annual demand, ordering costs, and holding values to plot total cost curves and pinpoint Economic Order Quantity.
*   **Hour × Day Transaction Matrix**: Renders heatmaps highlighting peak transaction times.

### 🔮 Holt-Winters Triple Smoothing Engine (`/forecasting`)
*   **Predictive Demand Engine**: Client-side Holt-Winters algorithm with interactive sliders adjusting alpha ($\alpha$ level), beta ($\beta$ trend), and gamma ($\gamma$ seasonality) parameters.
*   **Confidence Bands**: Plots margin boundaries to absorb lead-time fluctuations.
*   **Statistical Metrics**: Live calculation of forecast error ranges including Mean Absolute Percentage Error (MAPE) and Root Mean Squared Error (RMSE).

---

## 🛠️ Technical Stack

### Frontend Application
*   **Framework**: Next.js 16 (React 19, Client Component Hydration Guards).
*   **State Management**: Redux Toolkit (auth, ui, and alert queues).
*   **Styling**: Tailwind CSS v4, custom glassmorphism overrides, Inter & Outfit font layers.
*   **Charts & Diagrams**: Chart.js & Recharts.

### Backend Services
*   **Runtime**: Node.js & TypeScript wrapper (`tsx` executor).
*   **Framework**: Express.js with custom route handlers and middlewares.
*   **Database Client**: Prisma ORM client with strict pool settings.
*   **Security Library**: Argon2id password encryption.

### Infra & Caching
*   **Primary DB**: PostgreSQL (relational structure, transaction safety).
*   **In-Memory Caching**: Redis (for analytical caches and rate limiting).
*   **Containerization**: Docker & Docker Compose.

---

## 🏗️ Architecture & Folder Structure

The code is organized into a modular design dividing client logic from persistent server micro-layers:

```
IMS/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma relation schema
│   │   └── seed.ts            # Enterprise seed data script
│   ├── src/
│   │   ├── controllers/       # HTTP Request Handlers
│   │   ├── middlewares/       # JWT Auth, Audit Logs, RBAC checks
│   │   ├── routes/            # Route endpoints grouping
│   │   ├── services/          # Pure Business logic
│   │   └── server.ts          # Express App start
│   └── tsconfig.json
│
├── frontend/
│   ├── public/                # Static vector assets
│   ├── src/
│   │   ├── app/               # Next.js App Router folders
│   │   │   ├── (auth)/        # Unprotected route group (Login)
│   │   │   └── (dashboard)/   # Protected layout & views
│   │   ├── components/
│   │   │   ├── auth/          # Permission wrappers
│   │   │   ├── charts/        # Recharts & ChartJS items
│   │   │   └── ui/            # Layout (Sidebar, TopBar, Table, Toast)
│   │   ├── store/             # Redux configuration
│   │   └── lib/               # Axios API client wrapper
│   └── package.json
│
└── docker-compose.yml         # Container configuration
```

---

## 🗄️ Database Design & Schema

Strict database relations are managed by PostgreSQL. Here are the core table specifications:

### User Management Entity
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,           -- Argon2id encrypted
  role_id       UUID NOT NULL REFERENCES roles(id),
  is_active     BOOLEAN DEFAULT TRUE,
  failed_attempts SMALLINT DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Products Catalog Entity
```sql
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  sku           TEXT UNIQUE NOT NULL,
  barcode       TEXT UNIQUE,
  price         DECIMAL(12,2) NOT NULL,
  cost_price    DECIMAL(12,2),
  quantity      INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  category_id   UUID REFERENCES categories(id),
  supplier_id   UUID REFERENCES suppliers(id),
  expiry_date   TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE
);
```

### Double-Entry Movements Log
```sql
CREATE TABLE inventory_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id),
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  quantity        INTEGER NOT NULL,       -- Negative for deductions
  movement_type   TEXT NOT NULL,          -- 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER'
  reference_id    TEXT,                   -- Link to SO, PO or Adjustment ID
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔮 AI Forecasting & Math Models

### Holt-Winters Algorithm (Additive Model)
The system calculates future demand forecasting using Triple Exponential Smoothing. This model updates three components (Level, Trend, and Seasonality) dynamically:

1.  **Level Update ($L_t$)**:
    $$L_t = \alpha(Y_t - S_{t-m}) + (1-\alpha)(L_{t-1} + T_{t-1})$$
2.  **Trend Update ($T_t$)**:
    $$T_t = \beta(L_t - L_{t-1}) + (1-\beta)T_{t-1}$$
3.  **Seasonal Update ($S_t$)**:
    $$S_t = \gamma(Y_t - L_{t-1} - T_{t-1}) + (1-\gamma)S_{t-m}$$

Where:
*   $\alpha$, $\beta$, $\gamma$ represent the smoothing coefficients (Level, Trend, and Seasonality).
*   $Y_t$ is the actual observed transactional quantity at timeline $t$.
*   $m$ is the period length of seasonality (e.g. $m=12$ for monthly indexing).

### Economic Order Quantity (EOQ)
Calculates optimal purchase replenishment intervals to minimize cumulative holding and administrative ordering costs:
$$EOQ = \sqrt{\frac{2 \cdot D \cdot S}{H}}$$
*   $D$ = Annual demand quantity (units).
*   $S$ = Setup administrative ordering cost (fixed per order).
*   $H$ = Holding/carrying cost (annual cost of storage per unit).

---

## 🔌 API Specification

All backend endpoints are prefixed with `/api` and expect JSON payloads:

### Authentication
*   `POST /api/auth/login` - Authenticates user credentials. Returns a JWT cookie.
*   `POST /api/auth/logout` - Revokes session token and clears the cookie.
*   `GET /api/auth/me` - Resolves active session data and role mappings.

### Products & Inventory
*   `GET /api/products` - Returns paginated list of catalog items with active search filters.
*   `POST /api/products` - Registers a new product (`CREATE_PRODUCT` permission required).
*   `DELETE /api/products/:id` - Deactivates the product record.
*   `POST /api/inventory/adjust` - Records an inventory adjustment log.

### Orders & Bills
*   `GET /api/purchase-orders` - Lists active procurement flows.
*   `POST /api/purchase-orders` - Registers new purchase draft (`CREATE_PO` required).
*   `POST /api/purchase-orders/:id/approve` - Authorizes the PO transaction.
*   `GET /api/invoices/:id` - Returns invoice items with GST breakdowns.

---

## 🔒 Auth & Permission System

The system applies a matrix role permission configuration to restrict menu visibility and API mutation executions:

| Permission Name | System Admin | Operations Manager | Warehouse Staff | Finance Auditor |
| :--- | :---: | :---: | :---: | :---: |
| `VIEW_PRODUCT` | ✔ | ✔ | ✔ | ✔ |
| `CREATE_PRODUCT` | ✔ | ✔ | ❌ | ❌ |
| `DELETE_PRODUCT` | ✔ | ✔ | ❌ | ❌ |
| `CREATE_PO` | ✔ | ✔ | ❌ | ❌ |
| `APPROVE_PO` | ✔ | ✔ | ❌ | ❌ |
| `CREATE_SO` | ✔ | ✔ | ❌ | ❌ |
| `VIEW_INVOICE` | ✔ | ✔ | ❌ | ✔ |
| `VIEW_AUDIT_LOGS` | ✔ | ❌ | ❌ | ✔ |

---

## ⚡ Setup & Deployment Guide

### Requirements
*   Docker & Docker Compose installed.
*   Node.js v20+ (for local manual builds).

### Running via Docker Compose (Recommended)
1.  Initialize containers:
    ```bash
    docker-compose up --build
    ```
2.  The application will automatically run the migrations and seeds:
    *   **Frontend Client**: `http://localhost:3000`
    *   **Backend Server**: `http://localhost:4000`
    *   **Postgres Interface**: `localhost:5432`

---

## 🔑 Pre-Seeded Accounts

Log in to the system (`http://localhost:3000/login`) using the following demo credentials:

```
System Admin:   admin@ims.com / Admin@123
Owner/CEO:      sdave@enthrallfoods.com / Admin@1234
Manager:        ravi.mehta@enthrallfoods.com / Manager@1234
Warehouse:      priya.shah@enthrallfoods.com / Staff@1234
Auditor:        ankit.joshi@enthrallfoods.com / Auditor@1234
```

---

## 📜 Audit & Logging Policies

Every data-mutating transaction (INSERT, UPDATE, DELETE) is captured by the `auditLog` middleware:
*   **Immutable Entries**: Log rows are database write-only.
*   **Captured Data**: Captures the target table, database operation type, performing user ID, request IP address, and JSON metadata changes.
*   **Audit Access**: Log records are restricted to the **System Admin** and **Finance Auditor** roles.
