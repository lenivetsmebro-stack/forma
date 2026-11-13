(function () {
  "use strict";

  var CATEGORIES = [
    { id: "hair", label: "Волосы" },
    { id: "nails", label: "Ногти" },
    { id: "brows", label: "Брови и ресницы" },
    { id: "face", label: "Уход за лицом" }
  ];

  var SERVICES = [
    { id: "cut-w", cat: "hair", name: "Женская стрижка", note: "с мытьём и укладкой", price: 2200, from: true, min: 60 },
    { id: "cut-m", cat: "hair", name: "Мужская стрижка", note: "машинка и ножницы", price: 1400, from: false, min: 45 },
    { id: "color", cat: "hair", name: "Окрашивание в один тон", note: "с уходом", price: 4500, from: true, min: 120 },
    { id: "airtouch", cat: "hair", name: "Сложное окрашивание", note: "AirTouch, балаяж", price: 9000, from: true, min: 240 },
    { id: "styling", cat: "hair", name: "Укладка", note: "на брашинг или локоны", price: 1800, from: true, min: 45 },
    { id: "mani", cat: "nails", name: "Маникюр с покрытием", note: "комбинированный, гель-лак", price: 2300, from: false, min: 90 },
    { id: "mani-clean", cat: "nails", name: "Маникюр без покрытия", note: "комбинированный", price: 1300, from: false, min: 60 },
    { id: "pedi", cat: "nails", name: "Педикюр с покрытием", note: "аппаратный", price: 2900, from: false, min: 90 },
    { id: "brows", cat: "brows", name: "Коррекция и окрашивание бровей", note: "хной или краской", price: 1500, from: false, min: 45 },
    { id: "lami", cat: "brows", name: "Ламинирование ресниц", note: "с окрашиванием", price: 2500, from: false, min: 60 },
    { id: "lash", cat: "brows", name: "Наращивание ресниц", note: "классика, 2D", price: 3000, from: true, min: 120 },
    { id: "clean", cat: "face", name: "Комбинированная чистка", note: "с маской и уходом", price: 3800, from: false, min: 90 },
    { id: "peel", cat: "face", name: "Пилинг", note: "подбор по типу кожи", price: 3000, from: true, min: 60 },
    { id: "massage", cat: "face", name: "Массаж лица", note: "скульптурный", price: 2600, from: false, min: 45 }
  ];

  var MASTERS = [
    { id: "olga", name: "Ольга", role: "Топ-стилист", years: 9, cats: ["hair"], tone: "#d8b4a6" },
    { id: "max", name: "Максим", role: "Барбер, стилист", years: 6, cats: ["hair"], tone: "#b9c2b0" },
    { id: "anna", name: "Анна", role: "Мастер ногтевого сервиса", years: 7, cats: ["nails"], tone: "#e3c7b7" },
    { id: "vika", name: "Виктория", role: "Мастер маникюра и педикюра", years: 5, cats: ["nails"], tone: "#c9b7c9" },
    { id: "dasha", name: "Дарья", role: "Бровист, лэшмейкер", years: 6, cats: ["brows"], tone: "#d6c3a5" },
    { id: "irina", name: "Ирина", role: "Косметолог-эстетист", years: 11, cats: ["face"], tone: "#b7c6c6" }
  ];

  var OPEN = 10 * 60;
  var CLOSE = 21 * 60;
  var STEP = 30;
  var DAYS = 14;

  var state = { step: 1, cat: "hair", serviceId: null, masterId: null, dateIndex: 0, time: null, name: "", phone: "", sent: false };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return node;
  }
  function rub(v, from) { return (from ? "от " : "") + new Intl.NumberFormat("ru-RU").format(v) + " ₽"; }
  function dur(min) { var h = Math.floor(min / 60), m = min % 60; return (h ? h + " ч" : "") + (h && m ? " " : "") + (m ? m + " мин" : ""); }
  function hhmm(min) { var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m; }
  function service() { return SERVICES.find(function (s) { return s.id === state.serviceId; }) || null; }
  function master() { return MASTERS.find(function (m) { return m.id === state.masterId; }) || null; }

  function dayAt(index) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + index); return d; }
  var WEEK = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  function dayLabel(index) {
    var d = dayAt(index);
    if (index === 0) return "Сегодня";
    if (index === 1) return "Завтра";
    return d.getDate() + " " + MONTHS[d.getMonth()];
  }

  // Deterministic pseudo-random "busy" slots so the demo looks realistic and stable per day.
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function isBusy(masterId, dateIndex, minute) {
    var d = dayAt(dateIndex);
    var key = masterId + "|" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "|" + minute;
    return hash(key) % 100 < 38;
  }
  function freeSlots(masterId, dateIndex, length) {
    var now = new Date();
    var nowMin = dateIndex === 0 ? now.getHours() * 60 + now.getMinutes() + 30 : 0;
    var result = [];
    for (var t = OPEN; t + length <= CLOSE; t += STEP) {
      if (t < nowMin) continue;
      var ok = true;
      for (var x = t; x < t + length; x += STEP) { if (isBusy(masterId, dateIndex, x)) { ok = false; break; } }
      if (ok) result.push(t);
    }
    return result;
  }

  /* ---------- Price list ---------- */
  function renderTabs() {
    var wrap = $("#service-tabs");
    wrap.innerHTML = "";
    CATEGORIES.forEach(function (c) {
      wrap.appendChild(el("button", {
        type: "button", role: "tab", class: "tab", "aria-selected": String(c.id === state.cat),
        text: c.label, onclick: function () { state.cat = c.id; renderTabs(); renderPrices(); }
      }));
    });
  }
  function renderPrices() {
    var list = $("#price-list");
    list.innerHTML = "";
    SERVICES.filter(function (s) { return s.cat === state.cat; }).forEach(function (s) {
      list.appendChild(el("div", { class: "price" }, [
        el("div", { class: "price__name" }, [el("strong", { text: s.name }), el("span", { text: s.note + " · " + dur(s.min) })]),
        el("span", { class: "price__value", text: rub(s.price, s.from) }),
        el("button", { type: "button", class: "price__book", text: "Записаться", "aria-label": "Записаться: " + s.name, onclick: function () { startWith(s.id); } })
      ]));
    });
  }
  function startWith(serviceId) {
    var s = SERVICES.find(function (x) { return x.id === serviceId; });
    state.cat = s.cat; state.serviceId = serviceId; state.masterId = null; state.time = null; state.step = 2; state.sent = false;
    renderBooking();
    $("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Masters ---------- */
  function initials(name) { return name.slice(0, 1); }
  function renderMasters() {
    var list = $("#masters-list");
    MASTERS.forEach(function (m) {
      var cats = m.cats.map(function (c) { return CATEGORIES.find(function (x) { return x.id === c; }).label; }).join(", ");
      list.appendChild(el("li", { class: "master" }, [
        el("span", { class: "avatar", style: "--tone:" + m.tone, "aria-hidden": "true", text: initials(m.name) }),
        el("div", null, [el("h3", { text: m.name }), el("p", { text: m.role }), el("p", { class: "master__meta", text: cats + " · стаж " + m.years + " лет" })])
      ]));
    });
  }

  /* ---------- Booking ---------- */
  function setStep(n) { state.step = n; renderBooking(); }

  function renderSummary() {
    var s = service(), m = master();
    var map = {
      service: s ? s.name : "—",
      master: m ? m.name : "—",
      time: state.time !== null ? dayLabel(state.dateIndex) + ", " + hhmm(state.time) : "—",
      duration: s ? dur(s.min) : "—",
      price: s ? rub(s.price, s.from) : "—"
    };
    Object.keys(map).forEach(function (k) { var node = $('[data-field="' + k + '"]'); if (node) node.textContent = map[k]; });
    document.querySelectorAll(".booking__steps li").forEach(function (li) {
      var n = Number(li.getAttribute("data-step"));
      li.classList.toggle("is-active", n === state.step && !state.sent);
      li.classList.toggle("is-done", n < state.step || state.sent);
    });
  }

  function backButton(to) {
    return el("button", { type: "button", class: "btn btn--ghost", text: "Назад", onclick: function () { setStep(to); } });
  }

  function renderStep1(panel) {
    panel.appendChild(el("h3", { class: "panel__title", text: "Выберите услугу" }));
    var cats = el("div", { class: "chips", role: "tablist", "aria-label": "Категория" });
    CATEGORIES.forEach(function (c) {
      cats.appendChild(el("button", { type: "button", class: "chip", "aria-pressed": String(c.id === state.cat), text: c.label, onclick: function () { state.cat = c.id; renderBooking(); } }));
    });
    panel.appendChild(cats);
    var list = el("div", { class: "options" });
    SERVICES.filter(function (s) { return s.cat === state.cat; }).forEach(function (s) {
      list.appendChild(el("button", {
        type: "button", class: "option" + (s.id === state.serviceId ? " is-selected" : ""),
        onclick: function () { state.serviceId = s.id; state.masterId = null; state.time = null; setStep(2); }
      }, [el("span", { class: "option__main" }, [el("strong", { text: s.name }), el("small", { text: dur(s.min) })]), el("span", { class: "option__side", text: rub(s.price, s.from) })]));
    });
    panel.appendChild(list);
  }

  function renderStep2(panel) {
    var s = service();
    panel.appendChild(el("h3", { class: "panel__title", text: "Выберите мастера" }));
    var list = el("div", { class: "options" });
    MASTERS.filter(function (m) { return m.cats.indexOf(s.cat) !== -1; }).forEach(function (m) {
      var nearest = null;
      for (var d = 0; d < DAYS && nearest === null; d++) { var f = freeSlots(m.id, d, s.min); if (f.length) nearest = dayLabel(d) + ", " + hhmm(f[0]); }
      list.appendChild(el("button", {
        type: "button", class: "option" + (m.id === state.masterId ? " is-selected" : ""),
        onclick: function () { state.masterId = m.id; state.time = null; state.dateIndex = 0; setStep(3); }
      }, [
        el("span", { class: "avatar avatar--small", style: "--tone:" + m.tone, "aria-hidden": "true", text: initials(m.name) }),
        el("span", { class: "option__main" }, [el("strong", { text: m.name }), el("small", { text: m.role })]),
        el("span", { class: "option__side option__side--muted", text: nearest ? "ближайшее: " + nearest : "нет окон" })
      ]));
    });
    panel.appendChild(list);
    panel.appendChild(el("div", { class: "panel__actions" }, [backButton(1)]));
  }

  function renderStep3(panel) {
    var s = service(), m = master();
    panel.appendChild(el("h3", { class: "panel__title", text: "Выберите дату и время" }));
    var days = el("div", { class: "days", role: "listbox", "aria-label": "Дата" });
    for (var i = 0; i < DAYS; i++) {
      (function (idx) {
        var d = dayAt(idx);
        var hasSlots = freeSlots(m.id, idx, s.min).length > 0;
        days.appendChild(el("button", {
          type: "button", class: "day" + (idx === state.dateIndex ? " is-selected" : ""), role: "option",
          "aria-selected": String(idx === state.dateIndex), disabled: hasSlots ? null : "disabled",
          onclick: function () { state.dateIndex = idx; state.time = null; renderBooking(); }
        }, [el("span", { text: idx === 0 ? "сег" : WEEK[d.getDay()] }), el("strong", { text: String(d.getDate()) })]));
        if (!hasSlots) days.lastChild.setAttribute("disabled", "disabled"); else days.lastChild.removeAttribute("disabled");
      })(i);
    }
    panel.appendChild(days);
    var slots = freeSlots(m.id, state.dateIndex, s.min);
    var grid = el("div", { class: "slots" });
    if (!slots.length) grid.appendChild(el("p", { class: "note", text: "На этот день свободных окон нет — выберите другую дату." }));
    slots.forEach(function (t) {
      grid.appendChild(el("button", { type: "button", class: "slot" + (t === state.time ? " is-selected" : ""), text: hhmm(t), onclick: function () { state.time = t; setStep(4); } }));
    });
    panel.appendChild(grid);
    panel.appendChild(el("div", { class: "panel__actions" }, [backButton(2)]));
  }

  var PHONE_RE = /^\+?[\d\s()-]{10,18}$/;
  var LINK_STYLE = "color:inherit;text-decoration:underline;text-underline-offset:3px";

  function renderStep4(panel) {
    panel.appendChild(el("h3", { class: "panel__title", text: "Как с вами связаться" }));
    var form = el("form", { class: "form", novalidate: "novalidate" });
    var nameInput = el("input", { id: "b-name", name: "name", autocomplete: "name", value: state.name });
    var phoneInput = el("input", { id: "b-phone", name: "phone", type: "tel", autocomplete: "tel", inputmode: "tel", placeholder: "+7", value: state.phone });
    var consent = el("input", { type: "checkbox", id: "b-consent" });
    var errName = el("p", { class: "error", id: "b-name-error", hidden: "hidden" });
    var errPhone = el("p", { class: "error", id: "b-phone-error", hidden: "hidden" });
    var errConsent = el("p", { class: "error", id: "b-consent-error", hidden: "hidden" });
    function showError(input, node, msg) {
      if (msg) { node.textContent = msg; node.removeAttribute("hidden"); input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", node.id); }
      else { node.setAttribute("hidden", "hidden"); input.removeAttribute("aria-invalid"); input.removeAttribute("aria-describedby"); }
    }
    form.appendChild(el("div", { class: "field" }, [el("label", { for: "b-name", text: "Имя" }), nameInput, errName]));
    form.appendChild(el("div", { class: "field" }, [el("label", { for: "b-phone", text: "Телефон" }), phoneInput, errPhone]));
    form.appendChild(el("div", { class: "field field--check" }, [el("label", { for: "b-consent" }, [consent, el("span", null, [
      "Даю ",
      el("a", { href: "consent.html", target: "_blank", style: LINK_STYLE, text: "согласие на обработку персональных данных" }),
      " на условиях ",
      el("a", { href: "privacy.html", target: "_blank", style: LINK_STYLE, text: "политики конфиденциальности" })
    ])]), errConsent]));
    form.appendChild(el("div", { class: "panel__actions" }, [backButton(3), el("button", { type: "submit", class: "btn", text: "Подтвердить запись" })]));
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      state.name = nameInput.value.trim(); state.phone = phoneInput.value.trim();
      var bad = null;
      showError(nameInput, errName, state.name.length < 2 ? "Как к вам обращаться?" : null); if (state.name.length < 2) bad = bad || nameInput;
      var phoneBad = !PHONE_RE.test(state.phone);
      showError(phoneInput, errPhone, phoneBad ? "Укажите номер телефона, например +7 900 123-45-67" : null); if (phoneBad) bad = bad || phoneInput;
      showError(consent, errConsent, consent.checked ? null : "Нужно согласие на обработку данных"); if (!consent.checked) bad = bad || consent;
      if (bad) { bad.focus(); return; }
      state.sent = true; renderBooking();
    });
    panel.appendChild(form);
    panel.appendChild(el("p", { class: "note", text: "Демо: запись проверяется, но никуда не отправляется." }));
  }

  function renderDone(panel) {
    var s = service(), m = master();
    panel.appendChild(el("div", { class: "done", role: "status" }, [
      el("span", { class: "done__icon", "aria-hidden": "true", text: "✓" }),
      el("h3", { class: "panel__title", text: "Вы записаны, " + state.name + "!" }),
      el("p", { text: s.name + " у мастера " + m.name + " — " + dayLabel(state.dateIndex).toLowerCase() + " в " + hhmm(state.time) + "." }),
      el("p", { class: "note", text: "Мы напомним о визите за день. Перенести или отменить можно не позднее чем за 3 часа." }),
      el("button", { type: "button", class: "btn btn--ghost", text: "Записаться ещё", onclick: function () { state = { step: 1, cat: state.cat, serviceId: null, masterId: null, dateIndex: 0, time: null, name: state.name, phone: state.phone, sent: false }; renderBooking(); } })
    ]));
  }

  function renderBooking() {
    var panel = $("#booking-panel");
    panel.innerHTML = "";
    if (state.sent) renderDone(panel);
    else if (state.step === 1 || !service()) { state.step = 1; renderStep1(panel); }
    else if (state.step === 2 || !master()) { state.step = 2; renderStep2(panel); }
    else if (state.step === 3 || state.time === null) { state.step = 3; renderStep3(panel); }
    else renderStep4(panel);
    renderSummary();
  }

  function renderNearest() {
    var node = $("#nearest-slot"); if (!node) return;
    var s = SERVICES.find(function (x) { return x.id === "mani"; });
    for (var d = 0; d < DAYS; d++) {
      var f = freeSlots("anna", d, s.min);
      if (f.length) { node.textContent = dayLabel(d) + ", " + hhmm(f[0]); return; }
    }
  }

  renderTabs();
  renderPrices();
  renderMasters();
  renderBooking();
  renderNearest();
})();
