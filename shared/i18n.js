(function (global, document) {
  "use strict";

  const LANGUAGE_KEY = "nafas.languagePreference.v1";
  const catalog = global.NafasTranslations;
  const entries = catalog && Array.isArray(catalog.static) ? catalog.static : [];
  const staticByEnglish = new Map(entries.map(entry => [entry[1], entry]));
  const staticByKey = new Map(entries.map(entry => [entry[0], entry]));
  const dynamic = catalog && catalog.dynamic ? catalog.dynamic : {};
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const dynamicText = new WeakMap();
  const dynamicAttributes = new WeakMap();
  let language = "en";
  let originalTitle = document.title;

  function t(key, values) {
    const entry = dynamic[key];
    const staticEntry = staticByKey.get(key);
    let result = entry ? entry[language] : staticEntry ? staticEntry[language === "ar" ? 2 : 1] : key;
    if (values) {
      Object.keys(values).forEach(name => {
        result = result.replaceAll(`{${name}}`, String(values[name]));
      });
    }
    return result;
  }

  function preserveWhitespace(source, translated) {
    const leading = (source.match(/^\s*/) || [""])[0];
    const trailing = (source.match(/\s*$/) || [""])[0];
    return leading + translated + trailing;
  }

  function isIgnored(node) {
    const parent = node.parentElement;
    return !parent || parent.closest("script, style, noscript, .language-switcher, [data-i18n-ignore], [data-i18n-dynamic]");
  }

  function translateStaticText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (isIgnored(node)) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      const normalized = source.replace(/\s+/g, " ").trim();
      const entry = staticByEnglish.get(normalized);
      if (entry) node.nodeValue = preserveWhitespace(source, entry[language === "ar" ? 2 : 1]);
    }
  }

  function translateStaticAttributes() {
    const attributes = ["aria-label", "alt", "placeholder", "title"];
    document.querySelectorAll("body *").forEach(element => {
      if (element.closest(".language-switcher, [data-i18n-ignore]")) return;
      let saved = originalAttributes.get(element);
      if (!saved) {
        saved = {};
        attributes.forEach(name => {
          if (element.hasAttribute(name)) saved[name] = element.getAttribute(name);
        });
        originalAttributes.set(element, saved);
      }
      attributes.forEach(name => {
        if (!(name in saved)) return;
        const entry = staticByEnglish.get(saved[name]);
        if (entry) element.setAttribute(name, entry[language === "ar" ? 2 : 1]);
      });
    });

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      if (!description.dataset.i18nOriginal) description.dataset.i18nOriginal = description.content;
      const entry = staticByEnglish.get(description.dataset.i18nOriginal);
      if (entry) description.content = entry[language === "ar" ? 2 : 1];
    }
    const titleEntry = staticByEnglish.get(originalTitle);
    if (titleEntry) document.title = titleEntry[language === "ar" ? 2 : 1];
  }

  function renderDynamicText() {
    document.querySelectorAll("[data-i18n-dynamic]").forEach(element => {
      const data = dynamicText.get(element);
      if (data) element.textContent = t(data.key, data.values);
    });
    document.querySelectorAll("[data-i18n-dynamic-attribute]").forEach(element => {
      const data = dynamicAttributes.get(element);
      if (data) element.setAttribute(data.attribute, t(data.key, data.values));
    });
  }

  function updateSwitchers() {
    document.querySelectorAll(".language-switcher").forEach(group => {
      const groupLabel = staticByEnglish.get("Select language");
      if (groupLabel) group.setAttribute("aria-label", groupLabel[language === "ar" ? 2 : 1]);
      group.querySelectorAll("[data-language-option]").forEach(button => {
        const selected = button.dataset.languageOption === language;
        const label = button.dataset.languageOption === "ar" ? "Switch language to Arabic" : "Switch language to English";
        const labelEntry = staticByEnglish.get(label);
        button.setAttribute("aria-pressed", String(selected));
        if (labelEntry) button.setAttribute("aria-label", labelEntry[language === "ar" ? 2 : 1]);
      });
    });
  }

  function setLanguage(nextLanguage, persist) {
    language = nextLanguage === "ar" ? "ar" : "en";
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    translateStaticText();
    translateStaticAttributes();
    renderDynamicText();
    updateSwitchers();
    if (persist !== false) {
      try { global.localStorage.setItem(LANGUAGE_KEY, language); } catch (error) {}
    }
    document.dispatchEvent(new CustomEvent("nafas:languagechange", { detail: { language } }));
  }

  function setText(element, key, values) {
    if (!element) return;
    dynamicText.set(element, { key, values });
    element.setAttribute("data-i18n-dynamic", "");
    element.textContent = t(key, values);
  }

  function clearText(element) {
    if (!element) return;
    dynamicText.delete(element);
    element.removeAttribute("data-i18n-dynamic");
    element.textContent = "";
  }

  function setAttribute(element, attribute, key, values) {
    if (!element) return;
    dynamicAttributes.set(element, { attribute, key, values });
    element.setAttribute("data-i18n-dynamic-attribute", "");
    element.setAttribute(attribute, t(key, values));
  }

  function readPreference() {
    try { return global.localStorage.getItem(LANGUAGE_KEY) === "ar" ? "ar" : "en"; }
    catch (error) { return "en"; }
  }

  document.querySelectorAll("[data-language-option]").forEach(button => {
    button.addEventListener("click", () => setLanguage(button.dataset.languageOption));
  });

  global.NafasI18n = {
    key: LANGUAGE_KEY,
    t,
    setText,
    clearText,
    setAttribute,
    setLanguage: nextLanguage => setLanguage(nextLanguage),
    getLanguage: () => language
  };

  setLanguage(readPreference(), false);
}(window, document));
