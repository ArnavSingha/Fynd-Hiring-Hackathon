# Mini Checkout & Automated Browser Test Suite

A lightweight, fully responsive, and accessible single-page checkout application built with **React.js** and covered by an automated end-to-end browser test suite using **Playwright**.

---

## 📌 Project Overview

This repository provides an online store checkout flow adhering to strict reliability, defensive input handling, responsive design standards, and idempotency guarantees. It requires no backend, database, or external payment gateways.

### Key Features
1. **Synthetic Product Catalog**:
   - **Ergonomic Mechanical Keyboard**: Fixed Price **$85.00**
   - **Precision Wireless Mouse**: Fixed Price **$35.00**
2. **Real-Time Shopping Cart**:
   - Add/remove items dynamically.
   - Adjust quantities via numerical inputs or `+` / `−` buttons.
   - Dynamic real-time calculation of line totals (`price × quantity`) and grand order totals.
3. **Defensive Validation & Input Preservation**:
   - **Required Field**: Full Name is strictly enforced (rejects empty or whitespace-only entries).
   - **Empty Cart Guard**: Prevents zero-dollar checkout when all items are removed.
   - **Input Preservation**: Preserves entered customer details (email, names) and cart state upon validation errors—no data is lost.
4. **Idempotent Order Placement (Double-Click Protection)**:
   - Prevents duplicate order placement or multiple confirmation dialogs when a customer rapidly double-clicks the "Place Order" button.
   - Synchronous locking (`isSubmitting`) immediately disables the button and guards submission logic.
5. **Clear Confirmation Screen**:
   - Generates a unique order reference (e.g., `ORD-729401`).
   - Displays customer name, itemized summary with quantities and line totals, and grand total paid.
   - Includes a "Start New Order" action to reset the checkout to a clean state.
6. **Fully Responsive Across All Screen Sizes**:
   - Mobile phones (320px – 480px) with touch-friendly tap targets ($\ge 44px$) and zero horizontal scroll.
   - Tablets (481px – 880px) with fluid multi-column product grids.
   - Desktops (880px+) with an e-commerce sticky cart summary.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `pnpm`

### 1. Installation
Install project dependencies (including Playwright):

```bash
npm install
# or
pnpm install
```

### 2. Run the Application Locally
To start the built-in, zero-dependency local static server:

```bash
npm start
# or
pnpm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

> **Developer Mode**: To run Vite with hot-module replacement (HMR), use `npm run dev` or `pnpm dev`.

---

## 🧪 Automated Browser Test Suite

The test suite is written with [Playwright](https://playwright.dev/) (`@playwright/test`) and uses web-first assertions (e.g. `expect(locator).toBeVisible()`) rather than brittle fixed sleeps.

### Run Tests in Headless Mode
```bash
npm test
# or
pnpm test
```

### Run Tests in Headed Mode (Watch Browser Interactions)
```bash
npm run test:headed
# or
pnpm test:headed
```

### Run Tests in Playwright Interactive UI Mode
```bash
npm run test:ui
# or
pnpm test:ui
```

---

## 📋 Automated Checks Overview

Each check starts in an isolated, clean state via Playwright's `beforeEach` hook:

| Check | Objective | Assertions |
|---|---|---|
| **Check 1: Successful Checkout** | Customer enters valid name and submits order. | `#order-confirmation` is visible; customer name is displayed; unique reference matches `/^ORD-\d{6}$/`; total matches cart total; form is hidden. |
| **Check 2: Missing Field Blocked** | Customer submits order with blank name. | Checkout is blocked (`#order-confirmation` not visible); alert shows *"Full name is required to complete your order."*; entered email and cart remain preserved. |
| **Check 3: Quantity & Total Precision** | User updates quantities and adds new products. | Keyboard line total updates to `$170.00`; adding Mouse adds `$35.00` line total; order total updates to exact sum `$205.00`; decrementing recalculates accurately to `$120.00`. |
| **Check 4: Empty Cart Blocked** | User empties cart and clicks "Place Order". | Checkout blocked; alert shows *"Your cart is empty. Please add items before checking out."*; customer name is preserved. |
| **Check 5: Rapid Double-Click Protection** | User double-clicks "Place Order" button in rapid succession. | Exactly one confirmation card and reference code are rendered; internal submission count is exactly 1. |
| **Check 6: Mobile Responsiveness** | Verified on iPhone SE / 375x667 mobile viewport. | Asserts `scrollWidth <= innerWidth` (zero horizontal overflow); full touch checkout cycle functions seamlessly. |
| **Check 7: Tablet Responsiveness** | Verified on iPad / 768x1024 tablet viewport. | Asserts layout adapts cleanly with two-column catalog and zero overflow. |
| **Check 8: Cart Usability & Emptying** | Verified emptying cart via `−` decrement or "Empty Cart" button. | Asserts item removal upon reducing quantity to 0 or clicking header "Empty Cart"; displays empty cart state and updates total to `$0.00`. |

---

## 📖 Test Plan & Manual Test Results

For the complete risk matrix, manual test steps (empty cart, rapid double-click, numeric input), and defect logs (including DEF-03), please refer to:
👉 **[TEST_PLAN.md](TEST_PLAN.md)**

---

## 📁 Repository Structure

```
├── dist/                    # Production build generated by Vite
├── src/
│   ├── App.jsx              # Main React checkout component & state management
│   ├── App.css              # Responsive, accessible, mobile-first CSS styling
│   └── main.jsx             # React DOM entry point
├── tests/
│   └── checkout.spec.js     # 8 automated Playwright browser tests
├── index.html               # Main HTML entry point
├── package.json             # NPM package scripts and dependencies
├── playwright.config.js     # Playwright test configuration
├── server.js                # Lightweight zero-dependency static HTTP server
├── TEST_PLAN.md             # Prioritized test plan, manual tests & defect analysis
└── README.md                # Project documentation and guide
```
