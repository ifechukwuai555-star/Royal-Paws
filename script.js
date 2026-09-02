/* =========================================================
   ROYAL PAWS — PREMIUM PET STORE
   STEP 3: script.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================
       ELEMENTS
       ========================= */

    const menuToggle = document.getElementById('menuToggle');
    const mainNavigation = document.getElementById('mainNavigation');
    const navLinks = document.querySelectorAll('.nav-link');
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');


    /* =========================
       MOBILE NAVIGATION
       ========================= */

    if (menuToggle && mainNavigation) {

        menuToggle.addEventListener('click', () => {

            const isOpen = mainNavigation.classList.toggle('open');

            menuToggle.setAttribute(
                'aria-expanded',
                String(isOpen)
            );

            menuToggle.setAttribute(
                'aria-label',
                isOpen
                    ? 'Close navigation menu'
                    : 'Open navigation menu'
            );
        });


        /* Close menu after selecting a navigation link */

        navLinks.forEach((link) => {

            link.addEventListener('click', () => {

                mainNavigation.classList.remove('open');

                menuToggle.setAttribute(
                    'aria-expanded',
                    'false'
                );

                menuToggle.setAttribute(
                    'aria-label',
                    'Open navigation menu'
                );
            });

        });


        /* Close menu when clicking outside it */

        document.addEventListener('click', (event) => {

            const clickedInsideNavigation =
                mainNavigation.contains(event.target);

            const clickedMenuButton =
                menuToggle.contains(event.target);

            if (
                !clickedInsideNavigation &&
                !clickedMenuButton &&
                mainNavigation.classList.contains('open')
            ) {

                mainNavigation.classList.remove('open');

                menuToggle.setAttribute(
                    'aria-expanded',
                    'false'
                );

                menuToggle.setAttribute(
                    'aria-label',
                    'Open navigation menu'
                );
            }

        });


        /* Close mobile menu with Escape */

        document.addEventListener('keydown', (event) => {

            if (
                event.key === 'Escape' &&
                mainNavigation.classList.contains('open')
            ) {

                mainNavigation.classList.remove('open');

                menuToggle.setAttribute(
                    'aria-expanded',
                    'false'
                );

                menuToggle.setAttribute(
                    'aria-label',
                    'Open navigation menu'
                );

                menuToggle.focus();
            }

        });

    }


    /* =========================
       ACTIVE NAVIGATION LINK
       ========================= */

    const sections = document.querySelectorAll(
        'main section[id]'
    );

    if (sections.length > 0 && navLinks.length > 0) {

        const updateActiveNavigation = () => {

            const scrollPosition =
                window.scrollY + 140;

            let currentSection = 'home';

            sections.forEach((section) => {

                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (
                    scrollPosition >= sectionTop &&
                    scrollPosition < sectionTop + sectionHeight
                ) {
                    currentSection = section.id;
                }

            });

            navLinks.forEach((link) => {

                const linkTarget =
                    link.getAttribute('href');

                link.classList.toggle(
                    'active',
                    linkTarget === `#${currentSection}`
                );

            });

        };


        window.addEventListener(
            'scroll',
            updateActiveNavigation,
            { passive: true }
        );

        updateActiveNavigation();
    }


    /* =========================
       CONTACT FORM
       ========================= */

    if (contactForm && formStatus) {

        contactForm.addEventListener(
            'submit',
            (event) => {

                event.preventDefault();

                const nameInput =
                    document.getElementById('name');

                const emailInput =
                    document.getElementById('email');

                const phoneInput =
                    document.getElementById('phone');

                const messageInput =
                    document.getElementById('message');


                if (
                    !nameInput ||
                    !emailInput ||
                    !messageInput
                ) {
                    formStatus.textContent =
                        'The contact form is temporarily unavailable. Please contact us by phone or email.';

                    return;
                }


                const name =
                    nameInput.value.trim();

                const email =
                    emailInput.value.trim();

                const phone =
                    phoneInput
                        ? phoneInput.value.trim()
                        : '';

                const message =
                    messageInput.value.trim();


                /* Basic validation */

                if (!name) {

                    formStatus.textContent =
                        'Please enter your name.';

                    nameInput.focus();

                    return;
                }


                if (!email) {

                    formStatus.textContent =
                        'Please enter your email address.';

                    emailInput.focus();

                    return;
                }


                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailPattern.test(email)) {

                    formStatus.textContent =
                        'Please enter a valid email address.';

                    emailInput.focus();

                    return;
                }


                if (!message) {

                    formStatus.textContent =
                        'Please enter a message.';

                    messageInput.focus();

                    return;
                }


                /*
                 * The backend will be connected later.
                 * For now, we confirm that the form
                 * has been filled correctly.
                 */

                formStatus.textContent =
                    `Thanks, ${name}. Your message is ready to be sent.`;

                contactForm.reset();

            }
        );

    }

});
