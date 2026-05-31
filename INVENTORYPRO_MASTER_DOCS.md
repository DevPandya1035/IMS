# InventoryPro — Complete Project Documentation
> **Enterprise Inventory Management System with AI Forecasting**  
> Version: 2.0.0 | Status: Production-Ready | Last Updated: May 2026

---

## Table of Contents

1. [Product Vision & Strategy](#1-product-vision--strategy)
2. [Product Requirements Document (PRD)](#2-product-requirements-document-prd)
3. [Software Requirements Specification (SRS)](#3-software-requirements-specification-srs)
4. [Business Rules & Logic](#4-business-rules--logic)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Folder Structure](#7-folder-structure)
8. [Database Design](#8-database-design)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [API Specification](#10-api-specification)
11. [AI & Forecasting Architecture](#11-ai--forecasting-architecture)
12. [UI/UX Design System](#12-uiux-design-system)
13. [Invoice & Billing Design](#13-invoice--billing-design)
14. [User Flows & Workflows](#14-user-flows--workflows)
15. [Security Requirements](#15-security-requirements)
16. [Performance Optimization](#16-performance-optimization)
17. [Logging & Auditing Strategy](#17-logging--auditing-strategy)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)
19. [Coding Guidelines](#19-coding-guidelines)
20. [Error Codes & Troubleshooting](#20-error-codes--troubleshooting)

---

# 1. Product Vision & Strategy

## 1.1 Executive Summary

**InventoryPro** is an enterprise-grade, modern Software-as-a-Service (SaaS) inventory management ecosystem designed to bring clarity, efficiency, and intelligence to warehouse operations, retail chains, and supply networks. In a world where stock discrepancies, delayed procurement, and inefficient distribution lead to significant revenue leakage, InventoryPro acts as the **single source of truth** for all physical inventory assets.

The system eliminates stockouts through AI-driven demand forecasting (Holt-Winters Triple Exponential Smoothing), automates reorder workflows, and provides real-time visibility across all warehouse locations — all within a premium, Linear-inspired SaaS interface.

## 1.2 Competitive Benchmarking

| Platform | What We Borrow |
|----------|---------------|
| **SAP ERP / Oracle NetSuite** | Robust multi-entity, multi-warehouse supply chain tracking; deep compliance and transaction safety |
| **Zoho Inventory** | Modern workflows for item variant configurations, packaging, and shipping dispatches |
| **Shopify Admin** | Clean product lists, catalog categorization, and supplier record management |
| **Stripe Dashboard** | Financial/invoicing modules with grid-based tax reporting (GST), invoice printing, and refund ledgers |
| **Linear** | Ultra-high performance UI, dark mode defaults, keyboard navigation, crisp Inter typography, glassmorphic animations |
| **Odoo** | Modular feature completeness across procurement, sales, and inventory |

**Design Benchmark:** As feature-rich as Odoo, as fast and clean as Linear.

## 1.3 Strategic Objectives

| Objective | Metric Target |
|-----------|--------------|
| **Zero-Discrepancy Accuracy** | 100% alignment between physical and digital stock via atomic DB transactions |
| **Operational Automation** | ≥70% of reorder suggestions auto-converted to PO drafts |
| **AI Demand Accuracy** | Holt-Winters MAPE ≤ 15% on 30-day horizon |
| **Response Performance** | 95% of read queries return in <200ms using Redis caching |
| **Compliance & Audit** | 100% of mutations captured in immutable audit_logs |
| **Availability** | 99.9% uptime SLA |

## 1.4 Target Market

InventoryPro is optimized for businesses with high physical inventory turnover:
- E-commerce fulfillment centers
- Regional distributors and wholesalers
- Boutique manufacturing plants
- Retail chains with multi-location warehousing
- Pharmaceutical and FMCG companies with expiry tracking

---

# 2. Product Requirements Document (PRD)

## 2.1 User Personas & Access Boundaries

| Persona | Primary Goal | Access Scope | Key Pain Points |
|---------|-------------|-------------|----------------|
| **Admin** | Manage enterprise setup & user access | Full system control, RBAC definitions, raw audit logs | User lifecycle management, session tracking |
| **Manager** | Optimize procurement, sales & reports | All modules except global system settings | Delayed approvals, stockouts, inaccurate margins |
| **Staff** | Execute stock and shipping actions | Warehouse inventory, product views, stock-in/out, transfers | Complex forms, search friction, barcode errors |
| **Auditor** | Validate compliance & COGS | Read-only: inventory, reports, invoices, audit logs | Unexplained discrepancies, missing audit trails |

## 2.2 User Stories

### Authentication & Authorization
- *As an Admin*, I want to create user profiles with specific database-backed roles and permissions so I can limit data access on a need-to-know basis.
- *As a User*, I want my session to authenticate silently via JWT rotation so my work is never interrupted by random login prompts.
- *As an Admin*, I want account lockout after 5 failed attempts so the system is protected from brute-force attacks.

### Product & Warehouse Inventory
- *As a Staff Member*, I want to register a product with a unique SKU, barcode, and description so it can be identified across the logistics chain.
- *As a Staff Member*, I want to register bin locations (Zone/Aisle/Rack/Bin) within specific warehouses so pickers can locate items instantly.
- *As a Staff/Manager*, I want to transfer stock between warehouses with dual atomic movement entries (TRANSFER_OUT / TRANSFER_IN) so inventory levels remain synchronized.
- *As a Manager*, I want the system to flag items expiring within 90 days so we can run promotions to clear near-expiry stock.

### Procurement & Purchase Orders
- *As a Manager*, I want purchase orders above ₹50,000 to require explicit manager approval so the organization controls budget spend.
- *As a Staff Member*, I want to receive goods against an approved PO so the system automatically increments warehouse stock levels.
- *As a Procurement Officer*, I want to view AI-generated reorder suggestions with urgency scores so I can prioritize which items to restock first.

### Sales & Fulfillment
- *As a Sales Agent*, I want to create Sales Orders linked to registered customers so inventory deductions occur automatically upon confirmation.
- *As a Warehouse Staff*, I want negative stock to be blocked so I can never ship more than is physically available.
- *As a Manager*, I want cancelled confirmed orders to automatically restore stock so warehouse counts stay accurate.

### Invoicing & Billing
- *As a Finance Manager*, I want invoices to calculate 18% GST (9% CGST + 9% SGST) with discounts applied before tax so customer invoicing is tax-compliant.
- *As a Finance Manager*, I want to email PDF invoices directly to customers from the system so we shorten payment collection cycles.
- *As a Finance Manager*, I want to issue Credit Notes for returns and Debit Notes for supplier disputes so billing adjustments are traceable.

### Analytics & Forecasting
- *As a Manager*, I want a 30-day AI-powered demand projection with safety stock suggestions so I can make proactive restocking decisions.
- *As an Auditor*, I want read-only access to inventory valuations, COGS reports, and audit trails so I can validate financial compliance.

## 2.3 Feature Scope — Phase 1 (Current Implementation)

| Module | Features |
|--------|---------|
| **Core Auth** | JWT + HttpOnly cookie management, Argon2 password hashing, database RBAC, MFA-ready |
| **Product Catalog** | Category CRUD, product CRUD with images, SKU generation, barcode support, expiry tracking |
| **Multi-Warehouse Stock** | Warehouse management, stock-in/out/transfer, bin locations, negative stock prevention |
| **Purchase Orders** | PO lifecycle (PENDING → APPROVED → RECEIVED), ₹50K approval threshold, GRN receipt |
| **Sales Orders** | SO lifecycle (PENDING → CONFIRMED → SHIPPED → DELIVERED), auto stock deduction |
| **Invoicing** | GST invoice generation, PDF export, email dispatch, Credit/Debit notes |
| **AI Forecasting** | Holt-Winters demand model, smart reorder calculator, urgency classification |
| **Analytics** | KPI dashboard, sales trends, inventory valuation, supplier performance |
| **Cache Layer** | Redis integration for dashboard KPIs and forecast results |
| **Audit Logging** | Immutable audit trail for all mutations |

## 2.4 Out of Scope (Phase 1)

- Manufacturing / Work-in-Progress (WIP) tracking
- Point-of-Sale (POS) module
- IoT/RFID hardware integration
- Customer-facing order tracking portal
- Freight forwarding and customs management
- Advanced route optimization for last-mile delivery

---

# 3. Software Requirements Specification (SRS)

## 3.1 Performance Targets

### Latency Targets

| Operation Type | Target | Method |
|---------------|--------|--------|
| Read (Dashboard, Product lists) | < 200ms (p95) | Redis caching |
| Write (Stock transfers, Order creation) | < 500ms (p95) | Indexed DB writes |
| Report generation (margins, valuations) | < 2,000ms | Optimized aggregation queries |
| AI Forecasting Engine (12-month history) | < 1,500ms | In-memory math, Redis cache |
| Bulk CSV import (1,000 products) | < 30 seconds | Batched Prisma upserts |

### Throughput & Concurrency

| Metric | Target |
|--------|--------|
| API throughput | 100 RPS per container instance |
| Concurrent DB write connections | 50 without lock degradation |
| Rate limit (standard API) | 100 requests / 15 minutes per IP |
| Rate limit (auth endpoints) | 10 requests / 15 minutes per IP |
| Concurrent active users | 200 per instance |

## 3.2 Availability & Reliability

- **Uptime SLA**: 99.9% (≤ 8.7 hours downtime/year)
- **Data Durability**: Zero transactional data loss; all mutations use ACID-compliant transactions
- **Graceful Degradation**: If Redis is offline → fall back to in-memory cache → fall back to direct DB queries
- **RTO (Recovery Time Objective)**: ≤ 5 minutes for container restarts
- **RPO (Recovery Point Objective)**: ≤ 1 hour via automated RDS daily backups

## 3.3 Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Security** | Argon2id password hashing, JWT RS256 tokens, Helmet.js headers, CSRF protection, input sanitization |
| **Compliance** | GST India tax compliance (18% flat: 9% CGST + 9% SGST), GDPR-aware data handling |
| **Accessibility** | WCAG 2.1 AA — keyboard navigation, ARIA labels, 4.5:1 contrast ratio |
| **Responsiveness** | Mobile-first; tested on 320px–2560px viewports |
| **Internationalization** | Date/time in IST by default; currency in INR; i18n-ready structure |
| **Browser Support** | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ |
| **Mobile OS** | iOS 15+, Android 10+ (Progressive Web App capable) |

## 3.4 Software Interface Requirements

| Component | Specification |
|-----------|-------------|
| Backend Runtime | Node.js v20.x LTS (ESM format) |
| Database | PostgreSQL 16.x |
| Cache | Redis 7.x |
| Frontend | Next.js 15 / React 19 |
| ORM | Prisma 5.x |
| OS (containers) | Linux Alpine |

## 3.5 Hardware Sizing (Production Baseline)

| Service | vCPU | RAM | Storage |
|---------|------|-----|---------|
| API Server (Docker) | 1 vCPU | 2 GB | 20 GB SSD |
| PostgreSQL (RDS) | 2 vCPU | 4 GB | SSD auto-grow |
| Redis (ElastiCache) | 1 vCPU | 1 GB | — |
| Frontend (Docker) | 1 vCPU | 1 GB | — |

---

# 4. Business Rules & Logic

## 4.1 Procurement Rules

### PO Approval Threshold
Any Purchase Order with a **total amount > ₹50,000** must be explicitly approved by a user with the `Admin` or `Manager` role before stock can be received.

```
PO Total ≤ ₹50,000  → Auto-approved (or single-step Staff approval)
PO Total > ₹50,000  → Requires Admin/Manager explicit approval
```

### PO Status Lifecycle
```
PENDING ──► APPROVED ──► RECEIVED
PENDING ──► CANCELLED
APPROVED ──► CANCELLED
(RECEIVED is terminal — cannot be cancelled)
```

### Stock Lock Rule
Items in a PO are **not added to inventory** until the PO status transitions to `RECEIVED`. Approving a PO does not increment stock.

## 4.2 Sales & Inventory Rules

### Inventory Reservation
When a Sales Order is `CONFIRMED`:
1. System checks `available_qty = on_hand - reserved` at the specific warehouse.
2. If sufficient: stock is **reserved** (deducted from available), SO moves to CONFIRMED, and an Invoice is auto-generated.
3. If insufficient: operation is blocked with error `INSUFFICIENT_STOCK`.

### Negative Stock Prevention
Stock-out operations are **hard-blocked** if `requested_qty > current_qty` at the source warehouse. This applies to stock-out, sales order confirmation, and transfers.

### Sales Order Lifecycle
```
PENDING ──► CONFIRMED ──► SHIPPED ──► DELIVERED
   │              │
   └──────────────┴──► CANCELLED
   (If cancelled after CONFIRMED → stock is restored to warehouse)
   (Cannot cancel after SHIPPED)
```

### Cancellation Stock Restore
When a CONFIRMED order is cancelled, the system automatically creates a `STOCK_IN` movement of type `RETURN` to restore reserved quantities.

## 4.3 Financial & Tax Rules

### GST Tax Model (India — Flat 18%)

| Component | Rate | Formula |
|-----------|------|---------|
| CGST | 9% | `Taxable Value × 0.09` |
| SGST | 9% | `Taxable Value × 0.09` |
| Total GST | 18% | `Taxable Value × 0.18` |

**Calculation Order (discounts applied before tax):**
```
Net Value(i)      = Quantity(i) × Unit Price(i)
Taxable Value(i)  = Net Value(i) − Discount(i)
CGST(i)           = Taxable Value(i) × 0.09
SGST(i)           = Taxable Value(i) × 0.09
Line Total(i)     = Taxable Value(i) + CGST(i) + SGST(i)
Grand Total       = Σ Line Total(i)
```

## 4.4 Reorder & Safety Stock Calculations

### Safety Stock
```
Safety Stock = (Max Daily Sales × Max Lead Time) − (Avg Daily Sales × Avg Lead Time)
```

### Reorder Level
```
Reorder Level = (Avg Daily Sales × Lead Time) + Safety Stock
```

### Economic Order Quantity (EOQ)
```
EOQ = √( (2 × Annual Demand × Ordering Cost) / Holding Cost per Unit )
```

### Urgency Classification
| Level | Condition |
|-------|-----------|
| 🔴 CRITICAL | Current stock < Safety Stock |
| 🟡 WARNING | Current stock < Reorder Level AND ≥ Safety Stock |
| 🟢 OPTIMAL | Current stock ≥ Reorder Level |

## 4.5 Expiry & Shelf-Life Management

| Status | Condition | System Action |
|--------|-----------|--------------|
| `NEAR_EXPIRY` | Expiry within 90 days | Flag product; send alert notification |
| `EXPIRED` | Past expiry date | Set `is_active = false`; block from sales |

The expiry check cron job runs **daily at 6 AM IST**.

## 4.6 Invoice Lifecycle

```
Sales Order CONFIRMED
       │
       ▼
Auto-generate Invoice (INV-YYYYMMDD-XXXX) — Status: PENDING
       │
       ├─► Payment Received (full/partial)
       │         ├─► Create Payment record
       │         ├─► Link transaction reference (UPI/Card/Cash/NEFT)
       │         ├─► Invoice: PAID (if balance = 0) / PARTIAL
       │         └─► Sales Order: is_paid = true
       │
       └─► No Payment by Due Date
                 ├─► Invoice Status: OVERDUE
                 └─► Send automated email reminder
```

---

# 5. System Architecture

## 5.1 Architectural Style

InventoryPro is designed as a **decoupled layered monolith** — grouping business logic into logical service modules while maintaining a single deployable backend. This balances local execution speed, simple deployment configurations, and clean separation of concerns.

**Why Monolith over Microservices?**
- Simpler deployment (Docker Compose → ECS)
- No distributed transaction complexity
- Faster development iterations
- Prisma provides type-safety across the entire domain
- Redis handles async workloads (forecasting cache, job queues)

## 5.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                  │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐ │
│  │  Next.js 15 App     │    │  Third-party (Webhooks, S3, SES) │ │
│  │  React 19 + Redux   │    └──────────────────────────────────┘ │
│  └──────────┬──────────┘                                         │
└─────────────┼────────────────────────────────────────────────────┘
              │ HTTPS (REST JSON)
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express.js)                        │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Middlewares │  │  Controllers │  │       Services          │ │
│  │ ─────────── │  │ ──────────── │  │ ───────────────────── │ │
│  │ authenticate│  │ Parse HTTP   │  │ Business Logic          │ │
│  │ hasPermission│ │ Map params   │  │ Tax calculations        │ │
│  │ rateLimiter │  │ JSON response│  │ Forecasting engine      │ │
│  │ validateBody│  │              │  │ Stock workflows         │ │
│  │ auditLog    │  └──────────────┘  │ Invoice generation      │ │
│  └─────────────┘                   └──────────┬──────────────┘ │
│                                               │                  │
│                        ┌──────────────────────┤                  │
│                        ▼                      ▼                  │
│              ┌──────────────────┐   ┌────────────────┐         │
│              │  Prisma ORM      │   │  Redis Client  │         │
│              │  (Type-safe SQL) │   │  (Cache/Queue) │         │
│              └────────┬─────────┘   └───────┬────────┘         │
└───────────────────────┼───────────────────────┼─────────────────┘
                        ▼                       ▼
              ┌──────────────────┐   ┌────────────────┐
              │ PostgreSQL 16    │   │   Redis 7      │
              │ (Primary Store)  │   │   (Cache)      │
              └──────────────────┘   └────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   AWS S3         │
              │   (Image Store)  │
              └──────────────────┘
```

## 5.3 Layer Responsibilities

### Frontend Layer (Next.js 15 / React 19)
| Concern | Implementation |
|---------|---------------|
| State Management | Redux Toolkit — layout status, active sessions, toasts, modals |
| Routing | Next.js App Router with React 19 Client/Server components |
| API Client | Axios with request interceptors (inject Bearer token) and response interceptors (auto-refresh on 401) |
| Charts | Recharts — responsive area and bar charts |
| Forms | React Hook Form + Zod validation |
| Tables | TanStack Table with sorting, filtering, pagination |
| Animations | Framer Motion — fade-in, slide-up, sidebar transitions |
| Styling | TailwindCSS v4 with glassmorphism utility classes |

### Backend Layer (Express.js / Node.js 20)
| Layer | Responsibility |
|-------|---------------|
| **Routes** | URL parsing, method routing, middleware chain composition |
| **Middlewares** | Auth, permission checks, rate limiting, validation, audit logging |
| **Controllers** | HTTP parsing, request body mapping, response formatting |
| **Services** | Pure business logic — status workflows, calculations, data transformations |
| **Prisma ORM** | Type-safe PostgreSQL queries, transactions, migrations, seeding |

## 5.4 Caching Architecture (Cache-Aside Pattern)

```
Request → Check Redis Cache
    │
    ├─► Cache HIT  → Return cached data (< 50ms)
    │
    └─► Cache MISS → Query PostgreSQL → Write to Redis → Return data
```

| Cache Key | TTL | Invalidation Strategy |
|-----------|-----|----------------------|
| `kpi:dashboard:{orgId}` | 5 minutes | Time-based expiry |
| `products:catalog:{orgId}` | Until mutation | Active eviction on CREATE/UPDATE/DELETE |
| `categories:list:{orgId}` | Until mutation | Active eviction on mutation |
| `forecast:{productId}` | 24 hours | Time-based (daily recalculation) |
| `inventory:levels:{warehouseId}` | 60 seconds | Active eviction on stock movement |

**Graceful Fallback:** Redis offline → log warning → fall back to memory cache → fall back to direct DB query.

## 5.5 Asset Storage Strategy

- Product images are stored in **AWS S3** (production) or local `uploads/` folder (development).
- The backend generates **presigned upload URLs** (valid 15 min), allowing the frontend to upload directly to S3 — reducing server load.
- Images are served via **AWS CloudFront CDN** in `.webp` format for optimal compression.
- S3 bucket policy: private (no public access); all reads via signed CloudFront URLs.

---

# 6. Technology Stack

## 6.1 Complete Stack Reference

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.x | React framework, App Router, SSR |
| React | 19.x | UI component library |
| TailwindCSS | v4 | Utility-first styling |
| Redux Toolkit | 2.x | Global state management |
| Axios | 1.x | HTTP client with interceptors |
| React Hook Form | 7.x | Form state and validation |
| Zod | 3.x | Schema validation (shared with backend) |
| TanStack Table | 8.x | Headless data table |
| Recharts | 2.x | Charts and data visualization |
| Framer Motion | 11.x | Animation library |
| shadcn/ui | latest | Pre-built accessible components |
| Lucide React | latest | Icon library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x LTS | JavaScript runtime (ESM) |
| Express.js | 4.x | HTTP server framework |
| TypeScript | 5.x | Type safety |
| Prisma ORM | 5.x | Type-safe database client |
| Jose | 5.x | JWT signing and verification |
| Argon2 | latest | Password hashing |
| Zod | 3.x | Request body validation |
| Winston | 3.x | Structured application logging |
| Morgan | 1.x | HTTP request logging |
| Helmet.js | 7.x | Security HTTP headers |
| express-rate-limit | 7.x | Rate limiting middleware |
| compression | 1.x | Gzip response compression |
| Nodemailer | 6.x | Email dispatch |
| AWS SDK v3 | latest | S3 presigned URLs |
| node-cron | 3.x | Scheduled jobs (expiry checks, forecast) |

### Infrastructure
| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 16.x | Primary relational database |
| Redis | 7.x | Caching and job queues |
| Docker | 24.x | Containerization |
| Docker Compose | 2.x | Local dev orchestration |
| Nginx | 1.25 | Reverse proxy, SSL termination |
| AWS ECS Fargate | — | Container orchestration (production) |
| AWS RDS | PostgreSQL 16 | Managed database (production) |
| AWS ElastiCache | Redis 7 | Managed cache (production) |
| AWS S3 | — | Object storage |
| AWS CloudFront | — | CDN for static assets |
| GitHub Actions | — | CI/CD pipeline |
| Prometheus + Grafana | — | Metrics and monitoring |

---

# 7. Folder Structure

## 7.1 Monorepo Root

```
InventoryPro/
├── docker/
│   ├── Dockerfile.backend          # Backend production build
│   └── Dockerfile.frontend         # Frontend production build
├── docker-compose.yml              # Local dev: postgres, redis, backend, frontend
├── docker-compose.prod.yml         # Production compose (ECS task definition)
├── nginx/
│   └── nginx.conf                  # Reverse proxy + SSL config
├── docs/                           # Documentation files
├── .github/
│   └── workflows/
│       ├── ci.yml                  # PR: lint, type-check, test
│       └── deploy.yml              # main branch: build, push ECR, deploy ECS
├── backend/
└── frontend/
```

## 7.2 Backend Directory (`/backend`)

```
backend/
├── prisma/
│   ├── schema.prisma               # Main Prisma schema (PostgreSQL)
│   ├── schema.prisma.sqlite        # Dev SQLite schema (local sandbox)
│   ├── migrations/                 # Auto-generated SQL migration history
│   └── seed.ts                     # DB seed: roles, permissions, admin user
├── src/
│   ├── server.ts                   # Entry: DB connect, HTTP server start
│   ├── app.ts                      # Express app: middleware chain, route registration
│   ├── config/
│   │   ├── env.ts                  # Validated env vars (Zod schema)
│   │   ├── database.ts             # Prisma client singleton
│   │   ├── redis.ts                # Redis client with graceful fallback
│   │   └── logger.ts               # Winston logger configuration
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── products.controller.ts
│   │   ├── inventory.controller.ts
│   │   ├── warehouses.controller.ts
│   │   ├── purchase-orders.controller.ts
│   │   ├── sales-orders.controller.ts
│   │   ├── customers.controller.ts
│   │   ├── invoices.controller.ts
│   │   ├── payments.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── audit-logs.controller.ts
│   ├── middlewares/
│   │   ├── authenticate.middleware.ts   # JWT verification, attach req.user
│   │   ├── hasPermission.middleware.ts  # DB-backed RBAC check
│   │   ├── validate.middleware.ts       # Zod schema body/query validation
│   │   ├── rateLimiter.middleware.ts    # express-rate-limit configs
│   │   ├── auditLog.middleware.ts       # Auto-log mutations to audit_logs
│   │   └── errorHandler.middleware.ts  # Global error → sanitized JSON
│   ├── routes/
│   │   ├── index.ts                    # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── products.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── warehouses.routes.ts
│   │   ├── purchase-orders.routes.ts
│   │   ├── sales-orders.routes.ts
│   │   ├── customers.routes.ts
│   │   ├── invoices.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── audit-logs.routes.ts
│   ├── services/
│   │   ├── auth.service.ts             # Token lifecycle, password, MFA
│   │   ├── products.service.ts         # Product CRUD, SKU generation
│   │   ├── inventory.service.ts        # Stock-in/out, transfer, level reads
│   │   ├── purchase-orders.service.ts  # PO workflows, approval logic
│   │   ├── sales-orders.service.ts     # SO workflows, stock reservation
│   │   ├── invoices.service.ts         # Invoice generation, GST calculation
│   │   ├── forecasting.service.ts      # Holt-Winters, EOQ, anomaly detection
│   │   ├── notifications.service.ts    # Alert creation, email dispatch
│   │   ├── cache.service.ts            # Redis cache-aside helpers
│   │   └── analytics.service.ts        # KPI aggregations, report queries
│   ├── jobs/
│   │   ├── expiry-check.job.ts         # Daily: flag NEAR_EXPIRY / EXPIRED
│   │   └── forecast-refresh.job.ts     # Daily: refresh forecast cache
│   ├── types/
│   │   ├── express.d.ts                # Augment req.user type
│   │   └── payloads.ts                 # Request/response interfaces
│   └── validators/
│       ├── auth.validator.ts
│       ├── product.validator.ts
│       ├── inventory.validator.ts
│       ├── purchase-order.validator.ts
│       └── sales-order.validator.ts
├── package.json
└── tsconfig.json
```

## 7.3 Frontend Directory (`/frontend`)

```
frontend/
├── public/
│   └── assets/                     # Logos, favicon, static images
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx        # Login page
│   │   ├── (dashboard)/            # Protected layout group
│   │   │   ├── layout.tsx          # Sidebar + Topbar layout
│   │   │   ├── page.tsx            # Main dashboard (KPIs, charts)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx        # Product catalog table
│   │   │   │   ├── new/page.tsx    # Create product form
│   │   │   │   └── [id]/page.tsx   # Edit product form
│   │   │   ├── categories/page.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx        # Stock levels overview
│   │   │   │   ├── movements/page.tsx
│   │   │   │   └── adjustments/page.tsx
│   │   │   ├── warehouses/page.tsx
│   │   │   ├── purchase-orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   ├── suppliers/page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx   # Invoice detail + print view
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx        # Analytics & forecasting
│   │   │   │   └── forecast/page.tsx
│   │   │   └── audit-logs/page.tsx
│   │   ├── globals.css             # Global CSS, theme vars, glassmorphic styles
│   │   └── providers.tsx           # Redux Provider + Auth context
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── DataTable.tsx       # TanStack Table wrapper
│   │   │   ├── StatCard.tsx        # KPI card component
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Badge.tsx           # Status badges
│   │   │   ├── Toast.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── auth/
│   │   │   └── RoleGuard.tsx       # Component-level permission guard
│   │   ├── products/
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductImageUpload.tsx
│   │   ├── inventory/
│   │   │   └── StockAdjustmentForm.tsx
│   │   ├── charts/
│   │   │   ├── SalesAreaChart.tsx
│   │   │   ├── InventoryBarChart.tsx
│   │   │   ├── ForecastLineChart.tsx
│   │   │   └── WarehouseDonutChart.tsx
│   │   └── invoices/
│   │       └── InvoicePrintTemplate.tsx
│   ├── lib/
│   │   ├── api.ts                  # Axios instance with interceptors
│   │   ├── auth.ts                 # Auth helpers (decode JWT, check role)
│   │   └── utils.ts                # Currency, date, number formatters
│   ├── store/
│   │   ├── index.ts                # Redux store config
│   │   ├── slices/
│   │   │   ├── authSlice.ts        # User session state
│   │   │   ├── uiSlice.ts          # Sidebar open/close, active modal
│   │   │   └── toastSlice.ts       # Toast notification queue
│   │   └── hooks.ts                # Typed useAppDispatch, useAppSelector
│   └── types/
│       ├── auth.ts
│       ├── product.ts
│       ├── inventory.ts
│       ├── order.ts
│       └── analytics.ts
├── package.json
└── tsconfig.json
```

---

# 8. Database Design

## 8.1 Schema Overview

InventoryPro uses a **normalized relational PostgreSQL database** (Prisma-managed) ensuring strict ACID transactional safety and query performance. All tables use UUID primary keys.

## 8.2 Entity Relationship Diagram

```
users ──────────────► roles ──────────────► role_permissions ──► permissions
  │                                                                    
  │ (audit_logs)
  │
products ──────────► categories
    │  └──────────► suppliers
    │
    ├──────────────► inventory (product_id + warehouse_id composite unique)
    │                    └──► warehouses
    │
    ├──────────────► inventory_movements
    │
    ├──────────────► purchase_order_items ──► purchase_orders ──► suppliers
    │
    ├──────────────► sales_order_items ──► sales_orders ──► customers
    │                                             │
    │                                             └──► invoices ──► invoice_items
    │                                             └──► payments
    │
    └──────────────► invoice_items
```

## 8.3 Table Schemas

### `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,           -- Argon2id hash
  role_id       UUID NOT NULL REFERENCES roles(id),
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  failed_attempts SMALLINT DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `roles` & `permissions`
```sql
CREATE TABLE roles (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT UNIQUE NOT NULL        -- 'Admin' | 'Manager' | 'Staff' | 'Auditor'
);

CREATE TABLE permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name TEXT UNIQUE NOT NULL  -- e.g. 'CREATE_PRODUCT', 'APPROVE_PO'
);

CREATE TABLE role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

### `products`
```sql
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  sku           TEXT UNIQUE NOT NULL,
  barcode       TEXT UNIQUE,
  description   TEXT,
  price         DECIMAL(12,2) NOT NULL,
  cost_price    DECIMAL(12,2),
  quantity      INTEGER NOT NULL DEFAULT 0,  -- aggregate (denormalized for speed)
  reorder_level INTEGER DEFAULT 10,
  category_id   UUID NOT NULL REFERENCES categories(id),
  supplier_id   UUID REFERENCES suppliers(id),
  image_url     TEXT,
  expiry_date   TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_fts ON products USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description,'') || ' ' || sku)
);
```

### `warehouses`
```sql
CREATE TABLE warehouses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_name TEXT NOT NULL,
  location       TEXT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### `inventory`
```sql
CREATE TABLE inventory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  quantity     INTEGER NOT NULL DEFAULT 0,
  bin_location TEXT,            -- e.g. 'A-01-R2-B4'
  UNIQUE(product_id, warehouse_id)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
```

### `inventory_movements`
```sql
CREATE TABLE inventory_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id),
  warehouse_id  UUID NOT NULL REFERENCES warehouses(id),
  movement_type TEXT NOT NULL,  -- STOCK_IN | STOCK_OUT | TRANSFER_IN | TRANSFER_OUT | RETURN | DAMAGED
  quantity      INTEGER NOT NULL,
  reference     TEXT,           -- PO number / SO number
  notes         TEXT,
  performed_by  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
  -- APPEND ONLY: never updated or deleted
);

CREATE INDEX idx_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_movements_date ON inventory_movements(created_at DESC);
-- BRIN index for time-series scan performance
CREATE INDEX idx_movements_brin ON inventory_movements USING BRIN(created_at);
```

### `purchase_orders`
```sql
CREATE TABLE purchase_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,    -- Auto-generated: PO-YYYYMMDD-XXXX
  supplier_id  UUID NOT NULL REFERENCES suppliers(id),
  total_amount DECIMAL(14,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING|APPROVED|RECEIVED|CANCELLED
  approved_by  UUID REFERENCES users(id),
  approved_at  TIMESTAMPTZ,
  notes        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
```

### `purchase_order_items`
```sql
CREATE TABLE purchase_order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id),
  quantity         INTEGER NOT NULL,
  unit_price       DECIMAL(12,2) NOT NULL
);
```

### `sales_orders`
```sql
CREATE TABLE sales_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   TEXT UNIQUE NOT NULL,    -- Auto: SO-YYYYMMDD-XXXX
  customer_id    UUID REFERENCES customers(id),
  customer_name  TEXT NOT NULL,           -- Denormalized fallback
  customer_email TEXT,
  customer_phone TEXT,
  warehouse_id   UUID REFERENCES warehouses(id),
  total_amount   DECIMAL(14,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'PENDING',
  is_paid        BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_so_status ON sales_orders(status);
CREATE INDEX idx_so_paid ON sales_orders(is_paid);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
```

### `invoices`
```sql
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,    -- Auto: INV-YYYYMMDD-XXXX
  sales_order_id UUID UNIQUE REFERENCES sales_orders(id),
  customer_id    UUID REFERENCES customers(id),
  subtotal       DECIMAL(14,2) NOT NULL,
  discount       DECIMAL(14,2) DEFAULT 0,
  taxable_amount DECIMAL(14,2) NOT NULL,
  cgst_amount    DECIMAL(14,2) NOT NULL,  -- 9%
  sgst_amount    DECIMAL(14,2) NOT NULL,  -- 9%
  tax_amount     DECIMAL(14,2) NOT NULL,  -- CGST + SGST
  total_amount   DECIMAL(14,2) NOT NULL,
  status         TEXT DEFAULT 'PENDING',  -- PENDING|PARTIAL|PAID|OVERDUE|CANCELLED
  due_date       TIMESTAMPTZ,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### `payments`
```sql
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  invoice_id     UUID REFERENCES invoices(id),
  amount         DECIMAL(14,2) NOT NULL,
  payment_method TEXT NOT NULL,  -- UPI | CARD | CASH | NEFT | RTGS | CHEQUE
  status         TEXT DEFAULT 'SUCCESS',
  reference      TEXT,           -- UPI txn ID / cheque number
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### `audit_logs` (immutable)
```sql
CREATE TABLE audit_logs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id),
  action    TEXT NOT NULL,       -- CREATE | UPDATE | DELETE | APPROVE | RECEIVE | CANCEL
  entity    TEXT NOT NULL,       -- 'Product' | 'PurchaseOrder' | 'SalesOrder' etc.
  entity_id UUID,
  details   JSONB,               -- request body + URL for forensic analysis
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
  -- INSERT ONLY — no UPDATE or DELETE permitted
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
```

### `notifications`
```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),   -- NULL = broadcast to all
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL,  -- LOW_STOCK | NEAR_EXPIRY | PO_PENDING | OVERDUE_INVOICE
  entity     TEXT,
  entity_id  UUID,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 8.4 Default Permission Matrix

| Permission | Admin | Manager | Staff | Auditor |
|-----------|-------|---------|-------|---------|
| VIEW_PRODUCT | ✅ | ✅ | ✅ | ✅ |
| CREATE_PRODUCT | ✅ | ✅ | ✅ | ❌ |
| UPDATE_PRODUCT | ✅ | ✅ | ✅ | ❌ |
| DELETE_PRODUCT | ✅ | ❌ | ❌ | ❌ |
| STOCK_IN | ✅ | ✅ | ✅ | ❌ |
| STOCK_OUT | ✅ | ✅ | ✅ | ❌ |
| TRANSFER_STOCK | ✅ | ✅ | ✅ | ❌ |
| CREATE_PO | ✅ | ✅ | ✅ | ❌ |
| APPROVE_PO | ✅ | ✅ | ❌ | ❌ |
| RECEIVE_PO | ✅ | ✅ | ✅ | ❌ |
| CREATE_SO | ✅ | ✅ | ✅ | ❌ |
| CONFIRM_SO | ✅ | ✅ | ✅ | ❌ |
| SHIP_SO | ✅ | ✅ | ✅ | ❌ |
| PAY_SO | ✅ | ✅ | ❌ | ❌ |
| VIEW_INVOICE | ✅ | ✅ | ❌ | ✅ |
| SEND_INVOICE | ✅ | ✅ | ❌ | ❌ |
| VIEW_REPORTS | ✅ | ✅ | ❌ | ✅ |
| VIEW_FORECAST | ✅ | ✅ | ❌ | ✅ |
| VIEW_AUDIT_LOGS | ✅ | ❌ | ❌ | ✅ |
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ |

---

# 9. Authentication & Authorization

## 9.1 Token Lifecycle

```
[ Frontend Client ]                         [ Express Backend ]
        │                                           │
        ├──── POST /api/auth/login ────────────────►│
        │◄─── { accessToken, refreshToken, user } ──┤
        │                                           │
        ├──── HTTP Request ─────────────────────────►│
        │     Authorization: Bearer <accessToken>   │  (15-min expiry)
        │                                           │
        ├──── 401 Token Expired ────────────────────►│
        │                                           │
        ├──── POST /api/auth/refresh ───────────────►│
        │     (sends refreshToken — 7d expiry)       │
        │◄─── New { accessToken, refreshToken } ─────┤  (old pair revoked)
        │                                           │
        ├──── Retry original request ───────────────►│
```

### Access Token (JWT)
```json
{
  "algorithm": "HS256",
  "expiry": "15 minutes",
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "Manager",
    "iat": 1716800000,
    "exp": 1716800900
  }
}
```

### Refresh Token (JWT)
```json
{
  "algorithm": "HS256",
  "expiry": "7 days",
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "Manager",
    "type": "refresh"
  },
  "storage": "HttpOnly cookie OR secure localStorage"
}
```

**Rotation:** Every `/api/auth/refresh` call returns a **new pair** and revokes the old refresh token (stored in a `revoked_tokens` Redis set).

## 9.2 Secure Token Storage (Browser)

| Token | Storage | Security Attributes |
|-------|---------|---------------------|
| Access Token | Memory (JS variable) or localStorage | — (short-lived) |
| Refresh Token | HttpOnly cookie | `HttpOnly: true`, `Secure: true`, `SameSite: Strict` |

## 9.3 RBAC Middleware Implementation

```typescript
// middlewares/hasPermission.middleware.ts
export function hasPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;

    // Admins bypass all permission checks
    if (userRole === 'Admin') return next();

    const hasAccess = await prisma.rolePermission.findFirst({
      where: {
        role: { roleName: userRole },
        permission: { permissionName: requiredPermission }
      }
    });

    if (!hasAccess) {
      return next(new AppError('Forbidden. Insufficient permissions.', 403));
    }
    next();
  };
}

// Usage in routes:
router.post('/purchase-orders/:id/approve',
  authenticate,
  hasPermission('APPROVE_PO'),
  purchaseOrderController.approve
);
```

## 9.4 Password Security

- Algorithm: **Argon2id** (recommended over bcrypt for resistance to GPU/ASIC attacks)
- Config: `{ memoryCost: 65536, timeCost: 3, parallelism: 4 }`
- Account lockout: 5 failed attempts → lock for 30 minutes
- Password reset: Time-limited secure token (15-min expiry) sent via email

## 9.5 Audit Logging Middleware

```typescript
// middlewares/auditLog.middleware.ts
export function auditLog(entity: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await prisma.auditLog.create({
          data: {
            userId: req.user?.userId,
            action: HTTP_METHOD_TO_ACTION[req.method],
            entity,
            entityId: req.params.id || res.locals.createdId,
            details: { body: req.body, url: req.originalUrl },
            ipAddress: req.ip,
          }
        });
      }
    });
    next();
  };
}
```

---

# 10. API Specification

## 10.1 Design Standards

| Principle | Implementation |
|-----------|---------------|
| Content Type | `application/json` for all requests and responses |
| Base Path | `/api` |
| Auth Header | `Authorization: Bearer <accessToken>` |
| Error Format | `{ "success": false, "error": "message" }` |
| Success Format | `{ "success": true, "data": {...} }` |
| Paginated Format | `{ "success": true, "data": [...], "pagination": {...} }` |
| Versioning | Header: `API-Version: 1` (future-proofed) |
| Idempotency | `X-Idempotency-Key` header for write operations |

## 10.2 Authentication Endpoints

```
POST   /api/auth/login              — Email/password login → tokens
POST   /api/auth/logout             — Revoke current tokens
POST   /api/auth/refresh            — Refresh access token
POST   /api/auth/register           — Create new user (Admin only)
POST   /api/auth/forgot-password    — Request reset email
POST   /api/auth/reset-password     — Apply new password with token
GET    /api/auth/profile            — Get current session user
PATCH  /api/auth/profile            — Update name/avatar
```

### POST /api/auth/login — Request & Response
```json
// Request
{ "email": "admin@inventorypro.com", "password": "Admin@123" }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "user": { "id": "u-1000", "name": "System Admin", "email": "...", "role": "Admin" }
  }
}

// Response 401 — Wrong credentials
{ "success": false, "error": "Invalid email or password." }

// Response 403 — Account locked
{ "success": false, "error": "Account locked. Try again in 30 minutes." }
```

## 10.3 Product Catalog Endpoints

```
GET    /api/products                — List products (paginated, filterable)
POST   /api/products                — Create product
GET    /api/products/:id            — Get product detail
PUT    /api/products/:id            — Full update product
PATCH  /api/products/:id            — Partial update product
DELETE /api/products/:id            — Soft-delete (is_active=false)
GET    /api/categories              — List categories
POST   /api/categories              — Create category
PUT    /api/categories/:id          — Update category
DELETE /api/categories/:id          — Delete category (if no products linked)
```

**Query Params for GET /api/products:**
```
?page=1&limit=20&search=laptop&categoryId=cat-1&supplierId=sup-1
&isActive=true&isLowStock=true&sort=name&order=asc
```

**POST /api/products — Request Body:**
```json
{
  "name": "Mechanical Keyboard",
  "sku": "ELE-900",
  "barcode": "8901234567890",
  "description": "Tactile mechanical keyboard with RGB",
  "price": 99.99,
  "costPrice": 45.00,
  "reorderLevel": 15,
  "categoryId": "cat-1",
  "supplierId": "sup-1",
  "expiryDate": null
}
```

## 10.4 Inventory & Warehouse Endpoints

```
GET    /api/inventory               — Stock overview (all products, all warehouses)
GET    /api/inventory/movements     — Movement ledger (filterable, paginated)
POST   /api/inventory/stock-in      — Receive stock into warehouse
POST   /api/inventory/stock-out     — Remove stock from warehouse
POST   /api/inventory/transfer      — Transfer between warehouses (atomic dual-movement)
GET    /api/warehouses              — List warehouses
POST   /api/warehouses              — Create warehouse
PUT    /api/warehouses/:id          — Update warehouse
DELETE /api/warehouses/:id          — Soft-deactivate warehouse
```

**POST /api/inventory/stock-in:**
```json
{
  "productId": "prod-1",
  "quantity": 100,
  "warehouseId": "wh-1",
  "reference": "PO-20260525-001",
  "notes": "Incoming restocking from Dell India"
}
```

**POST /api/inventory/transfer:**
```json
{
  "productId": "prod-1",
  "quantity": 25,
  "fromWarehouseId": "wh-1",
  "toWarehouseId": "wh-2",
  "notes": "Regional redistribution"
}
```

## 10.5 Purchase Order Endpoints

```
GET    /api/purchase-orders                 — List POs (filter: status, page, limit)
POST   /api/purchase-orders                 — Create PO
GET    /api/purchase-orders/:id             — Get PO detail with line items
PUT    /api/purchase-orders/:id             — Update PO (PENDING only)
DELETE /api/purchase-orders/:id             — Delete PO (PENDING or CANCELLED only)
PATCH  /api/purchase-orders/:id/approve     — Approve PO (Manager/Admin, >₹50K required)
PATCH  /api/purchase-orders/:id/receive     — Receive PO → stock incremented
PATCH  /api/purchase-orders/:id/cancel      — Cancel PO (non-RECEIVED only)
GET    /api/suppliers                       — List suppliers
POST   /api/suppliers                       — Create supplier
PUT    /api/suppliers/:id                   — Update supplier
DELETE /api/suppliers/:id                   — Delete supplier (no linked POs)
```

**POST /api/purchase-orders:**
```json
{
  "supplierId": "sup-1",
  "items": [
    { "productId": "prod-1", "quantity": 20, "unitPrice": 45.00 },
    { "productId": "prod-2", "quantity": 10, "unitPrice": 120.00 }
  ],
  "notes": "Quarterly restock order"
}
```

**PATCH /api/purchase-orders/:id/receive:**
```json
{ "warehouseId": "wh-1" }
```
*Effect: PO status → RECEIVED; stock_in movement created for each line item; inventory quantities incremented.*

## 10.6 Sales Order Endpoints

```
GET    /api/sales-orders                — List SOs
POST   /api/sales-orders                — Create SO
GET    /api/sales-orders/:id            — Get SO detail
PUT    /api/sales-orders/:id            — Update SO (PENDING only)
DELETE /api/sales-orders/:id            — Delete SO (unpaid PENDING/CANCELLED only)
PATCH  /api/sales-orders/:id/confirm    — Confirm SO → reserve & deduct stock + auto-generate invoice
PATCH  /api/sales-orders/:id/ship       — Mark as shipped → STOCK_OUT movement
PATCH  /api/sales-orders/:id/deliver    — Mark as delivered
PATCH  /api/sales-orders/:id/cancel     — Cancel SO (pre-SHIPPED; restores stock if CONFIRMED)
PATCH  /api/sales-orders/:id/pay        — Record payment → update invoice
```

## 10.7 Customer & Invoice Endpoints

```
GET    /api/customers                   — List customers
POST   /api/customers                   — Create customer
PUT    /api/customers/:id               — Update customer
DELETE /api/customers/:id               — Delete customer (no linked orders)

GET    /api/invoices                    — List invoices
POST   /api/invoices                    — Manual invoice creation
GET    /api/invoices/:id                — Invoice detail
PATCH  /api/invoices/:id/status         — Update invoice status
POST   /api/invoices/:id/send-email     — Email PDF to customer

POST   /api/payments                    — Record payment
GET    /api/payments                    — Payment history
```

**POST /api/payments:**
```json
{
  "salesOrderId": "so-100",
  "amount": 250.00,
  "paymentMethod": "UPI",
  "reference": "UPI-txn-82019"
}
```

## 10.8 Analytics & Forecasting Endpoints

```
GET    /api/analytics/dashboard         — KPI cards, recent activity
GET    /api/analytics/sales             — Sales trends (?startDate&endDate)
GET    /api/analytics/inventory         — Inventory valuation, ABC analysis
GET    /api/analytics/forecast          — 7 & 30-day demand forecast + reorder suggestions
GET    /api/audit-logs                  — System activity (Admin/Auditor only)
```

**GET /api/analytics/forecast — Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-05-25T10:00:00Z",
    "forecast": [
      { "date": "2026-06-01", "predictedDemand": 150, "confidence80Lower": 120, "confidence80Upper": 182 },
      { "date": "2026-06-02", "predictedDemand": 162, "confidence80Lower": 130, "confidence80Upper": 196 }
    ],
    "reorders": [
      {
        "productId": "prod-1",
        "productName": "Wireless Mouse",
        "currentStock": 12,
        "reorderLevel": 20,
        "safetyStock": 8,
        "suggestedOrderQty": 80,
        "urgency": "WARNING",
        "daysOfStockRemaining": 5.8
      }
    ]
  }
}
```

## 10.9 Error Codes Reference

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | VALIDATION_ERROR | Request body failed Zod schema |
| 400 | INSUFFICIENT_STOCK | Requested qty > available qty |
| 400 | NEGATIVE_STOCK | Would result in negative stock |
| 400 | INVALID_TRANSITION | Invalid status state change |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 401 | TOKEN_EXPIRED | JWT past expiry time |
| 403 | FORBIDDEN | Insufficient RBAC permissions |
| 403 | ACCOUNT_LOCKED | Too many failed logins |
| 404 | NOT_FOUND | Resource not found |
| 409 | DUPLICATE_SKU | SKU already exists |
| 409 | DUPLICATE_BARCODE | Barcode already registered |
| 409 | APPROVAL_REQUIRED | PO > ₹50K needs manager approval |
| 422 | BUSINESS_RULE_VIOLATION | Domain logic prevents operation |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |

## 10.10 Rate Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `POST /api/auth/login` | 10 requests | 15 minutes per IP |
| `POST /api/auth/refresh` | 20 requests | 15 minutes per IP |
| All other API routes | 100 requests | 15 minutes per IP |

---

# 11. AI & Forecasting Architecture

## 11.1 Overview

The AI forecasting module provides three key outputs:
1. **7-day and 30-day demand projections** per product
2. **Anomaly alerts** for unusual stock movements
3. **Smart reorder suggestions** with urgency classification

```
[ Sales Transactions / Stock Movements ]
               │
               ▼
[ Data Pre-processing ]
  ├─ Filter: exclude cancellations, returns, adjustments
  ├─ Aggregate: daily/weekly demand totals per product
  ├─ Handle missing days: fill with 0 or interpolate
  └─ Outlier detection: cap values beyond 3σ
               │
               ▼
[ Model Selection & Fitting ]
  ├─► Moving Average         (< 30 days history)
  ├─► Linear Regression      (trend-only, no seasonality)
  └─► Holt-Winters (Triple ETS) (primary model — handles seasonality)
               │
               ▼
[ Outputs ]
  ├─ 7-day demand forecast
  ├─ 30-day demand forecast with confidence bands
  ├─ Reorder point per product
  └─ Urgency-classified reorder suggestions
```

## 11.2 Holt-Winters Triple Exponential Smoothing

**Forecast Formula:**
```
ŷ(t+h|t) = l(t) + h·b(t) + s(t + h - m(k+1))
```

**Level (baseline):**
```
l(t) = α(y(t) - s(t-m)) + (1-α)(l(t-1) + b(t-1))
```

**Trend (rate of change):**
```
b(t) = β(l(t) - l(t-1)) + (1-β)b(t-1)
```

**Seasonal factor:**
```
s(t) = γ(y(t) - l(t-1) - b(t-1)) + (1-γ)s(t-m)
```

| Parameter | Symbol | Role | Default |
|-----------|--------|------|---------|
| Level smoothing | α | How quickly baseline adapts | 0.3 |
| Trend smoothing | β | How quickly trend direction adapts | 0.1 |
| Seasonal smoothing | γ | How quickly seasonal factors adapt | 0.2 |
| Season length | m | Days in one full seasonal cycle | 7 (weekly) |

**Model Selection Logic:**
```typescript
function selectModel(history: DemandPoint[]): ModelType {
  if (history.length < 30)  return 'MOVING_AVERAGE';
  if (history.length < 60)  return 'LINEAR_REGRESSION';
  const seasonalityScore = detectSeasonality(history);
  return seasonalityScore > 0.4 ? 'HOLT_WINTERS' : 'LINEAR_REGRESSION';
}
```

## 11.3 Anomaly Detection

Flag transactions where demand deviates significantly from the rolling mean:

```
Anomaly Condition: |x(t) - μ| > K · σ
```

| Symbol | Meaning |
|--------|---------|
| x(t) | Current day's demand |
| μ | Rolling 30-day average demand |
| σ | Standard deviation of 30-day demand |
| K | Sensitivity threshold — default **2.5** |

**Anomaly triggers:**
- Unexpected stock-outs (demand spike > 2.5σ)
- Suspiciously large manual adjustments
- Zero-demand for products with consistent historical sales (possible data entry errors)

## 11.4 Smart Reorder Suggester

### Calculations
```typescript
const avgDailySales  = mean(last30DaysDemand);
const maxDailySales  = max(last30DaysDemand);
const avgLeadTime    = supplier.avgLeadTimeDays;
const maxLeadTime    = supplier.maxLeadTimeDays;

const safetyStock    = (maxDailySales * maxLeadTime) - (avgDailySales * avgLeadTime);
const reorderLevel   = (avgDailySales * avgLeadTime) + safetyStock;
const eoq            = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
const daysRemaining  = currentStock / avgDailySales;
```

### Urgency Classification
```typescript
function classifyUrgency(currentStock: number, safetyStock: number, reorderLevel: number): Urgency {
  if (currentStock < safetyStock)   return 'CRITICAL';  // 🔴
  if (currentStock < reorderLevel)  return 'WARNING';   // 🟡
  return 'OPTIMAL';                                      // 🟢
}
```

## 11.5 Forecast Service Implementation

```typescript
// services/forecasting.service.ts
export class ForecastingService {

  async getDemandForecast(productId: string): Promise<ForecastResult> {
    // 1. Check Redis cache (TTL: 24h)
    const cached = await cache.get(`forecast:${productId}`);
    if (cached) return JSON.parse(cached);

    // 2. Fetch 90 days of sales history from inventory_movements
    const history = await this.getSalesHistory(productId, 90);

    // 3. Select and run model
    const model = selectModel(history);
    const forecast = runModel(model, history, { horizon7: true, horizon30: true });

    // 4. Detect anomalies in recent 7 days
    const anomalies = detectAnomalies(history.slice(-7), history);

    // 5. Calculate reorder
    const reorder = await this.calculateReorder(productId, history);

    const result = { forecast, anomalies, reorder, generatedAt: new Date() };

    // 6. Cache for 24 hours
    await cache.set(`forecast:${productId}`, JSON.stringify(result), 86400);

    return result;
  }
}
```

---

# 12. UI/UX Design System

## 12.1 Design Philosophy

| Principle | Implementation |
|-----------|---------------|
| **Modern SaaS** | Glassmorphism, subtle gradients, dark theme defaults |
| **Clarity First** | Data-dense layouts with clear visual hierarchy |
| **Fast Workflows** | Keyboard navigation, minimal clicks to action |
| **Low Cognitive Load** | Consistent spacing, progressive disclosure |
| **Enterprise Grade** | Professional typography, reliable data tables |

**Aesthetic inspirations:** Stripe Dashboard, Linear, Notion, Vercel, Shopify Admin.

## 12.2 Color Palette

### Brand Colors
```css
--primary-blue:   #2563EB;   /* Primary actions, links, focus rings */
--primary-hover:  #1D4ED8;   /* Button hover states */
--primary-light:  #DBEAFE;   /* Selected rows, subtle highlights */
--indigo:         #4F46E5;   /* Secondary brand accent */
--purple-accent:  #7C3AED;   /* Tertiary accent */
```

### Backgrounds (Dark Theme — Default)
```css
--bg-app:        #020617;    /* Deepest background (Slate-950) */
--bg-sidebar:    #0F172A;    /* Sidebar panel */
--bg-card:       #0F172A;    /* Card surface */
--bg-card-hover: #1E293B;    /* Table row hover */
--bg-input:      #1E293B;    /* Form input background */
```

### Text Colors
```css
--text-primary:   #F8FAFC;   /* Headings, important labels */
--text-secondary: #CBD5E1;   /* Body text, form labels */
--text-muted:     #94A3B8;   /* Helper text, secondary info */
--text-disabled:  #475569;   /* Disabled states */
```

### Borders
```css
--border-light:   #1E293B;   /* Subtle card borders */
--border-default: #334155;   /* Form input borders */
--border-focus:   #3B82F6;   /* Active input focus border */
```

### Status / Semantic
```css
/* Success */
--success:        #10B981;   --success-bg: #064E3B;
/* Warning */
--warning:        #F59E0B;   --warning-bg: #451A03;
/* Danger */
--danger:         #F43F5E;   --danger-bg:  #4C0519;
/* Info */
--info:           #38BDF8;   --info-bg:    #0C4A6E;
/* Neutral */
--neutral:        #94A3B8;   --neutral-bg: #1E293B;
```

## 12.3 Typography System

```css
/* Primary font */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Scale */
--text-xs:   0.75rem;   /* 12px — captions, badges */
--text-sm:   0.875rem;  /* 14px — table content, helper text */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — section labels */
--text-xl:   1.25rem;   /* 20px — card titles */
--text-2xl:  1.5rem;    /* 24px — page titles */
--text-3xl:  1.875rem;  /* 30px — KPI values */
--text-4xl:  2.25rem;   /* 36px — dashboard hero numbers */

/* Weights */
--weight-regular:  400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;

/* Line Heights */
--leading-tight:   1.2;   /* Headings */
--leading-normal:  1.5;   /* Body text */
```

## 12.4 Spacing System (8px Grid)
```
4px | 8px | 12px | 16px | 24px | 32px | 48px | 64px
```

## 12.5 Border Radius Scale
```css
--radius-sm:  6px;    /* Tags, badges, small inputs */
--radius-md:  10px;   /* Buttons, standard inputs */
--radius-lg:  16px;   /* Cards, modals */
--radius-xl:  24px;   /* Feature sections, large panels */
--radius-full: 9999px; /* Pill badges, avatars */
```

## 12.6 Shadows
```css
--shadow-card:     0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20);
--shadow-elevated: 0 10px 25px rgba(0,0,0,0.40);
--shadow-modal:    0 25px 60px rgba(0,0,0,0.50);
--shadow-glow-blue: 0 0 20px rgba(37, 99, 235, 0.15);
```

## 12.7 Glassmorphism Pattern
```css
/* Glass card effect */
.glass-card {
  background: rgba(15, 23, 42, 0.60);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}
```

## 12.8 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (260px fixed / 72px collapsed)                         │
│  ─────────────────  │  TOP NAR (72px)                           │
│  Logo                │  [Search...] [🔔 3] [🌙] [Avatar]       │
│  ─────────────────  │──────────────────────────────────────────│
│  📊 Dashboard        │                                          │
│  📦 Products         │  PAGE TITLE                              │
│  🏭 Warehouses       │                                          │
│  🛒 Purchase Orders  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  📋 Sales Orders     │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │   │
│  👥 Customers        │  └──────┘ └──────┘ └──────┘ └──────┘   │
│  🏢 Suppliers        │                                          │
│  📄 Invoices         │  ┌──────────────────┐ ┌──────────────┐  │
│  📈 Reports          │  │  CHART / TABLE   │ │  SIDE PANEL  │  │
│  🗂 Audit Logs       │  │                  │ │              │  │
│  ──────────────────  │  └──────────────────┘ └──────────────┘  │
│  ⚙️ Settings          │                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 12.9 Component Patterns

### Data Tables
- **Sticky headers** — always visible on scroll
- **Row hover** highlight: `rgba(255,255,255,0.04)`
- **Row selection** via checkbox column (bulk actions appear in action bar)
- **Sortable columns** with direction indicators
- **Pagination**: page-based with configurable rows (10/20/50/100)
- **Export**: CSV and PDF from table header toolbar
- **Search + Filter** bar above table

### Status Badges
```
🟢 In Stock / Success / Approved / Delivered   → Emerald bg + text
🟡 Low Stock / Warning / Pending / Partial     → Amber bg + text
🔴 Out of Stock / Error / Cancelled / Overdue  → Rose bg + text
🔵 On Order / Info / Confirmed / Shipped       → Cyan bg + text
⚪ Draft / Neutral / Inactive                  → Slate bg + text
```

### Form Inputs
```css
.input {
  height: 44px;
  padding: 10px 14px;
  border-radius: 12px;          /* rounded-xl */
  border: 1px solid #334155;
  background: #1E293B;
  color: #F8FAFC;
  transition: border-color 0.2s;
}
.input:focus {
  border-color: rgba(59,130,246,0.40);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.10);
  outline: none;
}
```

### Toast Notifications
```
✅ SUCCESS  — Emerald left border, auto-dismiss 4s
⚠️ WARNING  — Amber left border, auto-dismiss 6s
❌ ERROR    — Rose left border, persistent (manual dismiss)
ℹ️ INFO     — Cyan left border, auto-dismiss 5s
```

### Animation Guidelines
```css
/* Default transitions */
--duration-fast:   150ms;
--duration-normal: 200ms;
--duration-slow:   300ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);

/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 250ms ease;
}
```

## 12.10 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | 640px | 1 column, hamburger nav |
| Tablet | 768px | 2 columns, collapsible sidebar |
| Laptop | 1024px | 3 columns, compact sidebar |
| Desktop | 1280px | 4 columns, full sidebar |
| Wide | 1536px | 5+ columns, expanded analytics |

## 12.11 Icon System

**Library:** Lucide React (outline style, consistent 1.5px stroke)

| Context | Icon | Usage |
|---------|------|-------|
| Dashboard | `LayoutDashboard` | Nav item |
| Products | `Package` | Nav + page header |
| Warehouses | `Warehouse` | Nav + page header |
| Purchase Orders | `ShoppingCart` | Nav |
| Sales Orders | `ClipboardList` | Nav |
| Customers | `Users` | Nav |
| Suppliers | `Truck` | Nav |
| Invoices | `FileText` | Nav |
| Reports | `BarChart3` | Nav |
| Forecast | `TrendingUp` | Feature icon |
| Low Stock | `AlertTriangle` | Warning indicator |
| Approved | `CheckCircle` | Status icon |
| Rejected | `XCircle` | Status icon |
| Scan | `ScanLine` | Barcode action |
| Export | `Download` | Table action |
| Notifications | `Bell` | Topbar |
| Settings | `Settings` | Nav bottom |

---

# 13. Invoice & Billing Design

## 13.1 Invoice Types

| Type | Trigger | Purpose |
|------|---------|---------|
| **Sales Invoice (Tax Invoice)** | Auto on SO confirmation | Bills customer; includes GST breakdown |
| **Purchase Invoice** | On PO receipt | Records supplier payable |
| **Credit Note** | Customer return/billing correction | Adjusts downward against Sales Invoice |
| **Debit Note** | Supplier dispute (damaged/shortage) | Adjusts upward against Purchase Invoice |

## 13.2 Invoice Numbering
```
Format: {TYPE}-{YYYYMMDD}-{SEQUENCE}
Examples:
  INV-20260525-0001    (Sales Invoice)
  PINV-20260525-0001   (Purchase Invoice)
  CN-20260525-0001     (Credit Note)
  DN-20260525-0001     (Debit Note)
```

## 13.3 GST Tax Calculation (Detailed)

```
For each line item (i):
  Net Value(i)      = Quantity(i) × Unit Price(i)
  Taxable Value(i)  = Net Value(i) − Discount(i)
  CGST(i)           = Taxable Value(i) × 0.09    ← Central GST 9%
  SGST(i)           = Taxable Value(i) × 0.09    ← State GST 9%
  Total Tax(i)      = CGST(i) + SGST(i)          ← = 18%
  Line Total(i)     = Taxable Value(i) + Total Tax(i)

Invoice Totals:
  Subtotal          = Σ Net Value(i)
  Total Discount    = Σ Discount(i)
  Total Taxable     = Σ Taxable Value(i)
  Total CGST        = Σ CGST(i)
  Total SGST        = Σ SGST(i)
  Grand Total       = Total Taxable + Total CGST + Total SGST
```

## 13.4 Invoice Data Model

```typescript
interface Invoice {
  id:             string;
  invoiceNumber:  string;         // INV-YYYYMMDD-XXXX
  salesOrderId:   string;
  customerId:     string;
  items:          InvoiceItem[];
  subtotal:       number;
  discount:       number;
  taxableAmount:  number;
  cgstAmount:     number;         // 9%
  sgstAmount:     number;         // 9%
  taxAmount:      number;         // CGST + SGST
  totalAmount:    number;
  status:         'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate:        Date;
  sentAt:         Date | null;
  createdAt:      Date;
}

interface InvoiceItem {
  id:           string;
  invoiceId:    string;
  productId:    string;
  productName:  string;           // denormalized for print
  quantity:     number;
  unitPrice:    number;
  discount:     number;
  taxableValue: number;
  cgst:         number;
  sgst:         number;
  lineTotal:    number;
}
```

## 13.5 Print Layout (A4 CSS)

```css
@media print {
  /* Hide navigation chrome */
  aside, header, .no-print, button, nav { display: none !important; }

  body { background: white; color: black; }

  .print-container {
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none !important;
    border: none !important;
  }

  /* A4 paper */
  @page {
    size: A4;
    margin: 15mm;
  }

  /* Prevent table rows splitting across pages */
  tr { page-break-inside: avoid; }

  /* Ensure invoice totals appear on same page */
  .invoice-totals { page-break-inside: avoid; }
}
```

---

# 14. User Flows & Workflows

## 14.1 Stock-In Workflow (Purchase Order)

```
[Staff/Manager: Create PO]
         │
         ├─ Add supplier, line items (product + qty + unitPrice)
         ├─ System calculates total
         └─ Save → Status: PENDING
                     │
                     ▼
         [Manager Review — if total > ₹50,000]
                ├─► Approve → Status: APPROVED
                └─► Reject  → Status: CANCELLED + reason
                     │
                     ▼ (Supplier ships goods)
         [Staff: Verify Physical Receipt]
                ├─ Compare PO line items vs physical delivery
                └─ Submit GRN (Goods Receipt Note)
                     │
                     ├─► PO Status: RECEIVED
                     ├─► Create STOCK_IN movement(s)
                     └─► Increment inventory.quantity per warehouse
```

## 14.2 Stock-Out Workflow (Sales Order)

```
[Sales Staff: Create Sales Order]
         │
         ├─ Add customer, line items, warehouse
         └─ Save → Status: PENDING
                     │
                     ▼
         [System: Check stock availability]
                ├─► INSUFFICIENT → Warning shown; block confirmation
                └─► SUFFICIENT → Proceed
                     │
                     ▼
         [Confirm Order]
                ├─► Status: CONFIRMED
                ├─► Deduct stock from warehouse inventory
                ├─► Auto-generate Invoice (Status: PENDING)
                └─► Start payment collection process
                     │
                     ▼
         [Warehouse: Pack & Ship]
                ├─► Status: SHIPPED
                └─► Create STOCK_OUT movement
                     │
                     ▼
         [Courier Delivers]
                └─► Status: DELIVERED
```

## 14.3 Inter-Warehouse Transfer Workflow

```
[Staff: Create Transfer Request]
         ├─ Select Product
         ├─ Select Source Warehouse (verify sufficient stock)
         ├─ Select Destination Warehouse
         └─ Specify Quantity + Notes
                     │
                     ▼ (Atomic Transaction — both fail or both succeed)
         [System Commits]
                ├─► Create TRANSFER_OUT on Source Warehouse
                ├─► Create TRANSFER_IN on Destination Warehouse
                ├─► Decrement Source inventory.quantity
                └─► Increment Destination inventory.quantity
```

## 14.4 Invoice & Payment Settlement

```
SO: CONFIRMED → Auto-generate Invoice (PENDING)
                         │
              ┌──────────┴──────────────────────────┐
              ▼                                      ▼
    [Payment Received]                     [No Payment by Due Date]
         ├─► Create Payment record              ├─► Invoice: OVERDUE
         ├─► Link transaction reference         └─► Send email reminder
         ├─► If balance = 0 → Invoice: PAID
         └─► SO: is_paid = true
```

## 14.5 AI Forecast → Reorder Workflow

```
[Nightly Cron Job: 2 AM IST]
         │
         └─► Run ForecastingService for all active products
                     │
                     ▼
         [Results stored in Redis (TTL: 24h)]
                     │
                     ▼
         [Manager visits Forecast Dashboard]
                ├─ Views 30-day demand chart (Holt-Winters output)
                ├─ Sees Reorder Suggestions list with urgency flags
                └─ Clicks "Create PO" on CRITICAL items
                     │
                     ▼
         [Auto-populated PO Draft]
                ├─ Supplier: preferred supplier
                ├─ Quantity: EOQ calculation
                └─ Manager reviews and submits → PO workflow begins
```

---

# 15. Security Requirements

## 15.1 OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|-----------|
| **A01: Broken Access Control** | Server-side RBAC on all routes; `authenticate` + `hasPermission` middleware chain |
| **A02: Cryptographic Failures** | Argon2id password hashing; JWT HMAC-SHA256; HTTPS enforced; AES-256 data at rest |
| **A03: SQL Injection** | Prisma ORM parameterizes all queries; `$queryRaw` uses tagged templates only |
| **A05: Security Misconfiguration** | Helmet.js headers; CORS whitelist; sanitized error responses in production |
| **A07: Auth Failures** | Account lockout (5 attempts → 30 min); refresh token rotation; HttpOnly cookies |
| **A08: Integrity Failures** | Webhook HMAC-SHA256 signatures; signed S3 URLs with 15-min expiry |
| **A09: Logging Failures** | Immutable audit_logs; Winston structured logging; Morgan HTTP logs |
| **A10: SSRF** | No user-controlled URL fetching; S3 access via SDK with IAM roles only |

## 15.2 HTTP Security Headers (Helmet.js)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https://your-s3-bucket.s3.amazonaws.com"],
    }
  },
  frameguard:           { action: 'deny' },           // X-Frame-Options: DENY
  hsts:                 { maxAge: 31536000 },          // Strict-Transport-Security
  noSniff:              true,                          // X-Content-Type-Options: nosniff
  referrerPolicy:       { policy: 'same-origin' },
}));
```

## 15.3 Rate Limiting Configuration

```typescript
// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict auth rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', authLimiter);
```

## 15.4 CSRF & XSS Protections

```typescript
// CSRF: Refresh tokens in SameSite=Strict cookies; access tokens in Authorization headers
// Access tokens via headers are NOT susceptible to CSRF (only cookies are)
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});

// XSS: React automatically escapes rendered strings; no dangerouslySetInnerHTML
// Body size limit prevents memory exhaustion
app.use(express.json({ limit: '10mb' }));

// Production error handler — strip stack traces
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  } else {
    res.status(err.statusCode || 500).json({ success: false, error: err.message, stack: err.stack });
  }
});
```

## 15.5 CORS Configuration

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://app.inventorypro.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
```

---

# 16. Performance Optimization

## 16.1 Database Query Optimization

```typescript
// ✅ SELECT only required fields (avoid SELECT *)
const products = await prisma.product.findMany({
  select: { id: true, name: true, sku: true, quantity: true, reorderLevel: true },
  where: { isActive: true },
  orderBy: { name: 'asc' },
  skip: (page - 1) * limit,
  take: limit,
});

// ✅ Connection pooling via DATABASE_URL
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"

// ✅ Compound WHERE clauses use indexed columns
// Ensure all filter fields have DB indexes
```

## 16.2 Cache-Aside Helpers

```typescript
// services/cache.service.ts
export class CacheService {
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached);          // Cache HIT

      const data = await fetchFn();                   // Cache MISS
      await redis.setEx(key, ttlSeconds, JSON.stringify(data));
      return data;
    } catch (redisError) {
      logger.warn('Redis unavailable, falling back to DB', { key });
      return fetchFn();                               // Graceful fallback
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(keys);
  }
}

// Usage
const dashboard = await cacheService.getOrSet(
  `kpi:dashboard:${orgId}`,
  () => analyticsService.getDashboardKPIs(orgId),
  300  // 5 minutes
);
```

## 16.3 Network Optimizations

```typescript
// Gzip compression — reduces JSON payloads by up to 70%
import compression from 'compression';
app.use(compression({ level: 6 }));

// Keep-Alive for TCP connection reuse
import http from 'http';
const server = http.createServer(app);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
```

## 16.4 Frontend Optimizations

```typescript
// Dynamic imports for heavy chart components (code splitting)
const ForecastChart = dynamic(
  () => import('@/components/charts/ForecastLineChart'),
  { ssr: false, loading: () => <LoadingSkeleton /> }
);

// Debounce search input to reduce API calls
const debouncedSearch = useDebounce(searchTerm, 300);

// Infinite scroll / virtual list for large product tables (TanStack Virtual)
// Server-side rendering for public pages (Next.js SSR)
// Static generation for documentation pages (Next.js SSG)
```

---

# 17. Logging & Auditing Strategy

## 17.1 Application Logging (Winston)

```typescript
// config/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.colorize({ all: true })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log',    level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log'              }),
  ],
});
```

### Log Level Policy
| Level | When to Use | Examples |
|-------|------------|---------|
| `error` | Operational exceptions | DB connection failure, unhandled exception |
| `warn` | Non-fatal issues | Validation failure, rate limit hit, near-expiry alert |
| `info` | Key lifecycle events | Server start, DB connected, PO approved, invoice sent |
| `debug` | Development diagnostics | Prisma query output, cache hit/miss, token decoded |

## 17.2 HTTP Request Logging (Morgan → Winston)

```typescript
// Redirect Morgan to Winston info stream
const stream = { write: (msg: string) => logger.info(msg.trim()) };
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream }));
```

## 17.3 Audit Log Schema

```typescript
interface AuditLog {
  id:        string;          // UUID
  userId:    string | null;   // Null for system/cron actions
  action:    AuditAction;     // CREATE | UPDATE | DELETE | APPROVE | RECEIVE | CANCEL | LOGIN | LOGOUT
  entity:    string;          // 'Product' | 'PurchaseOrder' | 'SalesOrder' | 'Invoice' | ...
  entityId:  string | null;   // UUID of affected record
  details:   {
    requestBody?: Record<string, unknown>;
    requestUrl?:  string;
    changes?:     { before: unknown; after: unknown };  // diff for UPDATE actions
  };
  ipAddress: string;
  timestamp: Date;
}
```

### Events Captured in Audit Log
```
Products:        Create, Update, Delete (soft), Bulk import
Warehouses:      Create, Update, Deactivate
Inventory:       Stock-In, Stock-Out, Transfer, Manual Adjustment
Purchase Orders: Create, Approve, Reject, Receive, Cancel
Sales Orders:    Create, Confirm, Ship, Deliver, Cancel, Pay
Invoices:        Create, Send Email, Mark Paid
Customers:       Create, Update, Delete
Users:           Create, Update, Role Change, Login, Logout, Failed Login
```

### Immutability Guarantee
Audit logs are INSERT-ONLY. The Prisma schema marks the model with no `update` or `delete` operations. A PostgreSQL trigger adds an extra layer of protection:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_mutations()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. INSERT only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutations();
```

---

# 18. Deployment & Infrastructure

## 18.1 Docker Services (docker-compose.yml)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB:       inventorypro
      POSTGRES_USER:     ipro_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ipro_user"]
      interval: 10s

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports: ["6379:6379"]

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    environment:
      DATABASE_URL:    postgresql://ipro_user:${POSTGRES_PASSWORD}@postgres:5432/inventorypro
      REDIS_URL:       redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET:      ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      AWS_S3_BUCKET:   ${AWS_S3_BUCKET}
      NODE_ENV:        production
    ports: ["4000:4000"]
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_started }

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:4000
    ports: ["3000:3000"]
    depends_on: [backend]

volumes:
  postgres_data:
  redis_data:
```

## 18.2 Nginx Reverse Proxy (Production)

```nginx
server {
    listen 80;
    server_name app.inventorypro.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.inventorypro.com;

    ssl_certificate     /etc/letsencrypt/live/app.inventorypro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.inventorypro.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend (Express API)
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

## 18.3 AWS Production Architecture

```
Internet
    │
    ▼
AWS CloudFront (CDN)
    │
    ▼
AWS Application Load Balancer (ALB)
    │
    ├──► AWS ECS Fargate (Frontend containers — port 3000)
    │        └─ Auto-scaling: min 2, max 8 tasks
    │
    └──► AWS ECS Fargate (Backend containers — port 4000)
             │  └─ Auto-scaling: min 2, max 10 tasks
             │
             ├──► AWS RDS PostgreSQL 16 (Multi-AZ)
             │        └─ Read replica for analytics queries
             │
             ├──► AWS ElastiCache Redis 7 (cluster mode)
             │
             └──► AWS S3 (product images, invoice PDFs)
                       └─ CloudFront distribution for CDN delivery
```

## 18.4 Environment Variables

```bash
# Backend .env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://user:pass@rds-host:5432/inventorypro?connection_limit=20"
REDIS_URL="redis://:password@elasticache-host:6379"
JWT_SECRET="your-256-bit-jwt-secret-here"
JWT_REFRESH_SECRET="your-256-bit-refresh-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-south-1"
AWS_S3_BUCKET="inventorypro-assets"
SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SMTP_PORT=465
SMTP_USER="..."
SMTP_PASS="..."
EMAIL_FROM="noreply@inventorypro.com"
CORS_ORIGINS="https://app.inventorypro.com"
LOG_LEVEL="info"

# Frontend .env.local
NEXT_PUBLIC_API_URL="https://app.inventorypro.com/api"
```

## 18.5 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml — runs on every PR
name: CI
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend  && npm ci && npm run type-check && npm run lint && npm test
      - run: cd frontend && npm ci && npm run type-check && npm run lint && npm run build

# .github/workflows/deploy.yml — runs on merge to main
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & push Docker images to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -t $ECR_REGISTRY/inventorypro-backend:${{ github.sha }} ./backend
          docker build -t $ECR_REGISTRY/inventorypro-frontend:${{ github.sha }} ./frontend
          docker push $ECR_REGISTRY/inventorypro-backend:${{ github.sha }}
          docker push $ECR_REGISTRY/inventorypro-frontend:${{ github.sha }}
      - name: Update ECS services
        run: |
          aws ecs update-service --cluster inventorypro-prod --service backend --force-new-deployment
          aws ecs update-service --cluster inventorypro-prod --service frontend --force-new-deployment
```

---

# 19. Coding Guidelines

## 19.1 General Principles

| Principle | Rule |
|-----------|------|
| **TypeScript First** | Strict mode enabled; no `any` unless absolutely necessary |
| **Separation of Concerns** | Controllers = HTTP; Services = Business logic; never mix |
| **Single Source of Truth** | Prisma schema drives all TypeScript types |
| **Error Propagation** | All errors passed via `next(error)` — never swallow silently |
| **Environment Safety** | All env vars validated with Zod schema on startup |

## 19.2 Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Folders | lowercase-dash | `purchase-orders/`, `audit-logs/` |
| Backend files | `name.role.ts` | `auth.service.ts`, `products.controller.ts` |
| Frontend components | PascalCase | `DataTable.tsx`, `StatCard.tsx` |
| TypeScript interfaces | PascalCase, no `I` prefix | `Product`, `SalesOrder` |
| Database fields | `snake_case` | `order_number`, `created_at` |
| API routes | `/kebab-case` | `/purchase-orders`, `/stock-in` |
| Constants | `UPPER_SNAKE_CASE` | `HTTP_METHOD_TO_ACTION` |
| React hooks | `use` prefix | `useDebounce`, `useAuth` |

## 19.3 ESM Import Rules (Backend)

```typescript
// ✅ CORRECT — explicit .js extension for local TypeScript files
import { authenticate } from '../middlewares/authenticate.middleware.js';
import { ProductService } from '../services/products.service.js';

// ✅ CORRECT — package imports by name
import express from 'express';
import { PrismaClient } from '@prisma/client';

// ❌ WRONG — missing .js extension
import { authenticate } from '../middlewares/authenticate.middleware';
```

## 19.4 Error Handling Pattern

```typescript
// ✅ Controller pattern
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);  // Always forward to global error handler
  }
};

// ✅ Business logic error — throw AppError
export class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}

// Usage in services:
if (inventory.quantity < requestedQty) {
  throw new AppError('Insufficient inventory stock level.', 400);
}

// ✅ Global error handler (app.ts)
app.use((err: AppError | Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message    = err instanceof AppError ? err.message : 'Internal server error';
  logger.error(err.message, { stack: err.stack, url: req.originalUrl });
  res.status(statusCode).json({ success: false, error: message });
});
```

## 19.5 Prisma Transaction Pattern

```typescript
// ✅ Use Prisma transactions for multi-step mutations (e.g., stock transfer)
export async function transferStock(
  productId: string,
  fromWarehouseId: string,
  toWarehouseId: string,
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify source stock
    const source = await tx.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } }
    });
    if (!source || source.quantity < quantity) {
      throw new AppError('Insufficient stock for transfer.', 400);
    }

    // 2. Decrement source
    await tx.inventory.update({
      where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
      data: { quantity: { decrement: quantity } }
    });

    // 3. Increment destination (upsert in case no record exists yet)
    await tx.inventory.upsert({
      where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
      update: { quantity: { increment: quantity } },
      create: { productId, warehouseId: toWarehouseId, quantity }
    });

    // 4. Log both movements
    await tx.inventoryMovement.createMany({
      data: [
        { productId, warehouseId: fromWarehouseId, movementType: 'TRANSFER_OUT', quantity: -quantity },
        { productId, warehouseId: toWarehouseId,   movementType: 'TRANSFER_IN',  quantity: +quantity }
      ]
    });
  });
}
```

## 19.6 Zod Validation Schema Example

```typescript
// validators/purchase-order.validator.ts
import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  items: z.array(z.object({
    productId:  z.string().uuid(),
    quantity:   z.number().int().positive('Quantity must be a positive integer'),
    unitPrice:  z.number().positive('Unit price must be positive'),
  })).min(1, 'At least one item is required'),
  notes: z.string().max(500).optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
```

---

# 20. Error Codes & Troubleshooting

## 20.1 Common Error Scenarios

| Scenario | Error Code | HTTP | Resolution |
|----------|-----------|------|-----------|
| Wrong credentials | INVALID_CREDENTIALS | 401 | Check email/password |
| Token expired | TOKEN_EXPIRED | 401 | Frontend should auto-refresh |
| No refresh token | UNAUTHORIZED | 401 | Re-login required |
| RBAC permission missing | FORBIDDEN | 403 | Admin must grant permission |
| Product SKU duplicate | DUPLICATE_SKU | 409 | Use unique SKU |
| Stock below request | INSUFFICIENT_STOCK | 400 | Check warehouse stock levels |
| PO above ₹50K unapproved | APPROVAL_REQUIRED | 409 | Manager must approve |
| PO already received | INVALID_TRANSITION | 422 | PO is terminal at RECEIVED |
| Received SO cancellation | INVALID_TRANSITION | 422 | Cannot cancel SHIPPED order |
| Redis down | — | — | System falls back to DB; log error |
| Prisma connection error | — | 500 | Check DATABASE_URL and DB status |

## 20.2 Monitoring & Health

```bash
# Health check endpoint
GET /api/health
→ { "status": "ok", "db": "connected", "cache": "connected", "uptime": 12394 }

# Database check
psql $DATABASE_URL -c "SELECT count(*) FROM products;"

# Redis check
redis-cli -u $REDIS_URL ping   # → PONG

# Container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Backend logs
docker logs inventorypro-backend --tail 100 --follow

# PostgreSQL slow query log
SET log_min_duration_statement = 200;   # Log queries > 200ms
```

## 20.3 Database Maintenance

```sql
-- Vacuum and analyze tables after bulk imports
VACUUM ANALYZE products;
VACUUM ANALYZE inventory_movements;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC
LIMIT 20;

-- Find slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT relname AS table, pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

> **Document Version:** 2.0.0  
> **Maintained By:** InventoryPro Architecture Team  
> **Review Cycle:** Quarterly  
> **Last Updated:** May 2026  
>
> *This document represents the complete, canonical specification for the InventoryPro system. All implementation decisions should reference this document. Conflicts between this document and code should be resolved by updating this document first, then the code.*
