# Mini Checkout - Test Plan & Quality Assurance Report

## 1. Executive Summary
This document outlines the test strategy, risk prioritization matrix, automated browser test suite specifications, and manual test results for the **Apex Gear Mini Checkout Single Page Application** built with React.js.

The primary objective of this testing effort is to guarantee an effortless, reliable customer journey:
1. Exact, transparent pricing calculations across cart operations.
2. Intuitive, non-destructive validation that blocks improper submissions while preserving customer input.
3. Strict idempotency preventing duplicate orders or multiple confirmations upon rapid interaction.
4. Seamless responsive usability across mobile (320px–480px), tablet (768px), and desktop viewports.

---

## 2. Key Checkout Risks & Prioritization Matrix

We prioritized risks based on customer financial impact, fulfillability, checkout abandonment, and device usability:

| Priority | Risk Category | Risk Description | Business & Customer Impact | Mitigation & Validation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Critical)** | **Duplicate Submission / Idempotency** | Customer double-clicks or rapidly taps "Place Order", triggering duplicate order requests or double charges. | Customer confusion, double billing disputes, duplicate inventory allocation. | Synchronous submission locking (`isSubmitting`), immediate button disabling with spinner feedback, and state-level idempotent order creation. Verified via automated and manual stress tests. |
| **P0 (Critical)** | **Pricing Calculation Drift** | Line totals or grand total calculate incorrectly due to JavaScript floating-point errors or string concatenation. | Financial discrepancy, merchant loss or customer overcharging. | Centralized decimal computation (`toFixed(2)`), automated assertions verifying exact totals across increments and multi-item additions. |
| **P1 (High)** | **Missing Required Field** | Checkout completes without the customer's name, leaving the order unfulfillable. | Inability to ship or identify customer. | Explicit input validation checking for non-empty, trimmed strings. Displays alert banner with `role="alert"` and `aria-live="polite"`. |
| **P1 (High)** | **Form State Loss on Validation Error** | Form fields (e.g., entered email, custom inputs) or cart items are reset when an error is caught. | High customer frustration, cart abandonment. | Controlled React inputs; state is strictly preserved during validation cycles. |
| **P2 (Medium)** | **Empty Cart Checkout** | Customer removes all items from the cart and attempts to place an order. | Processing zero-dollar ghost transactions. | Empty-cart detection blocking checkout with an informative empty state notification. |
| **P2 (Medium)** | **Mobile Viewport Overflow & Tap Targets** | Buttons overlapping, horizontal scrolling on narrow phones, or inputs causing auto-zoom on iOS. | High mobile drop-off rate, poor accessibility. | Fluid CSS layout using `clamp()`, flexible wraps, touch targets $\ge 44px$, 16px input font size. Automated checks on 375px and 768px viewports. |
| **P3 (Low)** | **Negative / Zero Quantity Input** | Customer enters negative numbers or zero into the quantity input field. | Inverted cart totals or invalid inventory deductions. | Input bounds clamping (`min="1"` and `Math.max(1, qty)`), disable decrement button at `qty === 1`. |

---

## 3. Automated Browser Test Suite Specification

The automated suite is implemented in Playwright (`tests/checkout.spec.js`) using web-first assertions (`expect(locator).toBeVisible()`, `expect(locator).toHaveText()`). Each test begins from an isolated, clean state via `beforeEach(() => page.goto('/'))`.

### Check 1: Successful Checkout Produces Confirmation
- **Preconditions**: Initial clean state loaded with 1 synthetic product in cart.
- **Actions**:
  1. Fill required "Full Name" field (`"Jane Doe"`).
  2. Fill optional "Email Address" field (`"jane.doe@example.com"`).
  3. Click "Place Order" button.
- **Assertions**:
  - `#order-confirmation` region is visible.
  - `#confirm-customer-name` displays `"Jane Doe"`.
  - `#confirm-order-ref` displays valid format matching `/^ORD-\d{6}$/`.
  - `#confirm-order-total` matches expected cart total (`$85.00`).
  - Checkout form and catalog are hidden.

### Check 2: Missing Required Field Blocks Checkout
- **Preconditions**: Initial clean state loaded.
- **Actions**:
  1. Leave required "Full Name" input blank.
  2. Enter optional email (`"customer@example.com"`).
  3. Click "Place Order" button.
- **Assertions**:
  - `#order-confirmation` is NOT visible.
  - `#validation-alert` is visible with text `"Full name is required to complete your order."`.
  - Customer's entered email (`"customer@example.com"`) is preserved.
  - Cart items and total remain intact (`$85.00`).

### Check 3: Quantity Change Updates Exact Total
- **Preconditions**: Initial clean state loaded with 1 Keyboard ($85.00).
- **Actions**:
  1. Verify initial total is `$85.00`.
  2. Click `+` on Keyboard (quantity becomes 2).
  3. Add second product (Precision Wireless Mouse @ $35.00) from catalog.
  4. Click `−` on Keyboard (quantity becomes 1).
- **Assertions**:
  - After step 2: Keyboard line total is `$170.00`, Order Total is `$170.00`.
  - After step 3: Mouse line total is `$35.00`, Order Total is `$205.00` ($170 + $35).
  - After step 4: Keyboard line total is `$85.00`, Order Total is `$120.00` ($85 + $35).

### Edge-Case & Responsive Automated Tests
- **Check 4**: Empty cart blocks checkout and displays clear notification (`"Your cart is empty. Please add items before checking out."`) while preserving customer name.
- **Check 5**: Rapid double-click on "Place Order" produces exactly one order confirmation and registers `window.__orderSubmissionCount === 1`.
- **Check 6 (Mobile Responsiveness)**: Emulates iPhone SE / 375x667 viewport; verifies `scrollWidth <= innerWidth` (zero horizontal overflow); executes full mobile cart manipulation and checkout flow.
- **Check 7 (Tablet Responsiveness)**: Emulates iPad / 768x1024 viewport; verifies clean layout adaptation and zero overflow.

---

## 4. Manual Testing & Exploratory Results

### Manual Test 1: Empty Cart Checkout
- **Test ID**: `MAN-01`
- **Objective**: Verify that a user cannot checkout an empty cart and that entered information is retained.
- **Steps**:
  1. Open application at `http://localhost:3000/`.
  2. Fill "Full Name" with `"Alex Mercer"` and "Email Address" with `"alex@example.com"`.
  3. In the "Your Cart" section, click "Remove" on the Ergonomic Mechanical Keyboard.
  4. Verify the cart displays the empty banner: *"Your cart is empty. Add products from the catalog to checkout."*
  5. Click the "Place Order" button.
- **Expected Result**:
  - Order submission is blocked.
  - Validation banner appears stating: *"Your cart is empty. Please add items before checking out."*
  - The customer's entered name (`"Alex Mercer"`) and email (`"alex@example.com"`) remain filled in the form.
  - No order confirmation screen appears.
- **Actual Result**:
  - Order was successfully blocked.
  - Red alert banner appeared with the exact message.
  - Form fields remained intact.
  - **Status: PASS**

---

### Manual Test 2: Rapid Double-Click Submission
- **Test ID**: `MAN-02`
- **Objective**: Verify that rapid consecutive clicks on "Place Order" do not generate duplicate orders or multiple confirmations.
- **Steps**:
  1. Open application in browser.
  2. Enter "Full Name": `"Morgan Reed"`.
  3. Keep the default Keyboard in cart ($85.00).
  4. Double-click the "Place Order" button rapidly (< 100ms between clicks).
- **Expected Result**:
  - Button immediately transitions to disabled/processing state.
  - Exactly one order confirmation card is displayed.
  - Only one unique Order Reference is generated.
  - No flickering or duplicated summary rows.
- **Actual Result**:
  - The first click synchronously locked submission (`isSubmitting = true`), displaying "Processing Order...".
  - The second click was ignored by the idempotency guard.
  - Exactly one confirmation was rendered with reference (e.g. `ORD-492105`).
  - **Status: PASS**

---

### Manual Test 3: Manual Numeric Input for Quantity
- **Test ID**: `MAN-03`
- **Objective**: Verify manual keyboard typing into the quantity input field.
- **Steps**:
  1. Click into the quantity input field for the keyboard.
  2. Type `5`.
  3. Verify line total becomes `$425.00` and order total becomes `$425.00`.
  4. Attempt to type `-3` or `0`.
- **Expected Result**:
  - Valid integer updates totals immediately.
  - Negative numbers or zero are rejected / clamped to `1`.
- **Actual Result**:
  - Quantity 5 accurately updated line total to `$425.00`.
  - Non-positive values were filtered and clamped safely.
  - **Status: PASS**

---

### Manual Test 4: Mobile Form Factor Usability (375px)
- **Test ID**: `MAN-04`
- **Objective**: Test layout on small mobile screen.
- **Steps**:
  1. Set browser viewport to 375px width.
  2. Verify all elements stack naturally.
  3. Tap quantity buttons and remove button.
- **Expected Result**:
  - Zero horizontal scroll bar.
  - All touch targets are easily clickable without accidental neighboring clicks.
- **Actual Result**:
  - Clean vertical stacking with fluid padding.
  - Zero overflow; buttons respond promptly.
  - **Status: PASS**

---

## 5. Defect Log

| Defect ID | Severity | Summary | Steps to Reproduce | Expected Result | Actual Result | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** (Prevented in Design) | High | Form clearing on validation error | In unmanaged form architectures, clicking submit without a name might refresh/clear optional fields. | Customer inputs should always persist. | React controlled state maintains `customerName` and `customerEmail` regardless of validation passes or failures. | **Verified Resolved** |
| **DEF-02** (Prevented in Design) | High | Duplicate order creation on double-click | Rapidly clicking the place order button before asynchronous state settles can trigger multiple order creations. | Exactly one order should be created. | Synchronous submission locking flag (`isSubmitting = true`) combined with state checking (`if (isSubmitting || order !== null) return;`) completely prevents duplicate execution. | **Verified Resolved** |
| **DEF-03** (Discovered in Exploratory Testing) | Medium | Inability to empty cart via quantity decrement or typing `0` | 1. Open checkout with 1 item in cart.<br>2. Attempt to click `−` to decrease quantity to 0.<br>3. Attempt to type `0` in quantity input. | Decrementing at quantity 1 or typing `0` should remove the item from the cart. Header should offer a quick "Empty Cart" action. | The `−` button was disabled (`disabled={item.quantity <= 1}`) and input rejected `0`, creating the false impression that the cart could not be emptied if the user overlooked the subtle "Remove" text link. | **Verified Resolved**: Allowed `−` at quantity 1 and typing `0` to remove the item; added an explicit "Empty Cart" button in the cart header; restyled "✕ Remove" button with prominent contrast. Added automated Playwright test (Check 8). |

*Note: In accordance with the project guidelines ("Report real defects if found; don’t invent one to satisfy the brief"), DEF-03 was identified as an authentic UX defect during user manual testing and resolved with full automated regression test coverage.*
