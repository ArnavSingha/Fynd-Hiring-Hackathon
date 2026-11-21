import React, { useState, useMemo } from 'react';

const PRODUCTS = [
  {
    id: 1,
    name: 'Ergonomic Mechanical Keyboard',
    price: 85.00,
    tag: 'Best Seller',
    desc: 'Tactile mechanical switches with integrated wrist rest and RGB backlighting.'
  },
  {
    id: 2,
    name: 'Precision Wireless Mouse',
    price: 35.00,
    tag: 'Ergonomic',
    desc: 'Ultra-responsive 2.4GHz sensor with silent clicks and ergonomic thumb support.'
  }
];

export default function App() {
  // Cart state: initialized with 1 keyboard
  const [cart, setCart] = useState([
    {
      id: 1,
      name: 'Ergonomic Mechanical Keyboard',
      price: 85.00,
      quantity: 1
    }
  ]);

  // Customer form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // UI state
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState(null);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const formattedSubtotal = `$${subtotal.toFixed(2)}`;
  const formattedTotal = `$${subtotal.toFixed(2)}`;
  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart actions
  const handleAddToCart = (product) => {
    setValidationError(null);
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    // If quantity is reduced to 0 or below, remove the item from cart
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Order submission
  const handlePlaceOrder = (e) => {
    e.preventDefault();

    // Idempotency: block duplicate submissions if already submitting or placed
    if (isSubmitting || order !== null) {
      return;
    }

    // Validation 1: Cart cannot be empty
    if (cart.length === 0) {
      setValidationError('Your cart is empty. Please add items before checking out.');
      return;
    }

    // Validation 2: Required Name cannot be blank
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setValidationError('Full name is required to complete your order.');
      return;
    }

    // Synchronously lock submission state to prevent any race condition or rapid double click
    setIsSubmitting(true);

    // Track submission count for browser test verification
    window.__orderSubmissionCount = (window.__orderSubmissionCount || 0) + 1;

    // Generate unique order reference (e.g. ORD-684920)
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderRef = `ORD-${randomSuffix}`;

    const placedOrder = {
      orderRef,
      customerName: trimmedName,
      customerEmail: customerEmail.trim(),
      items: cart.map(item => ({ ...item })),
      total: formattedTotal,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };

    setValidationError(null);
    setOrder(placedOrder);
    setIsSubmitting(false);
  };

  const handleStartNewOrder = () => {
    setOrder(null);
    setCart([
      {
        id: 1,
        name: 'Ergonomic Mechanical Keyboard',
        price: 85.00,
        quantity: 1
      }
    ]);
    setCustomerName('');
    setCustomerEmail('');
    setValidationError(null);
    setIsSubmitting(false);
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-container">
          <div className="brand">
            <span className="brand-logo" aria-hidden="true">⚡</span>
            <span className="brand-name">Apex Gear</span>
          </div>
          <div className="header-badge">Secure Checkout</div>
        </div>
      </header>

      <main className="container main-content">
        {/* Order Confirmation Screen */}
        {order ? (
          <section
            id="order-confirmation"
            className="confirmation-card"
            role="region"
            aria-labelledby="confirmation-heading"
            aria-live="polite"
          >
            <div className="confirmation-icon" aria-hidden="true">✓</div>
            <h1 id="confirmation-heading">Thank You! Your Order is Placed</h1>
            <p className="confirmation-subtext">
              We've received your order, <strong id="confirm-customer-name">{order.customerName}</strong>. A confirmation has been registered in our store system.
            </p>

            <div className="order-ref-panel">
              <span className="ref-label">Order Reference:</span>
              <strong id="confirm-order-ref" className="ref-code" data-testid="order-ref">
                {order.orderRef}
              </strong>
            </div>

            <div className="confirmation-details">
              <h3>Order Summary</h3>
              <ul id="confirm-items-list" className="confirm-items-list">
                {order.items.map((item) => (
                  <li key={item.id} className="confirm-item-row">
                    <span>{item.name} × {item.quantity}</span>
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </li>
                ))}
              </ul>
              <div className="confirm-total-row">
                <span>Total Paid</span>
                <strong id="confirm-order-total" className="confirm-total-val">
                  {order.total}
                </strong>
              </div>
            </div>

            <button
              id="new-order-btn"
              className="btn btn-secondary"
              type="button"
              onClick={handleStartNewOrder}
            >
              Start New Order
            </button>
          </section>
        ) : (
          /* Main Checkout Grid */
          <div id="checkout-flow" className="checkout-grid">
            {/* Left Column: Products & Customer Form */}
            <div className="checkout-left">
              {/* Product Catalog */}
              <section className="card product-catalog" aria-labelledby="catalog-heading">
                <h2 id="catalog-heading" className="section-title">Available Products</h2>
                <p className="section-desc">Select items to add to your order.</p>

                <div id="catalog-list" className="catalog-grid">
                  {PRODUCTS.map((product) => {
                    const inCart = cart.some((i) => i.id === product.id);
                    return (
                      <div key={product.id} className="product-item" data-product-id={product.id}>
                        <div className="product-header">
                          <h3 className="product-name">{product.name}</h3>
                          <span className="product-tag">{product.tag}</span>
                        </div>
                        <p className="product-desc">{product.desc}</p>
                        <div className="product-footer">
                          <span className="product-price">${product.price.toFixed(2)}</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-add"
                            data-testid={`add-product-${product.id}`}
                            onClick={() => handleAddToCart(product)}
                          >
                            {inCart ? 'Add Another' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Customer Form */}
              <section className="card customer-details" aria-labelledby="customer-heading">
                <h2 id="customer-heading" className="section-title">Customer Details</h2>
                <p className="section-desc">Please provide your details to complete the order.</p>

                {validationError && (
                  <div
                    id="validation-alert"
                    className="alert alert-error"
                    role="alert"
                    aria-live="polite"
                  >
                    <span className="alert-icon" aria-hidden="true">⚠️</span>
                    <span id="validation-message" className="alert-text">
                      {validationError}
                    </span>
                  </div>
                )}

                <form id="checkout-form" onSubmit={handlePlaceOrder} noValidate>
                  <div className="form-group">
                    <label htmlFor="customer-name" className="form-label">
                      Full Name <span className="required-indicator" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      type="text"
                      id="customer-name"
                      name="name"
                      className={`form-input ${validationError && !customerName.trim() ? 'input-error' : ''}`}
                      placeholder="e.g. Jane Doe"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      required
                      aria-required="true"
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="customer-email" className="form-label">
                      Email Address <span className="optional-indicator">(optional)</span>
                    </label>
                    <input
                      type="email"
                      id="customer-email"
                      name="email"
                      className="form-input"
                      placeholder="e.g. jane@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <button
                    type="submit"
                    id="place-order-btn"
                    className="btn btn-primary btn-block"
                    disabled={isSubmitting}
                  >
                    <span className="btn-text">
                      {isSubmitting ? 'Processing Order...' : 'Place Order'}
                    </span>
                    {isSubmitting && <span className="btn-spinner" aria-hidden="true"></span>}
                  </button>
                </form>
              </section>
            </div>

            {/* Right Column: Shopping Cart & Order Summary */}
            <div className="checkout-right">
              <section className="card cart-summary" aria-labelledby="cart-heading">
                <div className="cart-header">
                  <h2 id="cart-heading" className="section-title">Your Cart</h2>
                  <div className="cart-header-actions">
                    {cart.length > 0 && (
                      <button
                        type="button"
                        className="btn-clear-cart"
                        data-testid="clear-cart-btn"
                        onClick={handleClearCart}
                        aria-label="Empty all items from cart"
                      >
                        Empty Cart
                      </button>
                    )}
                    <span id="cart-count-badge" className="badge">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div id="cart-empty-message" className="empty-cart-banner">
                    <p>Your cart is empty.</p>
                    <span className="subtext">Add products from the catalog to checkout.</span>
                  </div>
                ) : (
                  <div id="cart-items" className="cart-items-list" role="list">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="cart-item"
                        data-cart-item-id={item.id}
                        role="listitem"
                      >
                        <div className="cart-item-row">
                          <div className="item-info">
                            <span className="item-title">{item.name}</span>
                            <span className="item-unit-price">${item.price.toFixed(2)} each</span>
                          </div>
                          <span
                            className="item-line-total"
                            data-testid={`line-total-${item.id}`}
                          >
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        <div className="cart-item-controls">
                          <div className="qty-control-group">
                            <button
                              type="button"
                              className="qty-btn decrement-btn"
                              aria-label={item.quantity === 1 ? `Remove ${item.name} from cart` : `Decrease quantity of ${item.name}`}
                              data-testid={`dec-qty-${item.id}`}
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              title={item.quantity === 1 ? "Reduce to 0 to remove" : "Decrease quantity"}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              className="qty-input"
                              aria-label={`Quantity of ${item.name}`}
                              data-testid={`qty-input-${item.id}`}
                              value={item.quantity}
                              min="0"
                              max="99"
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                if (!isNaN(parsed)) {
                                  handleUpdateQuantity(item.id, parsed);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="qty-btn increment-btn"
                              aria-label={`Increase quantity of ${item.name}`}
                              data-testid={`inc-qty-${item.id}`}
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="btn-remove"
                            aria-label={`Remove ${item.name} from cart`}
                            data-testid={`remove-item-${item.id}`}
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <span aria-hidden="true" className="remove-icon">✕</span> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="order-pricing">
                  <div className="pricing-row">
                    <span className="pricing-label">Subtotal</span>
                    <span id="summary-subtotal" className="pricing-val">
                      {formattedSubtotal}
                    </span>
                  </div>
                  <div className="pricing-row">
                    <span className="pricing-label">Shipping</span>
                    <span className="pricing-val text-success">FREE</span>
                  </div>
                  <div className="pricing-row">
                    <span className="pricing-label">Estimated Tax</span>
                    <span className="pricing-val">$0.00</span>
                  </div>
                  <hr className="pricing-divider" />
                  <div className="pricing-row total-row">
                    <span className="total-label">Total</span>
                    <span id="summary-total" className="total-amount">
                      {formattedTotal}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <p>© 2026 Apex Gear Store. Demo Checkout for Browser Testing.</p>
        </div>
      </footer>
    </>
  );
}
