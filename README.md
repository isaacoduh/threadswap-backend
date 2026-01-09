# ThreadSwap - P2P Fashion Marketplace

> A peer-to-peer fashion marketplace built with NodeJs/Typescript backend and Next.js 14 frontend

## Table of Cotnents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Goals](#project-goals)
- [Architecture](#architecture)
- [Development Roadmap](#development-roadmap)
- [Setup Guide](#setup-guide)
- [Epic Breakdown](#epic-breakdown)
- [Timeline & Milestones](#timeline--milestones)
- [Success Metrics](#success-metrics)

---

## 🎯 Project Overview

**ThreadSwap** is a peer to peer fashion marketplace that enables users to buy, sell, and trade preloved clothing items.
The platform focuses on secure transactions, real-time messaging, and seamless payment processing.

### Core Features

- **User Authentication** - JWT-based auth with email verification.
- **Listing Management** - Create, edit, and browse fashion listings with image uploads
- **Search & Discovery** - Filter by category, size, brand, price, condition
- **Real-time Messaging** - Socket.io powered chat between buyers and sellers.
- **Offer System** - Make and negotiate offers on listings
- **Secure Payments** - Stripe connect integration with escrow
- **Shipping Integration** - Third party api (e.g. shippo) for label generation
- **Reviews & Ratings** - Build trust with verified purchase reviews.
- **User Profiles** - Track sales, purchases and ratings.

### Target Metrics

- **Week 1**: 100 Daily Active Users (DAU)
- **Week 4**: 500 DAU
- **Week 12**: 2000 DAU
- **Platform Fee**: 8% per transaction

---

## 🛠 Tech Stack

### Backend (Node.js + Typescript)

```
- Runtime: Node.js 20+ LTS
- Language: Typescript (strict mode)
- Database: PostgreSQL
- ORM: Prisma (recommended) or TypeORM
- Authentication: JWT (jsonwebtoken + bcrypt)
- Real-time: Socket.io
- Job Queue: Bull/BullMQ + Redis
- File Storage: AWS S3 (@aws-sdk/client-s3)
- Validation: Zod
- Logging: Winston or Pino
- Testing: Jest + Supertest
```

### Frontend (Next.js 14 + Typescript)

```
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- State Management: Zustand + React Query
- Styling: Tailwind CSS
- Forms: React Hook Form + Zod
- Real-time: Socket.io Client
- HTTP Client: Axios
- Testing: Jest + React Testing Library
```

### Infrastructure

```
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions
- Hosting: AWS (EC2/ECS) or Railway/Render
- CDN: CloudFront or Vercel
- Monitoring: Sentry
- Payments: Stripe Connect
- Shipping: Shippo API
```

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Next.js 14    │ ◄─────► │   Node.js API   │
│   (Frontend)    │  REST   │   (Express +    │
│                 │  WebSocket  TypeScript)   │
└─────────────────┘         └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │ PostgreSQL  │ │    Redis    │ │   AWS S3    │
            │  Database   │ │   Cache +   │ │   Images    │
            │             │ │   Jobs      │ │             │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │
                    ▼
            ┌─────────────┐
            │   Stripe    │
            │   Connect   │
            └─────────────┘
```

### Database Schema (Key Tables)

```
users
├── id (uuid)
├── email (unique)
├── password_hash
├── full_name
├── avatar_url
├── stripe_account_id
├── created_at
└── updated_at

listings
├── id (uuid)
├── seller_id (FK → users)
├── title
├── description
├── price
├── category
├── size
├── brand
├── condition
├── status (active, sold, archived)
├── images (json array)
└── created_at

messages
├── id (uuid)
├── conversation_id (FK)
├── sender_id (FK → users)
├── content
├── read_at
└── created_at

transactions
├── id (uuid)
├── listing_id (FK)
├── buyer_id (FK → users)
├── seller_id (FK → users)
├── amount
├── platform_fee
├── stripe_payment_intent_id
├── stripe_transfer_id
├── status (pending, escrow, completed, refunded)
└── created_at

reviews
├── id (uuid)
├── transaction_id (FK)
├── reviewer_id (FK → users)
├── reviewee_id (FK → users)
├── rating (1-5)
├── comment
└── created_at
```

---

## 🗺 Development Roadmap

### Phase 1: Foundation (Weeks 1-4)

- ✅ Project setup and infrastructure
- ✅ Database schema and models
- ✅ Authentication system
- ✅ Basic listing CRUD operations

### Phase 2: Core Features (Weeks 5-8)

- ✅ Search and filtering
- ✅ Real-time messaging system
- ✅ Offer and negotiation flow
- ✅ Image upload and management

### Phase 3: Payments & Transactions (Weeks 9-11)

- ✅ Stripe Connect integration
- ✅ Escrow payment flow
- ✅ Shipping label generation
- ✅ Order tracking

### Phase 4: Trust & Safety (Weeks 12-13)

- ✅ Review and rating system
- ✅ User verification
- ✅ Content moderation
- ✅ Dispute resolution

### Phase 5: Polish & Launch (Weeks 14-16)

- ✅ UI/UX refinements
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Testing and QA
- ✅ Launch preparation
- ✅ Post-launch monitoring

---

## 🚀 Setup Guide

### Prerequisites

```bash
- Node.js 20+ LTS
- PostgreSQL 14+
- Redis 7+
- AWS Account (for S3)
- Stripe Account
- Shippo Account
- Git
```

### Local Development Setup

#### 1. Clone Repository

```bash
git clone https://github.com/#####/threadswap.git
cd threadswap
```

#### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Configure .env with:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET
# - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
# - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
# - SHIPPO_API_KEY
# - REDIS_URL
# - NODE_ENV=development

# Run database migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

#### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.local.example .env.local

# Configure .env.local with:
# - NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# - NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Start development server
npm run dev
```

#### 4. Docker Setup (Alternative)

```bash
# From project root
docker-compose up -d

# This will start:
# - Node.js API (port 4000)
# - Next.js Frontend (port 3000)
# - PostgreSQL (port 5432)
# - Redis (port 6379)
```

### Testing Setup

```bash
# Backend tests
cd backend
npm run test
npm run test:watch
npm run test:coverage

# Frontend tests
cd frontend
npm run test
npm run test:watch
npm run test:coverage
```

---

## 📦 Epic Breakdown

### EPIC 1: Project Setup & Infrastructure (Week 1)

**Backend:**

- Initialize Node.js + TypeScript project
- Configure PostgreSQL database
- Set up Express server with middleware
- Configure JWT authentication
- Set up Redis for caching/sessions
- Configure AWS S3 for image storage
- Set up Socket.io for WebSockets
- Configure Bull/BullMQ for job processing
- Set up logging and error handling

**Frontend:**

- Initialize Next.js 14 with TypeScript
- Configure Tailwind CSS
- Set up React Query + Zustand
- Create base layout components
- Configure form validation (React Hook Form + Zod)
- Set up Socket.io client

**DevOps:**

- Docker and Docker Compose setup
- CI/CD pipeline (GitHub Actions)
- Database migration strategy
- Health check endpoints

**Deliverables:**

- Working dev environment
- Docker containers running
- Basic API responding to health checks
- Frontend accessible at localhost:3000

---

### EPIC 2: Database Schema & Models (Week 1-2)

**Tasks:**

- Design complete database schema
- Create Prisma schema or TypeORM entities
- Implement User model with password hashing
- Implement Listing model with image URLs
- Implement Message/Conversation models
- Implement Transaction model
- Implement Review model
- Create database indexes for performance
- Write database seed scripts
- Document schema with ER diagrams

**Deliverables:**

- Complete database schema
- All models with TypeScript types
- Migration files
- Seed data for testing

---

### EPIC 3: Authentication System (Week 2)

**Backend:**

- User registration endpoint with email validation
- Login endpoint with JWT generation
- Password reset flow (email + token)
- Email verification system
- JWT refresh token mechanism
- Protected route middleware
- Rate limiting on auth endpoints

**Frontend:**

- Registration form with validation
- Login form
- Password reset flow
- Email verification UI
- Auth context/state management
- Protected route wrapper
- Auto-redirect on auth status

**Deliverables:**

- Complete auth system
- Working registration/login flow
- Password reset functionality
- Protected routes

---

### EPIC 4: Listing Management (Week 3-4)

**Backend:**

- Create listing endpoint with image upload
- Update listing endpoint
- Delete listing endpoint
- Get single listing endpoint
- Get user's listings endpoint
- Image processing and optimization
- S3 upload utilities
- Listing status management

**Frontend:**

- Create listing form (multi-step)
- Image upload component with preview
- Listing detail page
- Edit listing page
- User's listings dashboard
- Delete confirmation modal
- Image gallery component
- Draft saving functionality

**Deliverables:**

- Full listing CRUD functionality
- Image upload working with S3
- Responsive listing cards
- Listing management dashboard

---

### EPIC 5: Search & Discovery (Week 4-5)

**Backend:**

- Search endpoint with filters (category, size, brand, price, condition)
- Pagination and sorting
- Full-text search on title/description
- Featured listings endpoint
- Recently added endpoint
- Database indexes for search performance

**Frontend:**

- Search bar with autocomplete
- Filter sidebar (category, size, brand, price range, condition)
- Sort options (newest, price low-high, price high-low)
- Infinite scroll or pagination
- Search results grid
- No results state
- Loading skeletons

**Deliverables:**

- Fast search functionality
- Comprehensive filtering
- Responsive results grid
- Good UX for browsing

---

### EPIC 6: Real-time Messaging (Week 5-6)

**Backend:**

- Socket.io server setup with authentication
- Create conversation endpoint
- Send message endpoint (REST fallback)
- Get conversation history endpoint
- Mark messages as read endpoint
- Online status tracking
- Typing indicators
- Message notifications

**Frontend:**

- Chat interface component
- Conversation list
- Message bubbles with timestamps
- Real-time message updates
- Typing indicators
- Unread message badges
- Message input with send button
- Mobile-responsive chat UI

**Deliverables:**

- Working real-time chat
- Conversation history
- Read receipts
- Online status indicators

---

### EPIC 7: Offer & Negotiation System (Week 6-7)

**Backend:**

- Create offer endpoint
- Accept/reject offer endpoint
- Counter-offer endpoint
- Get offers for listing endpoint
- Get user's offers (sent/received) endpoint
- Offer expiration logic
- Offer notifications

**Frontend:**

- Make offer modal
- Offer list view
- Accept/reject/counter offer UI
- Offer status badges
- Offer history on listing page
- Notification for new offers

**Deliverables:**

- Complete offer flow
- Negotiation interface
- Offer status tracking

---

### EPIC 8: Payment System (Stripe Connect) (Week 7-9)

**Backend:**

- Stripe Connect onboarding flow
- Create payment intent endpoint
- Webhook handler for payment events
- Escrow payment flow
- Transfer to seller after confirmation
- Refund handling
- Platform fee calculation (8%)
- Payout management

**Frontend:**

- Stripe Connect onboarding UI
- Payment form with Stripe Elements
- Order confirmation page
- Payment status tracking
- Payout dashboard for sellers
- Transaction history

**Deliverables:**

- Stripe Connect fully integrated
- Secure payment processing
- Escrow system working
- Platform fee deducted correctly

---

### EPIC 9: Shipping Integration (Week 9-10)

**Backend:**

- Shippo API integration
- Create shipping label endpoint
- Get shipping rates endpoint
- Track shipment endpoint
- Webhook for tracking updates
- Shipping address validation

**Frontend:**

- Shipping address form
- Shipping options selector
- Label download/print
- Tracking number display
- Shipment status updates
- Shipping cost calculator

**Deliverables:**

- Shippo integration complete
- Label generation working
- Tracking updates in real-time

---

### EPIC 10: Reviews & Ratings (Week 10-11)

**Backend:**

- Create review endpoint (after purchase)
- Get reviews for user endpoint
- Get reviews for transaction endpoint
- Calculate average rating
- Review moderation
- Prevent duplicate reviews

**Frontend:**

- Review form modal
- Star rating component
- Review display on profiles
- Review list with pagination
- Report review functionality

**Deliverables:**

- Working review system
- Ratings visible on profiles
- Review moderation tools

---

### EPIC 11: User Profiles (Week 11-12)

**Backend:**

- Get user profile endpoint
- Update profile endpoint
- Upload avatar endpoint
- Get user's listings endpoint
- Get user's reviews endpoint
- User statistics (sales, purchases, rating)

**Frontend:**

- Public profile page
- Edit profile page
- Avatar upload component
- User statistics display
- Listings grid on profile
- Reviews display on profile
- Follow/favorite users (optional)

**Deliverables:**

- Complete profile system
- Profile editing
- User statistics

---

### EPIC 12: Notifications (Week 12)

**Backend:**

- Notification model and endpoints
- Email notification service
- In-app notification system
- WebSocket notifications
- Notification preferences
- Notification templates

**Frontend:**

- Notification bell icon with badge
- Notification dropdown
- Notification preferences page
- Mark as read functionality
- Email notification settings

**Deliverables:**

- Real-time notifications
- Email notifications
- Notification center

---

### EPIC 13: Admin & Moderation (Week 13)

**Backend:**

- Admin authentication
- User management endpoints
- Listing moderation endpoints
- Report handling system
- Analytics dashboard endpoints
- Ban/suspend user functionality

**Frontend:**

- Admin dashboard
- User management interface
- Listing moderation queue
- Reports management
- Analytics charts
- Moderation actions

**Deliverables:**

- Admin dashboard
- Content moderation tools
- User management

---

### EPIC 14: UI/UX Polish (Week 14)

**Frontend:**

- Consistent design system
- Smooth animations and transitions
- Loading states and skeletons
- Empty states with illustrations
- Error boundaries
- Toast notifications
- Mobile responsiveness
- Accessibility improvements
- Performance optimization

**Deliverables:**

- Polished UI/UX
- Smooth interactions
- Mobile-friendly
- Accessible

---

### EPIC 15: Security Hardening (Week 14-15)

**Backend:**

- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Helmet.js configuration
- Security headers
- Penetration testing

**Frontend:**

- Content Security Policy
- XSS protection
- Secure cookie handling
- Input sanitization
- HTTPS enforcement

**Deliverables:**

- Security audit passed
- All vulnerabilities patched
- Security best practices implemented

---

### EPIC 16: Testing & QA (Week 15)

**Backend:**

- Unit tests (>80% coverage)
- Integration tests
- API endpoint tests
- Database query tests
- Authentication tests
- Payment flow tests

**Frontend:**

- Component tests
- Integration tests
- E2E tests (Playwright/Cypress)
- Accessibility tests
- Cross-browser testing

**Deliverables:**

- > 80% test coverage
- E2E tests passing
- Bug-free critical paths

---

### EPIC 17: Launch Preparation (Week 16)

**Tasks:**

- Production environment setup
- Database migration to production
- SSL certificate setup
- CDN configuration
- Monitoring and logging setup
- Backup strategy implementation
- Load testing
- Performance optimization
- Documentation (API docs, user guide)
- Launch checklist

**Deliverables:**

- Production environment ready
- All services deployed
- Monitoring in place
- Documentation complete

---

### EPIC 18: Post-Launch Iteration (Week 17+)

**Tasks:**

- Monitor user feedback
- Track analytics and metrics
- Bug fixes and hotfixes
- Performance optimization
- Feature requests prioritization
- A/B testing
- Marketing integrations
- User retention strategies

**Deliverables:**

- Stable production app
- Metrics tracking
- Continuous improvement

---

## 📅 Timeline & Milestones

### Week 1-2: Foundation

- ✅ Project setup complete
- ✅ Database schema implemented
- ✅ Authentication working

### Week 3-4: Core Features

- ✅ Listings CRUD complete
- ✅ Search and filtering working

### Week 5-6: Communication

- ✅ Real-time messaging live
- ✅ Offer system complete

### Week 7-9: Payments

- ✅ Stripe integration complete
- ✅ Payment flow tested

### Week 10-11: Trust Systems

- ✅ Reviews and ratings live
- ✅ User profiles complete

### Week 12-13: Administration

- ✅ Notifications working
- ✅ Admin dashboard live

### Week 14-15: Launch Prep

- ✅ UI polished
- ✅ Security hardened
- ✅ Testing complete

### Week 16: Launch

- ✅ Production deployment
- ✅ Monitoring active
- ✅ Launch announcement

---

## 📊 Success Metrics

### User Metrics

- **DAU (Daily Active Users)**
  - Week 1: 100
  - Week 4: 500
  - Week 12: 2,000

- **MAU (Monthly Active Users)**
  - Month 1: 500
  - Month 3: 5,000

### Transaction Metrics

- **GMV (Gross Merchandise Value)**: Track total transaction volume
- **Average Order Value**: Target £30-50
- **Conversion Rate**: 5-10% (visitors → buyers)

### Platform Health

- **Response Time**: <200ms (p95)
- **Uptime**: 99.9%
- **Error Rate**: <0.1%

### Business Metrics

- **Platform Fee Revenue**: 8% of GMV
- **User Retention**: 30-day retention >40%
- **Time to First Transaction**: <7 days

---

## 🔗 Important Links

### Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### External Services

- [Stripe Dashboard](https://dashboard.stripe.com)
- [AWS Console](https://console.aws.amazon.com)
- [Shippo Dashboard](https://goshippo.com)
- [Sentry Dashboard](https://sentry.io)

### Development

- [GitHub Repository](https://github.com/yourusername/threadswap)
- [Trello Board](https://trello.com/your-board)
- [Figma Designs](https://figma.com/your-designs)

---

## 👥 Team

**Isaac** - Full Stack Developer

- Backend: Node.js/TypeScript, Express, PostgreSQL
- Frontend: Next.js 14, TypeScript, React
- DevOps: Docker, AWS, CI/CD

---

## 📝 License

MIT License - feel free to use this project as a portfolio piece or learning resource.

---
