/* ═══════════════════════════════════════════════════════════════════════
   FYNEXT — FINN AI CHATBOT  |  fynext-chat.js  v2.0 (secure)
   ✅  Sem API key no cliente — todas as chamadas vão pelo server.js
   ✅  XSS corrigido — innerHTML sanitizado antes de inserir
   ✅  Inclua este script no final do <body>
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────
   URL DO BACKEND
   Em produção, defina window.FYNEXT_API antes de carregar este script:
     <script>window.FYNEXT_API = 'https://api.fynext.dev';</script>
   Em desenvolvimento, aponta para http://localhost:3000 automaticamente.
  ───────────────────────────────────────────────────────────────────── */
  var BASE_URL = (window.FYNEXT_API || 'http://localhost:3000').replace(/\/$/, '');
  var API_URL  = BASE_URL + '/chat';

  /* ── CSS ────────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    '#fn-fab{position:fixed;bottom:28px;right:28px;z-index:9000;width:56px;height:56px;border-radius:50%;background:#e8460a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 28px rgba(232,70,10,.5);transition:transform .3s,box-shadow .3s;animation:fn-pop .5s cubic-bezier(.16,1,.3,1) .8s both;}',
    '@keyframes fn-pop{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}',
    '#fn-fab:hover{transform:scale(1.1);box-shadow:0 6px 36px rgba(232,70,10,.65);}',
    '#fn-fab svg{width:24px;height:24px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:opacity .25s;}',
    '#fn-fab .fn-close-icon{display:none;}',
    '#fn-fab.open .fn-chat-icon{display:none;}',
    '#fn-fab.open .fn-close-icon{display:block;}',
    '.fn-notif{position:absolute;top:-3px;right:-3px;width:16px;height:16px;border-radius:50%;background:#3ecf8e;border:2.5px solid #0a0a08;font-size:.44rem;color:#0a0a08;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:"DM Mono",monospace;animation:fn-pulse 2s ease-in-out infinite;}',
    '@keyframes fn-pulse{0%,100%{box-shadow:0 0 0 0 rgba(62,207,142,.4)}50%{box-shadow:0 0 0 6px rgba(62,207,142,0)}}',
    '#fn-win{position:fixed;bottom:96px;right:28px;z-index:8999;width:360px;max-height:560px;background:rgba(10,10,8,.97);border:1px solid rgba(232,70,10,.22);border-radius:10px;box-shadow:0 24px 80px rgba(0,0,0,.75),0 0 0 1px rgba(232,70,10,.05);backdrop-filter:blur(18px);display:flex;flex-direction:column;overflow:hidden;transform:scale(.85) translateY(24px);transform-origin:bottom right;opacity:0;pointer-events:none;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .28s ease;}',
    '#fn-win.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}',
    '.fn-head{padding:13px 16px;border-bottom:1px solid rgba(242,237,230,.06);display:flex;align-items:center;gap:11px;background:rgba(232,70,10,.07);flex-shrink:0;}',
    '.fn-av{width:38px;height:38px;border-radius:50%;background:#e8460a;display:flex;align-items:center;justify-content:center;font-size:1.1rem;position:relative;flex-shrink:0;}',
    '.fn-av::after{content:"";position:absolute;bottom:1px;right:1px;width:9px;height:9px;border-radius:50%;background:#3ecf8e;border:2px solid rgba(10,10,8,.97);}',
    '.fn-info{flex:1;}',
    '.fn-name{font-size:.82rem;font-weight:700;color:#f2ede6;line-height:1.25;font-family:"Syne",sans-serif;}',
    '.fn-status{font-family:"DM Mono",monospace;font-size:.5rem;color:#3ecf8e;letter-spacing:.06em;}',
    '.fn-x{background:none;border:none;cursor:pointer;color:rgba(242,237,230,.4);font-size:1.1rem;line-height:1;padding:4px;transition:color .2s;margin-left:auto;}',
    '.fn-x:hover{color:#f2ede6;}',
    '.fn-msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(232,70,10,.2) transparent;}',
    '.fn-msgs::-webkit-scrollbar{width:3px;}',
    '.fn-msgs::-webkit-scrollbar-thumb{background:rgba(232,70,10,.2);border-radius:2px;}',
    '.fn-msg{display:flex;gap:7px;align-items:flex-end;max-width:92%;}',
    '.fn-msg.bot{align-self:flex-start;}',
    '.fn-msg.usr{align-self:flex-end;flex-direction:row-reverse;}',
    '.fn-mav{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;}',
    '.fn-msg.bot .fn-mav{background:#e8460a;}',
    '.fn-msg.usr .fn-mav{background:rgba(242,237,230,.1);}',
    '.fn-bbl{padding:9px 12px;border-radius:12px;font-size:.78rem;line-height:1.62;max-width:100%;font-family:"Syne",sans-serif;}',
    '.fn-msg.bot .fn-bbl{background:rgba(242,237,230,.06);border:1px solid rgba(242,237,230,.08);color:#f2ede6;border-radius:4px 12px 12px 12px;}',
    '.fn-msg.usr .fn-bbl{background:#e8460a;color:#fff;border-radius:12px 4px 12px 12px;}',
    '.fn-typing{display:flex;gap:4px;align-items:center;padding:8px 4px;}',
    '.fn-typing span{width:6px;height:6px;border-radius:50%;background:rgba(242,237,230,.35);animation:fn-bounce .9s ease-in-out infinite;}',
    '.fn-typing span:nth-child(2){animation-delay:.18s;}',
    '.fn-typing span:nth-child(3){animation-delay:.36s;}',
    '@keyframes fn-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',
    '.fn-quick{padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid rgba(242,237,230,.06);flex-shrink:0;}',
    '.fn-qr{font-family:"DM Mono",monospace;font-size:.52rem;letter-spacing:.06em;padding:5px 11px;border:1px solid rgba(232,70,10,.25);border-radius:2px;background:transparent;color:rgba(232,70,10,.85);cursor:pointer;transition:background .2s,border-color .2s;white-space:nowrap;}',
    '.fn-qr:hover{background:rgba(232,70,10,.1);border-color:rgba(232,70,10,.55);}',
    '.fn-inp-row{padding:10px 12px;border-top:1px solid rgba(242,237,230,.06);display:flex;align-items:center;gap:8px;flex-shrink:0;}',
    '.fn-inp{flex:1;background:rgba(242,237,230,.05);border:1px solid rgba(242,237,230,.08);border-radius:5px;padding:9px 11px;font-family:"DM Mono",monospace;font-size:.7rem;color:#f2ede6;outline:none;transition:border-color .2s;}',
    '.fn-inp::placeholder{color:rgba(242,237,230,.25);}',
    '.fn-inp:focus{border-color:rgba(232,70,10,.4);}',
    '.fn-send{width:36px;height:36px;border-radius:5px;background:#e8460a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0;}',
    '.fn-send:hover{background:#c73b09;}',
    '.fn-send:disabled{opacity:.5;cursor:default;}',
    '.fn-send svg{width:14px;height:14px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.fn-foot{padding:5px 12px;text-align:center;font-family:"DM Mono",monospace;font-size:.42rem;color:rgba(242,237,230,.2);border-top:1px solid rgba(242,237,230,.04);letter-spacing:.05em;flex-shrink:0;}',
    '.fn-foot b{color:#e8460a;}',
  ].join('');
  document.head.appendChild(style);

  /* ── HTML ────────────────────────────────────────────────────────────── */
  var wrap = document.createElement('div');
  wrap.id = 'fn-root';

  /* Monta o HTML via DOM — evita injeção via innerHTML de strings externas */
  wrap.innerHTML = [
    '<button id="fn-fab" aria-label="Abrir chat Fynext">',
    '  <div class="fn-notif">1</div>',
    '  <svg class="fn-chat-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '  <svg class="fn-close-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '</button>',
    '<div id="fn-win" role="dialog" aria-label="Chat Fynext">',
    '  <div class="fn-head">',
    '    <div class="fn-av">🤖</div>',
    '    <div class="fn-info">',
    '      <div class="fn-name">Finn — Assistente Fynext</div>',
    '      <div class="fn-status">● Online agora</div>',
    '    </div>',
    '    <button class="fn-x" id="fn-x" aria-label="Fechar chat">✕</button>',
    '  </div>',
    '  <div class="fn-msgs" id="fn-msgs" aria-live="polite" aria-relevant="additions"></div>',
    '  <div class="fn-quick" id="fn-quick">',
    '    <button class="fn-qr" data-q="Quais serviços vocês oferecem?">Serviços</button>',
    '    <button class="fn-qr" data-q="Quanto custa um projeto?">Preços</button>',
    '    <button class="fn-qr" data-q="Qual é o prazo médio de entrega?">Prazo</button>',
    '    <button class="fn-qr" data-q="Quero solicitar um orçamento">Orçamento</button>',
    '  </div>',
    '  <div class="fn-inp-row">',
    '    <input class="fn-inp" id="fn-inp" type="text" placeholder="Digite sua mensagem..." autocomplete="off" maxlength="1000"/>',
    '    <button class="fn-send" id="fn-send" aria-label="Enviar mensagem">',
    '      <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    '    </button>',
    '  </div>',
    '  <div class="fn-foot">Powered by <b>Fynext IA</b> · Gemini Flash</div>',
    '</div>',
  ].join('');
  document.body.appendChild(wrap);

  /* ── REFS ────────────────────────────────────────────────────────────── */
  var fab    = document.getElementById('fn-fab');
  var win    = document.getElementById('fn-win');
  var closeX = document.getElementById('fn-x');
  var msgs   = document.getElementById('fn-msgs');
  var quick  = document.getElementById('fn-quick');
  var inp    = document.getElementById('fn-inp');
  var send   = document.getElementById('fn-send');

  var isOpen      = false;
  var history     = []; /* [{role, parts:[{text}]}] — sem system prompt aqui */
  var quickHidden = false;
  var sending     = false;

  /* ── TOGGLE ──────────────────────────────────────────────────────────── */
  function toggle() {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    fab.classList.toggle('open', isOpen);
    var notif = fab.querySelector('.fn-notif');
    if (notif && isOpen) notif.style.display = 'none';
    if (isOpen) { inp.focus(); scrollBottom(); }
  }

  fab.addEventListener('click', toggle);
  closeX.addEventListener('click', toggle);

  /* Fecha ao pressionar Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) toggle();
  });

  /* ── QUICK REPLIES ───────────────────────────────────────────────────── */
  quick.querySelectorAll('.fn-qr').forEach(function (btn) {
    btn.addEventListener('click', function () {
      doSend(btn.dataset.q);
      if (!quickHidden) { quick.style.display = 'none'; quickHidden = true; }
    });
  });

  /* ── KEYBOARD SEND ───────────────────────────────────────────────────── */
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(inp.value); }
  });
  send.addEventListener('click', function () { doSend(inp.value); });

  /* ── HELPERS ─────────────────────────────────────────────────────────── */
  function scrollBottom() {
    setTimeout(function () { msgs.scrollTop = msgs.scrollHeight; }, 50);
  }

  /**
   * Escapa caracteres especiais HTML para prevenir XSS.
   * DEVE ser chamada em qualquer texto antes de inserir via innerHTML.
   */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Adiciona uma mensagem na conversa.
   * - role: 'usr' | 'bot'
   * - Para texto do usuário: usa textContent (sem parsing HTML)
   * - Para texto do bot: escapa HTML e converte \n em <br>
   */
  function addMsg(text, role) {
    var d   = document.createElement('div');
    d.className = 'fn-msg ' + role;

    var av = document.createElement('div');
    av.className  = 'fn-mav';
    av.textContent = role === 'usr' ? '👤' : '🤖';

    var bbl = document.createElement('div');
    bbl.className = 'fn-bbl';

    if (role === 'usr') {
      /* Mensagem do usuário: nunca usa innerHTML — textContent é seguro */
      bbl.textContent = text;
    } else {
      /* Mensagem do bot: escapa HTML e depois converte quebras de linha */
      bbl.innerHTML = escHtml(text).replace(/\n/g, '<br>');
    }

    d.appendChild(av);
    d.appendChild(bbl);
    msgs.appendChild(d);
    scrollBottom();
    return d;
  }

  function showTyping() {
    var d   = document.createElement('div');
    d.className = 'fn-msg bot';
    d.id        = 'fn-typing';

    var av  = document.createElement('div');
    av.className  = 'fn-mav';
    av.textContent = '🤖';

    var bbl = document.createElement('div');
    bbl.className = 'fn-bbl';
    /* Indicador de digitação — HTML estático e seguro */
    bbl.innerHTML = '<div class="fn-typing"><span></span><span></span><span></span></div>';

    d.appendChild(av);
    d.appendChild(bbl);
    msgs.appendChild(d);
    scrollBottom();
  }

  function removeTyping() {
    var t = document.getElementById('fn-typing');
    if (t) t.remove();
  }

  /* ── MENSAGEM INICIAL (aparece após 600ms, parece natural) ───────────── */
  setTimeout(function () {
    addMsg('Olá! 👋 Sou o Finn, assistente da Fynext.\n\nPosso te ajudar com informações sobre nossos serviços, projetos ou te conectar com a equipe. Como posso te ajudar?', 'bot');
  }, 600);

  /* ── SEND ────────────────────────────────────────────────────────────── */
  async function doSend(text) {
    text = (text || '').trim();
    if (!text || sending) return;

    inp.value  = '';
    sending    = true;
    send.disabled = true;

    addMsg(text, 'usr');

    /* Guarda a mensagem no histórico ANTES de enviar ao servidor */
    history.push({ role: 'user', parts: [{ text: text }] });
    showTyping();

    try {
      var res = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        /* Envia apenas o histórico ANTERIOR à mensagem atual
           (o servidor injeta a mensagem atual sozinho) */
        body: JSON.stringify({
          message: text,
          history: history.slice(0, -1),
        }),
        signal: AbortSignal.timeout(30_000), // timeout de 30s
      });

      removeTyping();

      if (!res.ok && res.status === 429) {
        addMsg('Muitas mensagens em seguida. Aguarde um momento e tente novamente. 🙏', 'bot');
        history.pop(); // descarta a mensagem que não foi processada
        return;
      }

      var data  = await res.json();
      var reply = data.reply || 'Desculpe, não consegui gerar uma resposta. Tente novamente ou escreva para contato@fynext.dev';

      addMsg(reply, 'bot');
      history.push({ role: 'model', parts: [{ text: reply }] });

      /* Limita o histórico em memória para não crescer indefinidamente */
      if (history.length > 40) {
        history = history.slice(-40);
      }

    } catch (err) {
      removeTyping();
      if (err.name === 'TimeoutError') {
        addMsg('A resposta demorou muito. Verifique sua conexão e tente novamente. 🙏', 'bot');
      } else {
        addMsg('Ops! Houve uma instabilidade. Tente novamente ou escreva para contato@fynext.dev 🙏', 'bot');
      }
      history.pop(); // descarta a mensagem que não foi processada
    } finally {
      sending       = false;
      send.disabled = false;
      inp.focus();
    }
  }

  /* ── Compat: cursor ring do site pai ─────────────────────────────────── */
  [fab, win].forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      var ring = document.getElementById('cursor-ring');
      if (ring) { ring.style.width = '50px'; ring.style.height = '50px'; ring.style.borderColor = 'rgba(232,70,10,.75)'; }
    });
    el.addEventListener('mouseleave', function () {
      var ring = document.getElementById('cursor-ring');
      if (ring) { ring.style.width = '34px'; ring.style.height = '34px'; ring.style.borderColor = 'rgba(232,70,10,.45)'; }
    });
  });

}());