document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const mainNavigation = document.getElementById('mainNavigation');
  const navLinks = document.querySelectorAll('.nav-link');

  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  // Mobile navigation
  if (menuToggle && mainNavigation) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNavigation.classList.toggle('open');

      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation menu' : 'Open navigation menu'
      );
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mainNavigation.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
      });
    });

    document.addEventListener('click', (event) => {
      if (
        mainNavigation.classList.contains('open') &&
        !mainNavigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        mainNavigation.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mainNavigation.classList.contains('open')) {
        mainNavigation.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
        menuToggle.focus();
      }
    });
  }

  // Active navigation link while scrolling
  const sections = document.querySelectorAll('main section[id]');

  const updateActiveNav = () => {
    const scrollPosition = window.scrollY + 160;
    let currentSection = '';

    sections.forEach((section) => {
      if (scrollPosition >= section.offsetTop) {
        currentSection = section.id;
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');

      if (href === `#${currentSection}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // Contact form
  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');
      const messageInput = document.getElementById('message');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !email || !message) {
        formStatus.textContent = 'Please complete all required fields.';
        formStatus.className = 'form-status error';
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        formStatus.textContent = 'Please enter a valid email address.';
        formStatus.className = 'form-status error';
        return;
      }

      if (
        name.length > 100 ||
        email.length > 150 ||
        phone.length > 30 ||
        message.length > 2000
      ) {
        formStatus.textContent = 'One or more fields are too long.';
        formStatus.className = 'form-status error';
        return;
      }

      const submitButton = contactForm.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      formStatus.textContent = 'Sending your message...';
      formStatus.className = 'form-status';

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

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || !data.success) {
          throw new Error(
            data?.message || 'We could not send your message.'
          );
        }

        formStatus.textContent = data.message;
        formStatus.className = 'form-status success';

        contactForm.reset();
      } catch (error) {
        console.error('Contact form error:', error);

        formStatus.textContent =
          error.message ||
          'Something went wrong. Please try again later.';

        formStatus.className = 'form-status error';
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Send Message';
        }
      }
    });
  }
});
