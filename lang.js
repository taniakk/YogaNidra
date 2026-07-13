/**
 * lang.js — Google Translate Widget for YogaNidra
 * 100% FREE — No API key required.
 * Supported: English, Hindi (hi), Marathi (mr) — and 100+ more languages automatically.
 * Injects a custom-styled language switcher that hooks into Google Translate.
 */

// ─── 1. Load Google Translate script once ────────────────────────────────────
(function loadGoogleTranslate() {
  if (document.getElementById("google-translate-script")) return;
  const s = document.createElement("script");
  s.id = "google-translate-script";
  s.src =
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.head.appendChild(s);
})();

// ─── 2. Google's required callback ───────────────────────────────────────────
window.googleTranslateElementInit = function () {
  new window.google.translate.TranslateElement(
    {
      pageLanguage: "en",
      includedLanguages: "en,hi,mr",   // English, Hindi, Marathi
      autoDisplay: false,
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
    },
    "google_translate_element"         // hidden host div
  );
  // After widget is ready, hook our custom buttons
  setTimeout(hookCustomButtons, 800);
};

// ─── 3. Language meta ────────────────────────────────────────────────────────
const LANG_META = [
  { code: "en", label: "🇬🇧 English" },
  { code: "hi", label: "🇮🇳 हिन्दी" },
  { code: "mr", label: "🟠 मराठी" },
];

// ─── 4. Trigger Google Translate programmatically ────────────────────────────
function triggerGoogleTranslate(langCode) {
  // Save preference
  localStorage.setItem("yn_lang", langCode);

  if (langCode === "en") {
    // Restore original language
    const restore = document.querySelector(".goog-te-banner-frame");
    if (restore) {
      const btn =
        restore.contentDocument &&
        restore.contentDocument.querySelector(".goog-te-button button");
      if (btn) btn.click();
    }
    // Fallback: set cookie to reset
    document.cookie =
      "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie =
      "googtrans=; path=/; domain=." + location.hostname + "; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    location.reload();
    return;
  }

  // Set the googtrans cookie and reload for clean translation
  const val = `/en/${langCode}`;
  document.cookie = `googtrans=${val}; path=/`;
  document.cookie = `googtrans=${val}; path=/; domain=.${location.hostname}`;

  // Also trigger via the hidden select element Google injects
  const select = document.querySelector(".goog-te-combo");
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event("change"));
  } else {
    // Widget not ready yet — reload with cookie set
    location.reload();
  }
}

// ─── 5. Sync active button state from current cookie ─────────────────────────
function getActiveLang() {
  const match = document.cookie.match(/googtrans=\/en\/([a-z]+)/);
  if (match) return match[1];
  return localStorage.getItem("yn_lang") || "en";
}

// ─── 6. Build & inject the custom dropdown UI ────────────────────────────────
function buildDropdown(slot) {
  // Hidden host for Google's widget
  if (!document.getElementById("google_translate_element")) {
    const host = document.createElement("div");
    host.id = "google_translate_element";
    host.style.cssText = "position:absolute;visibility:hidden;height:0;overflow:hidden;";
    document.body.appendChild(host);
  }

  // Inject styles once
  if (!document.getElementById("yn-lang-styles")) {
    const style = document.createElement("style");
    style.id = "yn-lang-styles";
    style.textContent = `
      /* Hide Google's default toolbar banner */
      .goog-te-banner-frame, .skiptranslate { display:none !important; }
      body { top: 0 !important; }

      /* Custom dropdown */
      .yn-lang-wrapper { position: relative; display: inline-block; }
      .yn-lang-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,0.18); color: #fff;
        border: 1.5px solid rgba(255,255,255,0.35);
        padding: 7px 16px; border-radius: 999px;
        font-size: 0.82rem; font-weight: 600; cursor: pointer;
        backdrop-filter: blur(6px);
        transition: background 0.3s, color 0.3s, border-color 0.3s;
        white-space: nowrap; font-family: inherit;
      }
      .yn-lang-btn:hover { background: rgba(255,255,255,0.28); }
      /* Scrolled state — white navbar */
      .yn-lang-btn.yn-scrolled {
        background: #fff;
        color: #1a1a1a;
        border-color: #e0d0d8;
      }
      .yn-lang-btn.yn-scrolled:hover { background: #fdf0f5; color: #D37198; }
      /* Light-navbar pages (contact.html etc.) — always dark style */
      .yn-lang-btn.yn-light-nav {
        background: linear-gradient(135deg,#D37198,#BD73A4);
        color: #fff;
        border: none;
      }
      .yn-lang-btn .yn-arrow { font-size: 0.6rem; transition: transform 0.2s; }
      .yn-lang-btn.open .yn-arrow { transform: rotate(180deg); }
      .yn-lang-menu {
        display: none; position: absolute; right: 0; top: calc(100% + 8px);
        background: #fff; border-radius: 16px;
        box-shadow: 0 8px 32px rgba(211,113,152,0.18);
        overflow: hidden; min-width: 155px; z-index: 9999;
        border: 1px solid #f5e5f0;
      }
      .yn-lang-menu.open { display: block; animation: ynDrop 0.18s ease; }
      @keyframes ynDrop {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .yn-lang-opt {
        display: flex; align-items: center; gap: 8px;
        padding: 11px 18px; font-size: 0.85rem; font-weight: 600;
        color: #444; cursor: pointer; transition: background 0.15s, color 0.15s;
        font-family: inherit;
      }
      .yn-lang-opt:hover { background: #fdf0f5; color: #D37198; }
      .yn-lang-opt.active { color: #D37198; background: #fdf0f5; }
    `;
    document.head.appendChild(style);
  }

  const activeLang = getActiveLang();
  const activeLabel =
    LANG_META.find((l) => l.code === activeLang)?.label || "🇬🇧 English";

  const wrapper = document.createElement("div");
  wrapper.className = "yn-lang-wrapper";
  wrapper.innerHTML = `
    <button class="yn-lang-btn" id="yn-lang-toggle" aria-haspopup="true" aria-expanded="false">
      <span id="yn-lang-label">${activeLabel}</span>
      <span class="yn-arrow">▼</span>
    </button>
    <div class="yn-lang-menu" id="yn-lang-menu" role="listbox">
      ${LANG_META.map(
        (l) =>
          `<div class="yn-lang-opt${l.code === activeLang ? " active" : ""}"
               data-code="${l.code}" role="option">${l.label}</div>`
      ).join("")}
    </div>
  `;

  slot.appendChild(wrapper);

  // Auto-detect light navbar pages (contact.html, navpalavi.html) → pink button
  const nav = document.querySelector("header, nav");
  const isLightNavPage =
    nav &&
    (window.getComputedStyle(nav).backgroundColor.includes("255, 255, 255") ||
      nav.classList.contains("bg-white") ||
      document.querySelector("nav.fixed.bg-white") !== null);

  const langBtn = wrapper.querySelector(".yn-lang-btn");
  if (isLightNavPage) {
    langBtn.classList.add("yn-light-nav");
  }

  // ── Scroll listener: match other nav links color change ──────────────────
  // Only applies on pages with pink-top navbar (index.html etc.)
  if (!isLightNavPage) {
    const onScroll = () => {
      if (window.scrollY > 50) {
        langBtn.classList.add("yn-scrolled");
      } else {
        langBtn.classList.remove("yn-scrolled");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on load in case already scrolled
  }

  // Toggle open/close
  const btn = wrapper.querySelector("#yn-lang-toggle");
  const menu = wrapper.querySelector("#yn-lang-menu");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("open");
    btn.classList.toggle("open", isOpen);
    btn.setAttribute("aria-expanded", isOpen);
  });

  // Language option click
  wrapper.querySelectorAll(".yn-lang-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      const code = opt.getAttribute("data-code");

      // Update active state
      wrapper.querySelectorAll(".yn-lang-opt").forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");

      // Update button label
      document.getElementById("yn-lang-label").textContent = opt.textContent.trim();

      // Close menu
      menu.classList.remove("open");
      btn.classList.remove("open");

      // Trigger translation
      triggerGoogleTranslate(code);
    });
  });

  // Close on outside click
  document.addEventListener("click", () => {
    menu.classList.remove("open");
    btn.classList.remove("open");
  });
}

// ─── 7. Hook buttons to the already-initialised Google widget ─────────────────
function hookCustomButtons() {
  // Nothing extra needed — triggerGoogleTranslate handles it.
}

// ─── 8. Init: place dropdown in every lang-switcher-slot on page ──────────────
function initLangDropdown() {
  const slots = document.querySelectorAll("#lang-switcher-slot");
  slots.forEach((slot) => {
    if (!slot.dataset.ynInit) {
      slot.dataset.ynInit = "1";
      buildDropdown(slot);
    }
  });
}

// Auto-init when DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLangDropdown);
} else {
  initLangDropdown();
}
