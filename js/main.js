document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.querySelector(".site-header") || document.querySelector("header");
  const menuSection = document.getElementById("menu");
  const filtersBar = document.getElementById("menu-filters") || document.querySelector(".filters");
  const menuContainer = document.getElementById("menu-container");

  function syncStickyMetrics() {
    if (!header) return;
    const headerHeight = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-height", headerHeight + "px");

    if (filtersBar) {
      const filtersTop = filtersBar.getBoundingClientRect().top;
      const isStuck = Math.abs(filtersTop - headerHeight) <= 2;
      filtersBar.classList.toggle("is-stuck", isStuck);
    }
  }

  syncStickyMetrics();
  window.addEventListener("scroll", syncStickyMetrics, { passive: true });
  window.addEventListener("resize", syncStickyMetrics, { passive: true });
  window.addEventListener("load", syncStickyMetrics);

  if ("ResizeObserver" in window && header) {
    new ResizeObserver(syncStickyMetrics).observe(header);
  }

  function applyCategoryFilter(filterValue, activeBtn) {
    if (!menuContainer) return;

    if (filtersBar) {
      filtersBar.querySelectorAll("button").forEach((btn) => {
        const isMatch = btn === activeBtn || btn.dataset.filter === filterValue;
        btn.classList.toggle("active", isMatch);
        btn.setAttribute("aria-selected", isMatch ? "true" : "false");
      });
    }

    const isAll = filterValue === "all";
    menuContainer.classList.toggle("is-filtered", !isAll);

    menuContainer.querySelectorAll(".panel").forEach((panel) => {
      const show = isAll || panel.dataset.categoryIndex === filterValue;
      panel.hidden = !show;
    });

    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }

    if (menuSection) {
      const headerOffset = header ? header.getBoundingClientRect().height : 0;
      const menuTop = menuSection.getBoundingClientRect().top + window.scrollY - headerOffset;
      if (window.scrollY > menuTop + 32) {
        window.scrollTo({ top: menuTop, behavior: "smooth" });
      }
    }

    requestAnimationFrame(syncStickyMetrics);
  }

  // Render Menu Panels & Sticky Category Filter Pills
  const rawMenuData = typeof menuData !== "undefined" ? menuData : window.menuData;

  if (menuContainer && Array.isArray(rawMenuData)) {
    menuContainer.innerHTML = "";
    if (filtersBar) filtersBar.innerHTML = "";

    const validCategories = rawMenuData.filter(
      (catObj) => catObj && typeof catObj.category === "string" && Array.isArray(catObj.items)
    );

    if (filtersBar) {
      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "active";
      allBtn.dataset.filter = "all";
      allBtn.setAttribute("role", "tab");
      allBtn.setAttribute("aria-selected", "true");
      allBtn.textContent = "ALL ITEMS";
      filtersBar.appendChild(allBtn);
    }

    validCategories.forEach((cat, idx) => {
      const catIndex = String(idx);
      const catNameLower = cat.category.toLowerCase();
      const isSalsa = catNameLower.includes("salsa");
      const isBowl = catNameLower.includes("build your own bowl");

      if (filtersBar) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.filter = catIndex;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", "false");
        btn.textContent = isSalsa ? "House Salsas" : cat.category;
        filtersBar.appendChild(btn);
      }

      const panel = document.createElement("div");
      panel.className = isSalsa ? "panel salsa" : "panel";
      panel.dataset.categoryIndex = catIndex;

      let html = `
        <div class="panel-header">
          <h3>${escapeHtml(cat.category)}</h3>
          ${cat.price ? `<span class="cat-price">${escapeHtml(cat.price)}</span>` : ""}
        </div>
      `;

      if (cat.description) {
        html += `<p class="category-desc">${formatMultiline(cat.description)}</p>`;
      }

      cat.items.forEach((item) => {
        if (!item) return;
        if (isSalsa) {
          html += `
            <div class="item salsa-item">
              <div class="item-top">
                <span class="item-title">${escapeHtml(item.name)}</span>
                ${item.price ? `<span class="salsa-badge">${escapeHtml(item.price)}</span>` : ""}
              </div>
              ${item.description ? `<p class="desc">${formatMultiline(item.description)}</p>` : ""}
            </div>
          `;
        } else if (isBowl) {
          html += `
            <div class="item bowl-item">
              <div class="item-top">
                <span class="item-title">${escapeHtml(item.name)}</span>
                ${item.price ? `<span class="bowl-tag">${escapeHtml(item.price)}</span>` : ""}
              </div>
              ${item.description ? `<p class="desc">${formatMultiline(item.description)}</p>` : ""}
            </div>
          `;
        } else {
          html += `
            <div class="item">
              <div class="item-top">
                <span class="item-title">${escapeHtml(item.name)}</span>
                <span class="price">${escapeHtml(item.price || "")}</span>
              </div>
              ${item.description ? `<p class="desc">${formatMultiline(item.description)}</p>` : ""}
            </div>
          `;
        }
      });

      panel.innerHTML = html;
      menuContainer.appendChild(panel);
    });

    if (filtersBar) {
      filtersBar.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.filter) return;
        applyCategoryFilter(btn.dataset.filter, btn);
      });
    }
  }

  // Order Modal Logic
  const orderUrl = "https://order.toasttab.com/online/taco-heist-westfield";
  const modal = document.getElementById("orderModal");
  const proceedBtn = document.getElementById("proceedOrderBtn");
  const cancelBtn = document.getElementById("cancelOrderBtn");
  let lastFocusedTrigger = null;

  const closeModal = () => {
    if (modal) modal.classList.remove("active");
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  };

  document.querySelectorAll(".order-popup-trigger, .order-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      lastFocusedTrigger = trigger;
      if (modal) {
        modal.classList.add("active");
        if (proceedBtn) proceedBtn.focus();
      }
    });
  });

  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      closeModal();
      window.open(orderUrl, "_blank", "noopener,noreferrer");
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });
});

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMultiline(str) {
  return escapeHtml(str).split("\r").join("").split("\n").join("<br>");
}
