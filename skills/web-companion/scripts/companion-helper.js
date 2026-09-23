// Companion browser helper (auto-injected before </body>).
// - Keeps a WebSocket open; reloads the tab when the agent pushes a new screen.
// - Reports clicks on [data-choice] elements back to the server.
// - companion.submit(choice, form) gathers named inputs (radio/checkbox/text/
//   select/textarea) into an `answers` object and reports it — quiz answers and
//   form data stay on the page, the user never retypes them in chat.
// - toggleSelect() gives select-one/select-many styling for .options/.cards groups.
(function () {
  var MIN_MS = 500, MAX_MS = 30000, backoff = MIN_MS, timer = null, ws = null;

  function key() {
    // Server cookie is named companion-key-<port>. Browsers share localhost
    // cookies across ports, so match THIS tab's port — another session's key
    // would be rejected and the tab would silently stop reporting.
    var m = document.cookie.match(new RegExp('(?:^|;\\s*)companion-key-' + window.location.port + '=([^;]*)'));
    if (m) return decodeURIComponent(m[1]);
    m = window.location.search.match(/[?&]key=([^&]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function url() {
    var k = key();
    var proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    return proto + window.location.host + '/?key=' + encodeURIComponent(k || '');
  }

  function connect() {
    if (timer) { clearTimeout(timer); timer = null; }
    try { ws = new WebSocket(url()); } catch (e) { retry(); return; }
    ws.onopen = function () {
      backoff = MIN_MS;
      while (queue.length) { ws.send(JSON.stringify(queue.shift())); }
    };
    ws.onmessage = function (msg) {
      var data;
      try { data = JSON.parse(msg.data); } catch (e) { return; }
      if (data && data.type === 'reload') window.location.reload();
    };
    ws.onclose = retry;
    ws.onerror = function () { try { ws.close(); } catch (e) {} };
  }

  function retry() {
    ws = null;
    timer = setTimeout(connect, backoff);
    backoff = Math.min(backoff * 2, MAX_MS);
  }

  var queue = [];
  function send(event) {
    event.timestamp = Date.now();
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event));
    else queue.push(event);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-choice]') : null;
    if (!t) return;
    send({ type: 'click', choice: t.getAttribute('data-choice'),
      text: (t.textContent || '').trim().slice(0, 200), id: t.id || null });
  });

  window.toggleSelect = function (el) {
    var box = el.closest('.options') || el.closest('.cards');
    var multi = box && box.hasAttribute('data-multiselect');
    if (box && !multi) {
      box.querySelectorAll('.option,.card').forEach(function (o) { o.classList.remove('selected'); });
    }
    if (multi) el.classList.toggle('selected');
    else el.classList.add('selected');
  };

  function collectAnswers(root) {
    var out = {};
    if (!root || !root.querySelectorAll) return out;
    root.querySelectorAll('input[name],select[name],textarea[name]').forEach(function (el) {
      var name = el.getAttribute('name');
      if (el.type === 'checkbox') {
        out[name] = out[name] || [];
        if (el.checked) out[name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) out[name] = el.value;
      } else {
        out[name] = el.value;
      }
    });
    return out;
  }

  window.companion = {
    send: send,
    choice: function (value, meta) {
      var e = { type: 'choice', choice: value };
      if (meta) for (var k in meta) e[k] = meta[k];
      send(e);
    },
    submit: function (value, form) {
      var root = (typeof form === 'string') ? document.querySelector(form)
        : (form && form.querySelectorAll ? form : document);
      send({ type: 'answer', choice: value, answers: collectAnswers(root) });
    }
  };

  connect();
})();
