(() => {
  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const year = document.querySelector("[data-year]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (nav) {
    nav.inert = window.innerWidth <= 760;
    nav.setAttribute("aria-hidden", String(nav.inert));
  }

  if (year) year.textContent = String(new Date().getFullYear());

  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (!header) return;
    header.classList.toggle("is-scrolled", y > 24);
    if (y > 80 && y > lastY && !document.body.classList.contains("nav-open") && !header.contains(document.activeElement)) header.classList.add("is-hidden");
    else header.classList.remove("is-hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setNavOpen = (open) => {
    nav?.classList.toggle("is-open", open);
    if (nav) {
      nav.inert = window.innerWidth <= 760 && !open;
      nav.setAttribute("aria-hidden", String(nav.inert));
    }
    navToggle?.setAttribute("aria-expanded", String(open));
    navToggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  };

  const closeNav = () => setNavOpen(false);

  navToggle?.addEventListener("click", () => {
    const open = !nav?.classList.contains("is-open");
    setNavOpen(open);
    if (open) nav?.querySelector("a")?.focus();
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) {
      closeNav();
      navToggle?.focus();
    }
    if (event.key === "Tab" && nav?.classList.contains("is-open") && window.innerWidth <= 760) {
      const items = [...nav.querySelectorAll("a[href]")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760 || !nav?.classList.contains("is-open")) closeNav();
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    const reveal = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    reveal.forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
  }

  const menuNav = document.querySelector("[data-menu-nav]");
  const courses = document.querySelectorAll("[data-course]");
  if (menuNav && courses.length) {
    const links = [...menuNav.querySelectorAll("a")];
    const allLink = menuNav.querySelector("[data-menu-all]");
    const setVisibleCourses = (selectedId = "all") => {
      courses.forEach((course) => {
        course.hidden = selectedId !== "all" && course.id !== selectedId;
      });
      links.forEach((link) => {
        const selected = selectedId === "all"
          ? link === allLink
          : link.getAttribute("href") === `#${selectedId}`;
        if (selected) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    const setActive = (id) => {
      links.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    };

    if ("IntersectionObserver" in window) {
      const courseIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !entry.target.hidden) setActive(entry.target.id);
          });
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
      );
      courses.forEach((course) => courseIo.observe(course));
    }

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (link === allLink) return;
        const id = link.getAttribute("href")?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!target) return;
        event.preventDefault();
        setVisibleCourses(id);
        setActive(id);
        history.replaceState(null, "", `#${id}`);
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });

    allLink?.addEventListener("click", (event) => {
      event.preventDefault();
      setVisibleCourses();
      links.forEach((link) => link.classList.remove("is-active"));
      history.replaceState(null, "", location.pathname + location.search);
    });

    const initialCourse = location.hash && document.getElementById(location.hash.slice(1))?.matches("[data-course]")
      ? location.hash.slice(1)
      : "all";
    setVisibleCourses(initialCourse);
    if (initialCourse !== "all") setActive(initialCourse);
  }

  const modalSelector = "[data-modal]";
  let modalTrigger = null;
  let modalBackground = [];
  const modalFocusable = (modal) => [...modal.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
  const openModal = (modal, trigger) => {
    if (!modal) return;
    modalTrigger = trigger || document.activeElement;
    modalBackground = [...document.body.children]
      .filter((element) => element !== modal && !element.contains(modal))
      .map((element) => ({ element, inert: element.inert }));
    modalBackground.forEach(({ element }) => {
      element.inert = true;
    });
    modal.hidden = false;
    document.body.classList.add("modal-open");
    (modalFocusable(modal)[0] || modal).focus();
  };
  const closeModal = (modal) => {
    if (!modal) return;
    modal.hidden = true;
    modalBackground.forEach(({ element, inert }) => {
      element.inert = inert;
    });
    modalBackground = [];
    document.body.classList.remove("modal-open");
    modalTrigger?.focus();
    modalTrigger = null;
  };

  document.querySelectorAll(modalSelector).forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-modal-close]")) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (event) => {
    const modal = document.querySelector(`${modalSelector}:not([hidden])`);
    if (!modal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal(modal);
      return;
    }
    if (event.key === "Tab") {
      const items = modalFocusable(modal);
      if (!items.length) {
        event.preventDefault();
        modal.focus();
      } else if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault();
        items[0].focus();
      }
    }
  });

  const reservation = document.querySelector("[data-reservation]");
  if (reservation) {
    const dateInput = reservation.querySelector("#date");
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      dateInput.min = iso;
      if (!dateInput.value) dateInput.value = iso;
    }

    const setError = (field, message) => {
      const wrap = field.closest(".field");
      const err = wrap?.querySelector(".field-error");
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (err) {
        if (!err.id) err.id = `${field.id}-error`;
        err.textContent = message || "";
        field.setAttribute("aria-describedby", err.id);
      }
    };

    const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const phoneOk = (value) => value.replace(/[^\d+]/g, "").length >= 8;

    reservation.addEventListener("submit", (event) => {
      event.preventDefault();
      const fields = {
        name: reservation.querySelector("#name"),
        email: reservation.querySelector("#email"),
        phone: reservation.querySelector("#phone"),
        date: reservation.querySelector("#date"),
        time: reservation.querySelector("#time"),
        guests: reservation.querySelector("#guests"),
      };

      let valid = true;
      Object.values(fields).forEach((field) => setError(field, ""));

      if (!fields.name.value.trim() || fields.name.value.trim().length < 2) {
        setError(fields.name, "Please leave a name we can hold the table under.");
        valid = false;
      }
      if (!emailOk(fields.email.value.trim())) {
        setError(fields.email, "We need a working email for the confirmation.");
        valid = false;
      }
      if (!phoneOk(fields.phone.value.trim())) {
        setError(fields.phone, "Include a number we can reach the same evening.");
        valid = false;
      }
      if (!fields.date.value || fields.date.value < dateInput.min) {
        setError(fields.date, fields.date.value ? "Choose a date from tomorrow onward." : "Choose a date.");
        valid = false;
      }
      if (!fields.time.value) {
        setError(fields.time, "Choose a sitting.");
        valid = false;
      }
      if (!fields.guests.value) {
        setError(fields.guests, "How many will be at the table?");
        valid = false;
      }

      if (!valid) {
        reservation.querySelector("[aria-invalid='true']")?.focus();
        return;
      }

      const success = document.querySelector("[data-success]");
      const summary = success?.querySelector("[data-success-summary]");
      if (summary) {
        const when = new Date(`${fields.date.value}T00:00:00`);
        const pretty = when.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        summary.textContent = `${fields.name.value.trim()} · ${pretty} · ${fields.time.options[fields.time.selectedIndex].text} · ${fields.guests.options[fields.guests.selectedIndex].text}`;
      }
      openModal(success, reservation.querySelector("[type='submit']"));
      reservation.reset();
      if (dateInput) dateInput.value = dateInput.min;
    });

    reservation.addEventListener("input", (event) => {
      if (event.target.matches("input, select, textarea") && event.target.getAttribute("aria-invalid") === "true") {
        setError(event.target, "");
      }
    });
  }

  const inquiry = document.querySelector("[data-inquiry]");
  if (inquiry) {
    const email = inquiry.querySelector("#inquiry-email");
    const date = inquiry.querySelector("#inquiry-date");
    const size = inquiry.querySelector("#inquiry-size");
    const note = inquiry.querySelector("[data-inquiry-note]");
    if (date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date.min = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    }

    inquiry.addEventListener("submit", (event) => {
      event.preventDefault();
      const invalidField = !email?.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
        ? email
        : size?.value && !size.validity.valid
          ? size
          : date?.value && date.value < date.min
            ? date
            : null;

      if (invalidField) {
        const message = invalidField === email
          ? "Add a valid email so the events desk can reply."
          : invalidField === size
            ? "Headcount must be between 8 and 42."
            : "Choose a date from tomorrow onward.";
        invalidField.setAttribute("aria-invalid", "true");
        if (note) {
          invalidField.setAttribute("aria-describedby", note.id);
          note.textContent = message;
        }
        invalidField.focus();
        return;
      }

      email?.removeAttribute("aria-invalid");
      email?.removeAttribute("aria-describedby");
      inquiry.reset();
      if (note) note.textContent = "Received. The events desk replies within one working day.";
    });

    inquiry.addEventListener("input", (event) => {
      if (!event.target.matches("#inquiry-email, #inquiry-date, #inquiry-size")) return;
      event.target.removeAttribute("aria-invalid");
      event.target.removeAttribute("aria-describedby");
      if (note) note.textContent = "";
    });
  }

  const gallery = document.querySelector("[data-gallery]");
  const lightbox = document.querySelector("[data-lightbox]");
  if (gallery && lightbox) {
    const images = [...gallery.querySelectorAll("img")];
    const lightboxImage = lightbox.querySelector("[data-lightbox-image]");
    const lightboxCaption = lightbox.querySelector("[data-lightbox-caption]");
    let currentImage = 0;
    const showImage = (index) => {
      currentImage = (index + images.length) % images.length;
      const image = images[currentImage];
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = image.alt;
    };
    images.forEach((image, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-item";
      button.setAttribute("aria-label", `View image: ${image.alt}`);
      image.parentNode.insertBefore(button, image);
      button.append(image);
      button.addEventListener("click", () => {
        showImage(index);
        openModal(lightbox, button);
      });
    });
    lightbox.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => showImage(currentImage - 1));
    lightbox.querySelector("[data-lightbox-next]")?.addEventListener("click", () => showImage(currentImage + 1));
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") showImage(currentImage - 1);
      if (event.key === "ArrowRight") showImage(currentImage + 1);
    });
  }

  const backToTop = document.createElement("button");
  backToTop.type = "button";
  backToTop.className = "back-to-top";
  backToTop.setAttribute("aria-label", "Back to top");
  backToTop.textContent = "↑";
  backToTop.hidden = true;
  document.body.append(backToTop);
  const updateBackToTop = () => {
    backToTop.hidden = window.scrollY < 500;
  };
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
})();
