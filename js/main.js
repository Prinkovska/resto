/* Бюро ресторанних рішень: поведінка сторінки */
(function () {
  'use strict';

  /* ============ НАЛАШТУВАННЯ: заповнити перед запуском ============
     phone    — номер для tel: і показу, напр. '+380671234567'
     telegram — нік без @, напр. 'dima_chef'
     endpoint — адреса, що приймає заявку POST JSON і пересилає в Telegram
                (Google Apps Script, Cloudflare Worker тощо). Токен бота
                НЕ можна класти сюди: він має жити на сервері. */
  var CONFIG = {
    phone: '',
    telegram: '',
    endpoint: ''
  };

  var mqMobile = window.matchMedia('(max-width: 820px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- контакти з налаштувань ---------- */
  if (CONFIG.phone) {
    $$('[data-phone]').forEach(function (a) {
      a.href = 'tel:' + CONFIG.phone;
      a.textContent = CONFIG.phone.replace(/^(\+380)(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
    });
  }
  if (CONFIG.telegram) {
    $$('[data-tg]').forEach(function (a) {
      a.href = 'https://t.me/' + CONFIG.telegram;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }


  /* ---------- меню ---------- */
  var nav = $('#nav');
  var burger = $('.nav__burger', nav);
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  $$('.nav__menu a, .nav__menu button', nav).forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- прокрутка: шапка, прогрес, кнопки зв'язку ---------- */
  var bar = $('.progress i');
  var tgFloat = $('.contact-float');
  var heroEl = $('.hero');
  var finalEl = $('#konsultatsiya');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (tgFloat) {
      var afterHero = heroEl ? y > heroEl.offsetHeight * 0.8 : y > 400;
      var atFinal = finalEl ? finalEl.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
      var calcEl = document.getElementById('kalkulyator');
      var cr = calcEl ? calcEl.getBoundingClientRect() : null;
      var atCalc = cr ? cr.top < window.innerHeight * 0.7 && cr.bottom > window.innerHeight * 0.3 : false;
      var reelEl = document.getElementById('etapy');
      var rr = reelEl && !mqMobile.matches ? reelEl.getBoundingClientRect() : null;
      var atReel = rr ? rr.top < window.innerHeight * 0.5 && rr.bottom > window.innerHeight * 0.5 : false;
      tgFloat.classList.toggle('is-on', afterHero && !atFinal && !atCalc && !atReel);
    }
    parallax();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- паралакс ---------- */
  var plx = reduceMotion ? [] : $$('[data-parallax]');
  function parallax() {
    var vh = window.innerHeight;
    plx.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var k = parseFloat(el.dataset.parallax) || 0;
      var mid = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (mid * k).toFixed(1) + 'px,0)';
    });
  }
  onScroll();

  /* ---------- активний пункт меню ---------- */
  var links = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) secObs.observe(s);
    });
  }

  /* ---------- безкінечні стрічки: дублюємо вміст ---------- */
  $$('.iconbelt__track, .dishes__track').forEach(function (t) {
    var kids = [].slice.call(t.children);
    kids.forEach(function (k) {
      var c = k.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      var img = c.querySelector('img');
      if (img) img.alt = '';
      t.appendChild(c);
    });
  });

  /* ---------- заголовки по словах ---------- */
  $$('[data-split]').forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });
  $$('.formats__list li').forEach(function (li, i) { li.style.setProperty('--k', i); });

  /* ---------- поява на скролі ---------- */
  var revealSel = '[data-reveal], [data-split], .draw, .facts, .stack__card, .case, .card-doc, .menu, .versus, .receipt-wrap';
  var countDone = new WeakSet();
  function onIn(el) {
    el.classList.add('is-in');
    if (el.classList.contains('menu')) $$('[data-count]', el).forEach(countUp);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { onIn(e.target); ro.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$(revealSel).forEach(function (el) { ro.observe(el); });
  } else {
    $$(revealSel).forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- лічильники цін ---------- */
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function countUp(el) {
    if (countDone.has(el)) return;
    countDone.add(el);
    var to = parseFloat(el.dataset.count);
    var t0 = null, dur = 1300;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- нахил карток і світло під курсором ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        c.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', function () {
        c.style.setProperty('--rx', '0deg');
        c.style.setProperty('--ry', '0deg');
      });
    });
    $$('.spotlight').forEach(function (s) {
      s.addEventListener('pointermove', function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        s.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    // «магнітні» головні кнопки
    $$('.btn--primary').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (x * 0.12).toFixed(1) + 'px,' + (y * 0.25).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- вкладки «приміщення є / немає» ---------- */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var ink = $('.tabs__ink', box);
    function moveInk(t) {
      if (!ink) return;
      ink.style.width = t.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + (t.offsetLeft - 4) + 'px)';
    }
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      moveInk(t);
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          select(n, true);
        }
      });
    });
    var cur = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    requestAnimationFrame(function () { moveInk(cur); });
    window.addEventListener('resize', function () {
      moveInk(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(cur); });
  });

  /* ---------- FAQ ---------- */
  $$('.faq__item').forEach(function (item) {
    var btn = $('button', item);
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- попап-форма ---------- */
  var modal = $('#lead-modal');
  // тексти попапу під різні кнопки; за замовчуванням — первинний прорахунок
  var MODAL_TEXT = {
    address: { title: 'Підкажу формат для вашого приміщення', lead: 'Залиште ім\'я і телефон. Подивлюся адресу й передзвоню з ідеями, що там спрацює.', btn: 'Отримати підказку', extra: false },
    callback: { title: 'Передзвоню вам', lead: 'Залиште ім\'я і телефон. Передзвоню найближчим часом.', btn: 'Замовити дзвінок', extra: false },
    'hero-relaunch': { title: 'Перезапустимо ваш заклад', lead: 'Розкажіть, що зараз не так. Передзвоню, поставлю кілька питань і скажу, з чого почати.', btn: 'Обговорити перезапуск', extra: true }
  };
  var MODAL_DEFAULT = { title: 'Розкажіть про свою ідею', lead: 'Передзвоню, поставлю кілька питань і скажу, з чого почати.', btn: 'Отримати первинний прорахунок', extra: true };
  function openModal(source, address) {
    if (!modal) return;
    var src = $('input[name="source"]', modal);
    if (src) src.value = source || 'button';
    resetForm(modal);
    var addr = $('input[name="address"]', modal);
    if (addr) addr.value = address || '';
    var t = MODAL_TEXT[source] || MODAL_DEFAULT;
    $('#modal-title', modal).textContent = t.title;
    $('.modal__lead', modal).textContent = t.lead;
    $('[data-submit-text]', modal).textContent = t.btn;
    $$('[data-extra]', modal).forEach(function (f) { f.hidden = !t.extra; });
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    var first = $('input[name="name"]', modal);
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    if (!modal) return;
    if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open');
  }
  $$('[data-lead]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openModal(b.dataset.lead); });
  });
  // поки немає ніку Telegram, посилання на нього відкривають форму
  if (!CONFIG.telegram) {
    $$('[data-tg]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openModal('telegram'); });
    });
  }
  // поле адреси в блоці «Кому»: адреса переходить у попап разом з ім'ям і телефоном
  $$('[data-addr]').forEach(function (f) {
    var inp = f.elements.address;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = inp.value.trim();
      if (!v) { inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
      openModal('address', v);
    });
    inp.addEventListener('input', function () { inp.removeAttribute('aria-invalid'); });
  });
  $$('[data-todo]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
  if (modal) {
    $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeModal); });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  }

  /* ---------- перший екран: картка «Вже відкриті», заклади змінюються кожні 4 с ---------- */
  (function opened() {
    var box = $('.opened');
    if (!box) return;
    var pics = $$('.opened__pics img', box), items = $$('.opened__item', box), dots = $$('.opened__dots i', box);
    var i = 0, paused = false;
    function show(k) {
      [pics, items, dots].forEach(function (list) { list.forEach(function (el, j) { el.classList.toggle('is-on', j === k); }); });
    }
    box.addEventListener('mouseenter', function () { paused = true; });
    box.addEventListener('mouseleave', function () { paused = false; });
    if (reduceMotion || pics.length < 2) return;
    setInterval(function () {
      if (paused || document.hidden) return;
      i = (i + 1) % pics.length;
      show(i);
    }, 4000);
  })();

  /* ---------- етапи: перемикач «приміщення є / шукаю» (міняє лише тексти) ---------- */
  (function premisesSwitch() {
    var reelEl = document.getElementById('etapy');
    if (!reelEl) return;
    var btns = $$('.reel__switch button', reelEl);
    function set(v) {
      reelEl.dataset.premises = v;
      btns.forEach(function (b) { b.setAttribute('aria-checked', b.dataset.premises === v ? 'true' : 'false'); });
      var active = $('.reel__card.is-active', reelEl);
      if (active && !reduceMotion) { active.classList.remove('is-swap'); void active.offsetWidth; active.classList.add('is-swap'); }
      // той самий вибір підставляємо в калькулятор
      var calcRadio = $('[data-calc] input[name="premises"][value="' + (v === 'yes' ? 'є' : 'поки немає') + '"]');
      if (calcRadio && !calcRadio.checked) { calcRadio.checked = true; calcRadio.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.premises); }); });
  })();

  /* ---------- калькулятор-техкарта (суми тільки з прайсу Дмитра) ---------- */
  (function calc() {
    var form = $('[data-calc]');
    if (!form) return;
    var PRICES = [
      { label: 'до 20 м²', fee: 2800, inv: [10000, 18000] },
      { label: '20–40 м²', fee: 3300, inv: [15000, 25000] },
      { label: '40–60 м²', fee: 3600, inv: [20000, 40000] },
      { label: '60–80 м²', fee: 4800, inv: [35000, 65000] },
      { label: 'понад 80 м²', fee: null, inv: null }
    ];
    var feeEl = $('[data-calc-fee]', form), invEl = $('[data-calc-inv]', form), sumEl = $('[data-calc-sum]', form);
    var haveEl = $('[data-calc-have]', form), dateEl = $('[data-calc-date]', form), hidden = form.elements.calc;
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('uk-UA');
    function fmt(n) { return '$' + Math.round(n).toLocaleString('uk-UA').replace(/\s|,/g, ' '); }
    // тире з «невидимими склейками», щоб діапазон не розривався між рядками
    function range(a, b) { return fmt(a) + '⁠–⁠' + fmt(b).slice(1); }
    var shown = { fee: 2800, a: 10000, b: 18000 }, raf = 0;
    function animateTo(p) {
      cancelAnimationFrame(raf);
      var from = { fee: shown.fee, a: shown.a, b: shown.b };
      var to = { fee: p.fee, a: p.inv[0], b: p.inv[1] };
      var t0 = performance.now(), dur = reduceMotion ? 1 : 520;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        shown.fee = from.fee + (to.fee - from.fee) * e;
        shown.a = from.a + (to.a - from.a) * e;
        shown.b = from.b + (to.b - from.b) * e;
        feeEl.textContent = fmt(shown.fee);
        invEl.textContent = range(shown.a, shown.b);
        sumEl.textContent = range(shown.fee + shown.a, shown.fee + shown.b);
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    function update() {
      var i = +form.elements.area.value, p = PRICES[i];
      var have = $$('input[name="have"]:checked', form).map(function (c) { return c.value; });
      form.classList.toggle('is-custom', !p.fee);
      if (p.fee) animateTo(p);
      else { feeEl.textContent = 'рахую окремо'; invEl.textContent = 'залежить від проєкту'; sumEl.textContent = 'після консультації'; }
      haveEl.hidden = !have.length;
      form.classList.remove('is-tick'); void form.offsetWidth; form.classList.add('is-tick');
      hidden.value = [
        'площа: ' + p.label,
        'приміщення: ' + form.elements.premises.value,
        'вже є: ' + (have.join(', ') || '—'),
        p.fee ? 'показали: ' + fmt(p.fee) + ' + ' + range(p.inv[0], p.inv[1]) : 'показали: рахую окремо'
      ].join('; ');
    }
    form.addEventListener('change', function (e) { if (e.target.name !== 'name' && e.target.name !== 'phone') update(); });
    update();
  })();

  /* ---------- форма заявки ---------- */
  function digits(v) { return (v || '').replace(/\D/g, ''); }
  function maskPhone(input) {
    var d = digits(input.value);
    if (d.indexOf('380') !== 0) d = '380' + d.replace(/^0/, '');
    d = d.slice(0, 12);
    var p = '+' + d.slice(0, 3);
    if (d.length > 3) p += ' ' + d.slice(3, 5);
    if (d.length > 5) p += ' ' + d.slice(5, 8);
    if (d.length > 8) p += ' ' + d.slice(8, 10);
    if (d.length > 10) p += ' ' + d.slice(10, 12);
    input.value = p;
  }
  $$('[data-phone-mask]').forEach(function (i) {
    i.addEventListener('focus', function () { if (!i.value) i.value = '+380 '; });
    i.addEventListener('input', function () { maskPhone(i); });
    i.addEventListener('blur', function () { if (digits(i.value).length <= 3) i.value = ''; });
  });

  function resetForm(scope) {
    var form = $('form', scope), done = $('.lead-done', scope);
    if (!form || !done || done.hidden) return;
    form.reset();
    form.hidden = false;
    done.hidden = true;
  }

  $$('[data-form]').forEach(function (form) {
    var err = $('.lead-form__error', form);
    function fail(msg, field) {
      err.textContent = msg;
      err.hidden = false;
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
    }
    $$('input', form).forEach(function (i) {
      i.addEventListener('input', function () { i.removeAttribute('aria-invalid'); err.hidden = true; });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, phone = form.elements.phone;
      if (form.elements.company && form.elements.company.value) return; // бот
      if (!name.value.trim()) return fail('Вкажіть, як до вас звертатися.', name);
      if (digits(phone.value).length !== 12) return fail('Вкажіть телефон повністю: +380 і 9 цифр.', phone);

      var data = {
        name: name.value.trim(),
        phone: phone.value,
        format: (form.elements.format && form.elements.format.value) || '',
        premises: (form.elements.premises && form.elements.premises.value) || '',
        calc: (form.elements.calc && form.elements.calc.value) || '',
        address: (form.elements.address && form.elements.address.value) || '',
        source: form.elements.source.value,
        page: location.href,
        time: new Date().toISOString()
      };
      var btn = $('button[type="submit"]', form);
      btn.disabled = true;
      var send = CONFIG.endpoint
        ? fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
        : new Promise(function (res) {
            // TODO: поки немає endpoint, заявка лише показується в консолі
            console.info('[заявка, не відправлена: немає CONFIG.endpoint]', data);
            setTimeout(res, 500);
          });
      send.then(function () {
        var scope = form.parentElement;
        var done = $('.lead-done', scope);
        form.hidden = true;
        done.hidden = false;
        done.focus();
      }).catch(function () {
        fail('Не вдалося надіслати. Спробуйте ще раз або зателефонуйте.');
      }).then(function () { btn.disabled = false; });
    });
  });

  /* ---------- перший екран: відео грає один раз і зупиняється ---------- */
  (function hero() {
    var hero = heroEl;
    if (!hero) return;
    var video = $('.hero__video', hero);
    var fin = $('.hero__final', hero);
    var mobile = mqMobile.matches;
    var src = (mobile && video.dataset.srcMobile) || video.dataset.src || '';
    var finSrc = (mobile && fin.dataset.srcMobile) || fin.dataset.src || '';
    var poster = (mobile && video.dataset.posterMobile) || video.dataset.poster || '';
    if (poster) video.poster = poster;
    var done = false;

    function built() { hero.classList.add('is-built'); }
    function showFinal() {
      if (done) return;
      done = true;
      if (finSrc) { fin.src = finSrc; fin.classList.add('is-on'); }
      built();
    }
    function stillOnly() {
      if (finSrc) { showFinal(); return; }
      if (src) {
        video.preload = 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function () {
          video.currentTime = Math.max(0, video.duration - 0.05);
        }, { once: true });
      }
      built();
    }

    if (finSrc) { new Image().src = finSrc; }
    if (!src || reduceMotion || saveData) { stillOnly(); return; }

    var started = false;
    video.addEventListener('playing', function () { started = true; });
    video.addEventListener('timeupdate', function () {
      if (video.duration && video.currentTime / video.duration > 0.72) built();
    });
    video.addEventListener('ended', showFinal);
    video.addEventListener('error', showFinal);

    video.preload = 'auto';
    video.src = src;
    var p = video.play();
    if (p && p.catch) p.catch(function () { stillOnly(); });

    setTimeout(function () {
      if (started) return;
      if (finSrc) { video.removeAttribute('src'); video.load(); showFinal(); }
      else built();
    }, 2500);
  })();

  /* ---------- фінальний блок: двері відчиняються один раз ---------- */
  (function door() {
    var box = $('.final__bg');
    if (!box) return;
    var video = $('.final__video', box);
    var still = $('.final__still', box);
    var played = false;
    function showStill() {
      if (still.dataset.src && !still.src) still.src = still.dataset.src;
      still.classList.add('is-on');
    }
    if (reduceMotion || saveData || !video.dataset.src || !('IntersectionObserver' in window)) { showStill(); return; }
    // підвантажуємо заздалегідь, запускаємо, коли блок помітно на екрані
    var near = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      near.disconnect();
      video.preload = 'auto';
      video.src = video.dataset.src;
      if (still.dataset.src) { still.src = still.dataset.src; }
    }, { rootMargin: '100% 0px' });
    near.observe(box);
    var seen = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || played) return;
      played = true;
      seen.disconnect();
      if (!video.src) { video.preload = 'auto'; video.src = video.dataset.src; }
      video.addEventListener('ended', showStill, { once: true });
      video.addEventListener('error', showStill, { once: true });
      var p = video.play();
      if (p && p.catch) p.catch(showStill);
    }, { threshold: 0.45 });
    seen.observe(box);
  })();

  /* ---------- варіант Б: відео на весь екран, етапи поверх ----------
     Активний етап визначається тим, наскільки прокручено «доріжку» (.reel__track).
     Перехід на наступний етап: відео грає вперед до data-t і зупиняється.
     Стрибок через кілька етапів або назад: відео одразу ставиться на потрібну секунду. */
  (function reel() {
    var sec = $('.reel');
    if (!sec) return;
    var track = $('.reel__track', sec);
    var video = $('.reel__video', sec);
    var cards = $$('.reel__card', sec);
    var navItems = $$('.reel__nav li', sec);
    var barI = $('.reel__bar i', sec);
    var count = $('.reel__count b', sec);
    var hint = $('.reel__hint', sec);
    var n = cards.length;
    var active = -1, loaded = false, pending = null, stopAt = null, timer = null, raf = false;

    function tOf(i) {
      var t = parseFloat(cards[i].dataset.t);
      if (isNaN(t)) return video.duration * (i + 1) / n - 0.05;
      return Math.min(t, video.duration - 0.05);
    }
    function stopNow() {
      if (stopAt === null) return;
      var t = stopAt;
      stopAt = null;
      clearTimeout(timer);
      video.pause();
      if (Math.abs(video.currentTime - t) > 0.04) video.currentTime = t;
    }
    function reached() { return video.currentTime >= stopAt - 0.01 || video.ended; }
    function frameCheck() {
      if (stopAt === null) return;
      if (reached()) { stopNow(); return; }
      requestAnimationFrame(frameCheck);
    }
    function timerCheck() {
      if (stopAt === null) return;
      if (reached()) { stopNow(); return; }
      timer = setTimeout(timerCheck, Math.max(30, (stopAt - video.currentTime) * 1000));
    }
    video.addEventListener('timeupdate', function () { if (stopAt !== null && reached()) stopNow(); });

    function go(i, prev) {
      if (!video.duration) { pending = [i, prev]; return; }
      var target = tOf(i);
      var forward = i === prev + 1 && video.currentTime < target && target - video.currentTime < 6;
      clearTimeout(timer);
      if (forward && !reduceMotion) {
        stopAt = target;
        var p = video.play();
        if (p && p.catch) p.catch(function () { stopAt = null; video.currentTime = target; });
        requestAnimationFrame(frameCheck);
        timer = setTimeout(timerCheck, Math.max(30, (target - video.currentTime) * 1000));
      } else {
        stopAt = null;
        video.pause();
        video.currentTime = target;
      }
    }
    function setActive(i) {
      if (i === active) return;
      var prev = active;
      active = i;
      cards.forEach(function (c, k) {
        c.classList.toggle('is-active', k === i);
        c.classList.toggle('is-past', k < i);
      });
      navItems.forEach(function (li, k) {
        li.classList.toggle('is-active', k === i);
        li.classList.toggle('is-done', k < i);
      });
      if (count) count.textContent = ('0' + (i + 1)).slice(-2);
    }
    function load() {
      if (loaded || !video.dataset.src) return;
      loaded = true;
      video.preload = 'auto';
      video.src = (mqMobile.matches && video.dataset.srcMobile) || video.dataset.src;
      // тривалість відома лише після завантаження: перераховуємо ціль
      video.addEventListener('loadedmetadata', function () { update(); }, { once: true });
    }

    /* Плавна прив'язка до прокрутки: відео (усі кадри опорні) просто ставиться
       на потрібну секунду. Кожен етап займає 1/6 доріжки: перші 70% етапу відео
       йде від попередньої зупинки до data-t, решту часу стоїть, поки читається текст. */
    var targetTime = 0, shownTime = 0, seeking = false, loopOn = false;
    var stills = $$('.reel__still', sec), stillOn = -1;
    video.addEventListener('seeked', function () { seeking = false; });
    function timeFor(p) {
      if (!video.duration) return 0;
      var x = p * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
      var from = i === 0 ? 0 : tOf(i - 1), to = tOf(i);
      var k = Math.min(1, f / 0.7);
      k = k * k * (3 - 2 * k); // м'який старт і зупинка
      return from + (to - from) * k;
    }
    function scrubTo(t) {
      if (!video.duration || seeking) return;
      if (Math.abs(video.currentTime - t) < 0.02) return;
      seeking = true;
      video.currentTime = t;
    }
    function loop() {
      if (!loopOn) return;
      // згладжування: кадр наздоганяє ціль, а не стрибає
      shownTime += (targetTime - shownTime) * (reduceMotion ? 1 : 0.22);
      if (Math.abs(targetTime - shownTime) < 0.01) shownTime = targetTime;
      scrubTo(shownTime);
      // на зупинці етапу показуємо чіткий кадр замість м'якого відео
      if (stills.length && video.duration) {
        var on = -1;
        for (var s = 0; s < n; s++) {
          if (Math.abs(targetTime - tOf(s)) < 0.05 && Math.abs(shownTime - tOf(s)) < 0.08) { on = s; break; }
        }
        if (on !== stillOn) {
          stillOn = on;
          stills.forEach(function (im, k) { im.classList.toggle('is-on', k === on); });
        }
      }
      requestAnimationFrame(loop);
    }
    function update() {
      raf = false;
      var r = track.getBoundingClientRect();
      var vh = window.innerHeight;
      var near = !(r.bottom < -vh || r.top > vh * 2);
      if (near && !loopOn) { loopOn = true; requestAnimationFrame(loop); }
      if (!near) { loopOn = false; return; }
      if (r.top < vh * 1.5) load();
      var total = track.offsetHeight - vh;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      targetTime = timeFor(p);
      if (barI) barI.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (hint) hint.style.opacity = p > 0.02 ? '0' : '1';
      // перший етап з'являється, щойно екран з відео займає більшу частину вікна
      if (r.top < vh * 0.35) setActive(Math.min(n - 1, Math.floor(p * n)));
    }
    window.addEventListener('scroll', function () {
      if (!raf) { raf = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    // клік по назві етапу справа прокручує до нього
    navItems.forEach(function (li, k) {
      $('button', li).addEventListener('click', function () {
        var total = track.offsetHeight - window.innerHeight;
        var top = track.getBoundingClientRect().top + window.scrollY + total * (k + 0.5) / n;
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  })();

  /* ---------- етапи: відео йде вперед разом зі скролом ---------- */
  (function steps() {
    var section = $('.steps');
    if (!section) return;
    var video = $('.steps__video', section);
    var cards = $$('.step', section);
    var bars = $$('.steps__bar i', section);
    var count = $('.steps__count b', section);
    var active = -1, stopAt = null, timer = null, loaded = false, pending = null;

    function endOf(i) {
      var t = parseFloat(cards[i].dataset.t);
      if (!isNaN(t)) return Math.min(t, video.duration - 0.05);
      return video.duration * (i + 1) / cards.length - 0.05;
    }
    // Зупинка на потрібній секунді: три страховки (кадр анімації, таймер, подія відео).
    function stopNow() {
      if (stopAt === null) return;
      var t = stopAt;
      stopAt = null;
      clearTimeout(timer);
      video.pause();
      if (Math.abs(video.currentTime - t) > 0.04) video.currentTime = t;
    }
    function reached() { return video.currentTime >= stopAt - 0.01 || video.ended; }
    function frameCheck() {
      if (stopAt === null) return;
      if (reached()) { stopNow(); return; }
      requestAnimationFrame(frameCheck);
    }
    function timerCheck() {
      if (stopAt === null) return;
      if (reached()) { stopNow(); return; }
      timer = setTimeout(timerCheck, Math.max(30, (stopAt - video.currentTime) * 1000));
    }
    video.addEventListener('timeupdate', function () {
      if (stopAt !== null && reached()) stopNow();
    });

    function moveVideo(i, prev) {
      if (!video.duration) { pending = [i, prev]; return; }
      var target = endOf(i);
      var forward = i === prev + 1 && video.currentTime < target && target - video.currentTime < 6;
      clearTimeout(timer);
      if (forward && !reduceMotion) {
        stopAt = target;
        var p = video.play();
        if (p && p.catch) p.catch(function () { stopAt = null; video.currentTime = target; });
        requestAnimationFrame(frameCheck);
        timer = setTimeout(timerCheck, Math.max(30, (target - video.currentTime) * 1000));
      } else {
        stopAt = null;
        video.pause();
        video.currentTime = target;
      }
    }
    function setActive(i) {
      if (i === active) return;
      var prev = active;
      active = i;
      cards.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      bars.forEach(function (b, k) { b.classList.toggle('is-on', k <= i); });
      if (count) count.textContent = ('0' + (i + 1)).slice(-2);
      if (loaded) moveVideo(i, prev); else pending = [i, prev];
    }
    function load() {
      if (loaded || !video.dataset.src) return;
      loaded = true;
      video.preload = 'auto';
      video.src = video.dataset.src;
      video.addEventListener('loadedmetadata', function () {
        if (pending) { moveVideo(pending[0], pending[1]); pending = null; }
      }, { once: true });
    }

    if (!('IntersectionObserver' in window)) { load(); setActive(0); return; }
    var near = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { load(); near.disconnect(); }
    }, { rootMargin: '120% 0px' });
    near.observe(section);
    var mid = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(cards.indexOf(e.target)); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    cards.forEach(function (c) { mid.observe(c); });
  })();
})();
