document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ================================
     MOBILE NAVIGATION
  ================================= */

  const menuToggle = document.getElementById('menuToggle');
  const mainNavigation = document.getElementById('mainNavigation');

  if (menuToggle && mainNavigation) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNavigation.classList.toggle('active');

      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation menu' : 'Open navigation menu'
      );
    });

    mainNavigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNavigation.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
      });
    });

    document.addEventListener('click', (event) => {
      if (
        mainNavigation.classList.contains('active') &&
        !mainNavigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        mainNavigation.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        mainNavigation.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
      }
    });
  }

  /* ================================
     ACTIVE NAVIGATION LINK
  ================================= */

  const sections = document.querySelectorAll('main section[id]');
  const navigationLinks = document.querySelectorAll(
    '#mainNavigation a[href^="#"]'
  );

  const updateActiveNavigation = () => {
    let currentSection = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 160;

      if (window.scrollY >= sectionTop) {
        currentSection = section.id;
      }
    });

    navigationLinks.forEach((link) => {
      const target = link.getAttribute('href');

      link.classList.toggle(
        'active',
        target === `#${currentSection}`
      );
    });
  };

  window.addEventListener('scroll', updateActiveNavigation, {
    passive: true
  });

  updateActiveNavigation();

  /* ================================
     ROYAL PAWS CART
  ================================= */

  const CART_KEY = 'royalPawsCart';

  const getCart = () => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);

      if (!savedCart) {
        return [];
      }

      const parsedCart = JSON.parse(savedCart);

      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      console.error('Unable to read cart:', error);
      return [];
    }
  };

  const saveCart = (cart) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error('Unable to save cart:', error);
      return false;
    }
  };

  const cart = getCart();

  /* ================================
     CART BUTTON
  ================================= */

  const createCartButton = () => {
    if (document.getElementById('cartButton')) {
      return;
    }

    const button = document.createElement('button');

    button.id = 'cartButton';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open shopping cart');
    button.innerHTML = `
      <span aria-hidden="true">🛒</span>
      <span>Cart</span>
      <span id="cartCount">0</span>
    `;

    button.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 1000;
      border: 1px solid #d4af37;
      border-radius: 999px;
      padding: 12px 18px;
      background: #111;
      color: #d4af37;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(0,0,0,.3);
    `;

    document.body.appendChild(button);

    button.addEventListener('click', openCart);
  };

  /* ================================
     CART DRAWER
  ================================= */

  const createCartDrawer = () => {
    if (document.getElementById('cartDrawer')) {
      return;
    }

    const drawer = document.createElement('aside');

    drawer.id = 'cartDrawer';
    drawer.setAttribute('aria-label', 'Shopping cart');
    drawer.setAttribute('aria-hidden', 'true');

    drawer.style.cssText = `
      position: fixed;
      top: 0;
      right: -420px;
      width: min(420px, 100%);
      height: 100vh;
      z-index: 1100;
      background: #111;
      color: #fff;
      border-left: 1px solid #d4af37;
      box-shadow: -10px 0 35px rgba(0,0,0,.35);
      transition: right .3s ease;
      display: flex;
      flex-direction: column;
    `;

    drawer.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:20px;
        border-bottom:1px solid rgba(212,175,55,.3);
      ">
        <h2 style="margin:0;color:#d4af37;">Your Cart</h2>

        <button
          id="closeCart"
          type="button"
          aria-label="Close shopping cart"
          style="
            border:0;
            background:transparent;
            color:#fff;
            font-size:28px;
            cursor:pointer;
          "
        >
          &times;
        </button>
      </div>

      <div
        id="cartItems"
        style="
          flex:1;
          overflow-y:auto;
          padding:20px;
        "
      ></div>

      <div style="
        padding:20px;
        border-top:1px solid rgba(212,175,55,.3);
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          margin-bottom:16px;
          font-size:18px;
          font-weight:700;
        ">
          <span>Total</span>
          <span id="cartTotal">₦0</span>
        </div>

        <button
          id="checkoutButton"
          type="button"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:8px;
            background:#d4af37;
            color:#111;
            font-weight:800;
            cursor:pointer;
          "
        >
          Proceed to Checkout
        </button>
      </div>
    `;

    document.body.appendChild(drawer);

    const overlay = document.createElement('div');

    overlay.id = 'cartOverlay';

    overlay.style.cssText = `
      position:fixed;
      inset:0;
      z-index:1050;
      background:rgba(0,0,0,.55);
      display:none;
    `;

    document.body.appendChild(overlay);

    document.getElementById('closeCart').addEventListener(
      'click',
      closeCart
    );

    overlay.addEventListener('click', closeCart);

    document.getElementById('checkoutButton').addEventListener(
      'click',
      () => {
        if (cart.length === 0) {
          alert('Your cart is empty.');
          return;
        }

        window.location.href = 'checkout.html';
      }
    );
  };

  /* ================================
     CART DISPLAY
  ================================= */

  const formatPrice = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return '₦0';
    }

    return `₦${number.toLocaleString('en-NG')}`;
  };

  const updateCart = () => {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    const itemCount = cart.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

    const total = cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );

    if (cartCount) {
      cartCount.textContent = String(itemCount);
    }

    if (cartTotal) {
      cartTotal.textContent = formatPrice(total);
    }

    if (!cartItems) {
      return;
    }

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div style="
          text-align:center;
          padding:50px 10px;
          color:#bbb;
        ">
          <div style="font-size:45px;margin-bottom:12px;">🛒</div>
          <p>Your cart is empty.</p>
          <p>Add a pet to begin your order.</p>
        </div>
      `;

      return;
    }

    cartItems.innerHTML = '';

    cart.forEach((item) => {
      const itemElement = document.createElement('div');

      itemElement.style.cssText = `
        display:flex;
        gap:12px;
        padding:14px 0;
        border-bottom:1px solid rgba(255,255,255,.1);
      `;

      const image = document.createElement('img');

      image.src = item.image || '';
      image.alt = item.name || 'Pet';
      image.style.cssText = `
        width:72px;
        height:72px;
        object-fit:cover;
        border-radius:8px;
        background:#222;
      `;

      const details = document.createElement('div');

      details.style.flex = '1';

      details.innerHTML = `
        <strong style="display:block;color:#d4af37;">
          ${escapeHtml(item.name)}
        </strong>

        <span style="display:block;margin:5px 0;">
          ${formatPrice(item.price)}
        </span>

        <div style="
          display:flex;
          align-items:center;
          gap:8px;
        ">
          <button
            type="button"
            data-action="decrease"
            data-id="${escapeHtml(item.id)}"
            style="cursor:pointer;"
          >−</button>

          <span>${Number(item.quantity)}</span>

          <button
            type="button"
            data-action="increase"
            data-id="${escapeHtml(item.id)}"
            style="cursor:pointer;"
          >+</button>

          <button
            type="button"
            data-action="remove"
            data-id="${escapeHtml(item.id)}"
            style="
              margin-left:auto;
              cursor:pointer;
              color:#e57373;
            "
          >
            Remove
          </button>
        </div>
      `;

      itemElement.appendChild(image);
      itemElement.appendChild(details);

      cartItems.appendChild(itemElement);
    });

    cartItems.querySelectorAll('button[data-action]').forEach(
      (button) => {
        button.addEventListener('click', () => {
          const id = button.dataset.id;
          const action = button.dataset.action;

          const item = cart.find(
            (cartItem) => cartItem.id === id
          );

          if (!item) {
            return;
          }

          if (action === 'increase') {
            item.quantity += 1;
          }

          if (action === 'decrease') {
            item.quantity -= 1;

            if (item.quantity <= 0) {
              const index = cart.indexOf(item);
              cart.splice(index, 1);
            }
          }

          if (action === 'remove') {
            const index = cart.indexOf(item);
            cart.splice(index, 1);
          }

          saveCart(cart);
          updateCart();
        });
      }
    );
  };

  /* ================================
     ADD TO CART
  ================================= */

  const addToCart = (pet) => {
    const existingItem = cart.find(
      (item) => item.id === pet.id
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: String(pet.id),
        name: String(pet.name),
        price: Number(pet.price),
        image: String(pet.image || ''),
        quantity: 1
      });
    }

    if (!saveCart(cart)) {
      alert('Your cart could not be saved on this device.');
      return;
    }

    updateCart();

    alert(`${pet.name} has been added to your cart.`);
  };

  /* ================================
     FIND PET CARDS
  ================================= */

  const petCards = document.querySelectorAll(
    '#pets .pet-card'
  );

  petCards.forEach((card, index) => {
    const button = card.querySelector(
      'button, .btn, a'
    );

    if (!button) {
      return;
    }

    const titleElement = card.querySelector(
      'h3, h4, .pet-name'
    );

    const imageElement = card.querySelector('img');

    const priceElement = card.querySelector(
      '.price, .pet-price'
    );

    const fallbackPets = [
      {
        id: 'royal-pet-1',
        name: 'Premium Dog',
        price: 150000
      },
      {
        id: 'royal-pet-2',
        name: 'Premium Cat',
        price: 120000
      },
      {
        id: 'royal-pet-3',
        name: 'Premium Bird',
        price: 75000
      }
    ];

    const fallbackPet =
      fallbackPets[index] || {
        id: `royal-pet-${index + 1}`,
        name: 'Royal Paws Pet',
        price: 100000
      };

    const name =
      titleElement?.textContent?.trim() ||
      fallbackPet.name;

    const image =
      imageElement?.getAttribute('src') || '';

    let price = Number(
      priceElement?.textContent?.replace(/[^\d]/g, '')
    );

    if (!Number.isFinite(price) || price <= 0) {
      price = fallbackPet.price;
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();

      addToCart({
        id: fallbackPet.id,
        name,
        price,
        image
      });
    });
  });

  /* ================================
     CART OPEN / CLOSE
  ================================= */

  const openCart = () => {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');

    if (!drawer || !overlay) {
      return;
    }

    drawer.style.right = '0';
    overlay.style.display = 'block';
    drawer.setAttribute('aria-hidden', 'false');

    updateCart();
  };

  const closeCart = () => {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');

    if (!drawer || !overlay) {
      return;
    }

    drawer.style.right = '-420px';
    overlay.style.display = 'none';
    drawer.setAttribute('aria-hidden', 'true');
  };

  /* ================================
     SAFE HTML HELPER
  ================================= */

  const escapeHtml = (value) => {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  };

  /* ================================
     CONTACT FORM
  ================================= */

  const contactForm =
    document.getElementById('contactForm');

  const formStatus =
    document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nameInput =
        document.getElementById('name');

      const emailInput =
        document.getElementById('email');

      const phoneInput =
        document.getElementById('phone');

      const messageInput =
        document.getElementById('message');

      const name =
        nameInput?.value.trim() || '';

      const email =
        emailInput?.value.trim() || '';

      const phone =
        phoneInput?.value.trim() || '';

      const message =
        messageInput?.value.trim() || '';

      if (!name || !email || !message) {
        if (formStatus) {
          formStatus.textContent =
            'Please complete all required fields.';
        }

        return;
      }

      if (formStatus) {
        formStatus.textContent = 'Sending...';
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            message
          })
        });

        const data = await response.json().catch(
          () => ({})
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to send your message.'
          );
        }

        if (formStatus) {
          formStatus.textContent =
            'Thank you. Your message has been sent successfully.';
        }

        contactForm.reset();
      } catch (error) {
        console.error(
          'Contact form error:',
          error
        );

        if (formStatus) {
          formStatus.textContent =
            'Sorry, we could not send your message right now. Please try again.';
        }
      }
    });
  }

  /* ================================
     INITIALIZE CART
  ================================= */

  createCartButton();
  createCartDrawer();
  updateCart();
});
