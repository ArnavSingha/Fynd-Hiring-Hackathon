import { test, expect } from '@playwright/test';

test.describe('Mini Checkout Customer Journey & Error Handling', () => {
  // Ensure every test starts from an isolated, clean state
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Verify initial clean state is loaded
    await expect(page.locator('#checkout-form')).toBeVisible();
    await expect(page.locator('#cart-items')).toBeVisible();
  });

  test('Check 1: Successful checkout produces an order confirmation with reference', async ({ page }) => {
    // 1. Enter required customer name
    const nameInput = page.locator('#customer-name');
    await nameInput.fill('Jane Doe');

    // Optional email
    const emailInput = page.locator('#customer-email');
    await emailInput.fill('jane.doe@example.com');

    // 2. Submit order
    const placeOrderBtn = page.locator('#place-order-btn');
    await placeOrderBtn.click();

    // 3. Assert confirmation view is visible
    const confirmation = page.locator('#order-confirmation');
    await expect(confirmation).toBeVisible();

    // 4. Assert customer name is displayed in confirmation
    const confirmName = page.locator('#confirm-customer-name');
    await expect(confirmName).toHaveText('Jane Doe');

    // 5. Assert valid order reference is generated
    const confirmRef = page.locator('#confirm-order-ref');
    await expect(confirmRef).toBeVisible();
    await expect(confirmRef).toHaveText(/^ORD-\d{6}$/);

    // 6. Assert total paid matches cart total
    const confirmTotal = page.locator('#confirm-order-total');
    await expect(confirmTotal).toHaveText('$85.00');

    // 7. Assert checkout form is no longer visible
    await expect(page.locator('#checkout-flow')).not.toBeVisible();
  });

  test('Check 2: Missing required field blocks checkout and shows validation message', async ({ page }) => {
    // 1. Leave required Full Name empty, but fill optional email
    const emailInput = page.locator('#customer-email');
    await emailInput.fill('customer@example.com');

    // 2. Click Place Order
    const placeOrderBtn = page.locator('#place-order-btn');
    await placeOrderBtn.click();

    // 3. Assert checkout is blocked: confirmation must NOT appear
    const confirmation = page.locator('#order-confirmation');
    await expect(confirmation).not.toBeVisible();

    // 4. Assert clear validation error message is visible to the customer
    const validationAlert = page.locator('#validation-alert');
    await expect(validationAlert).toBeVisible();
    const validationMessage = page.locator('#validation-message');
    await expect(validationMessage).toHaveText('Full name is required to complete your order.');

    // 5. Assert customer inputs and cart state are preserved
    await expect(emailInput).toHaveValue('customer@example.com');
    await expect(page.locator('#summary-total')).toHaveText('$85.00');
    await expect(page.locator('#checkout-form')).toBeVisible();
  });

  test('Check 3: Quantity change updates line totals and order total with exact precision', async ({ page }) => {
    // 1. Verify initial total with 1 Keyboard ($85.00)
    const keyboardLineTotal = page.locator('[data-testid="line-total-1"]');
    const orderTotal = page.locator('#summary-total');
    const subtotal = page.locator('#summary-subtotal');

    await expect(keyboardLineTotal).toHaveText('$85.00');
    await expect(orderTotal).toHaveText('$85.00');
    await expect(subtotal).toHaveText('$85.00');

    // 2. Increment Keyboard quantity to 2
    const incKeyboardBtn = page.locator('[data-testid="inc-qty-1"]');
    await incKeyboardBtn.click();

    // Line total must update to $170.00
    await expect(keyboardLineTotal).toHaveText('$170.00');
    // Order total must update to $170.00
    await expect(orderTotal).toHaveText('$170.00');
    await expect(subtotal).toHaveText('$170.00');

    // 3. Add second product (Precision Wireless Mouse @ $35.00)
    const addMouseBtn = page.locator('[data-testid="add-product-2"]');
    await addMouseBtn.click();

    // Assert Mouse line total is $35.00
    const mouseLineTotal = page.locator('[data-testid="line-total-2"]');
    await expect(mouseLineTotal).toHaveText('$35.00');

    // Assert combined Order Total: $170.00 + $35.00 = $205.00
    await expect(orderTotal).toHaveText('$205.00');
    await expect(subtotal).toHaveText('$205.00');

    // 4. Decrement Keyboard quantity back to 1
    const decKeyboardBtn = page.locator('[data-testid="dec-qty-1"]');
    await decKeyboardBtn.click();

    // Assert Keyboard line total is back to $85.00 and Order Total is $85.00 + $35.00 = $120.00
    await expect(keyboardLineTotal).toHaveText('$85.00');
    await expect(orderTotal).toHaveText('$120.00');
  });

  test('Check 4 (Edge Case): Empty cart blocks checkout and displays clear notification', async ({ page }) => {
    // 1. Enter customer name first to verify input preservation
    const nameInput = page.locator('#customer-name');
    await nameInput.fill('Alex Johnson');

    // 2. Remove the existing item to empty the cart
    const removeBtn = page.locator('[data-testid="remove-item-1"]');
    await removeBtn.click();

    // 3. Verify empty cart banner is visible and total is $0.00
    await expect(page.locator('#cart-empty-message')).toBeVisible();
    await expect(page.locator('#summary-total')).toHaveText('$0.00');

    // 4. Attempt to place order with empty cart
    const placeOrderBtn = page.locator('#place-order-btn');
    await placeOrderBtn.click();

    // 5. Assert checkout is blocked
    await expect(page.locator('#order-confirmation')).not.toBeVisible();
    const validationMessage = page.locator('#validation-message');
    await expect(validationMessage).toBeVisible();
    await expect(validationMessage).toHaveText('Your cart is empty. Please add items before checking out.');

    // 6. Assert customer name input is strictly preserved
    await expect(nameInput).toHaveValue('Alex Johnson');
  });

  test('Check 5 (Edge Case): Rapid double-click on Place Order produces exactly one confirmation', async ({ page }) => {
    // 1. Enter customer name
    const nameInput = page.locator('#customer-name');
    await nameInput.fill('Morgan Lee');

    // 2. Perform rapid double-click using Playwright dblclick()
    const placeOrderBtn = page.locator('#place-order-btn');
    await placeOrderBtn.dblclick();

    // 3. Confirmation must be visible
    const confirmation = page.locator('#order-confirmation');
    await expect(confirmation).toBeVisible();

    // 4. There must be exactly one order reference and confirmation rendered
    const confirmRefs = page.locator('#confirm-order-ref');
    await expect(confirmRefs).toHaveCount(1);
    await expect(confirmation).toHaveCount(1);

    // 5. Verify the underlying order creation was executed exactly once
    const submissionCount = await page.evaluate(() => window.__orderSubmissionCount);
    expect(submissionCount).toBe(1);
  });

  test('Check 6 (Responsiveness): Mobile viewport renders seamlessly without horizontal overflow', async ({ page }) => {
    // Set viewport to mobile phone size (iPhone SE / 375x667)
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Verify no horizontal overflow occurs
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 2. Ensure controls are visible and touch-accessible
    const nameInput = page.locator('#customer-name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Mobile Shopper');

    // Increment item on mobile
    const incBtn = page.locator('[data-testid="inc-qty-1"]');
    await incBtn.click();
    await expect(page.locator('#summary-total')).toHaveText('$170.00');

    // 3. Complete checkout on mobile
    const placeOrderBtn = page.locator('#place-order-btn');
    await placeOrderBtn.click();

    // 4. Verify confirmation fits nicely on mobile screen
    const confirmation = page.locator('#order-confirmation');
    await expect(confirmation).toBeVisible();
    const confirmRef = page.locator('#confirm-order-ref');
    await expect(confirmRef).toBeVisible();

    const confirmationOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(confirmationOverflow).toBe(false);
  });

  test('Check 7 (Responsiveness): Tablet viewport adapts layout cleanly', async ({ page }) => {
    // Set viewport to tablet size (iPad / 768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify both catalog items are rendered
    await expect(page.locator('[data-product-id="1"]')).toBeVisible();
    await expect(page.locator('[data-product-id="2"]')).toBeVisible();
  });

  test('Check 8 (Cart Usability): Decrementing at quantity 1 or clicking Empty Cart clears cart completely', async ({ page }) => {
    // 1. Initial cart has 1 Keyboard ($85.00)
    await expect(page.locator('[data-testid="line-total-1"]')).toBeVisible();

    // 2. Decrementing at quantity 1 removes the item from the cart
    const decBtn = page.locator('[data-testid="dec-qty-1"]');
    await decBtn.click();

    // Assert cart is now empty
    await expect(page.locator('#cart-empty-message')).toBeVisible();
    await expect(page.locator('#summary-total')).toHaveText('$0.00');

    // 3. Add item back from catalog
    const addKeyboardBtn = page.locator('[data-testid="add-product-1"]');
    await addKeyboardBtn.click();
    await expect(page.locator('[data-testid="line-total-1"]')).toBeVisible();
    await expect(page.locator('#summary-total')).toHaveText('$85.00');

    // 4. Click header "Empty Cart" button
    const clearCartBtn = page.locator('[data-testid="clear-cart-btn"]');
    await expect(clearCartBtn).toBeVisible();
    await clearCartBtn.click();

    // Assert cart is emptied again
    await expect(page.locator('#cart-empty-message')).toBeVisible();
    await expect(page.locator('#summary-total')).toHaveText('$0.00');
  });
});
