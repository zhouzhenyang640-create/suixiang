(() => {
  'use strict';

  const DB_NAME = 'suixiang-local-db';
  const DB_VERSION = 1;
  const APP_VERSION = '9.3.3';
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');
  const imagePicker = document.getElementById('image-picker');
  const backupPicker = document.getElementById('backup-picker');

  let db;
  let conversations = [];
  let messages = [];
  let trashItems = [];
  let settings = { theme: 'system', preset: 'default' };
  let currentConversationId = null;
  let activeView = 'chats';
  let screen = 'home';
  let searchQuery = '';
  let editingMessageId = null;
  let pendingQuote = null;
  let longPressTriggered = false;
  let installPrompt = null;
  let pendingJumpTo = null;
  let pendingScrollTop = null;
  let serviceWorkerRegistration = null;
  let serviceWorkerController = null;
  let serviceWorkerUpdateReady = false;
  let updateCheckInProgress = false;
  let longPressTimer = null;
  let imageUrls = new Map();

  const icons = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    compose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
    chats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 10h8M8 13.5h5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 8.7c0 5.1-8.8 10.3-8.8 10.3S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6.5 7l.8 13h9.4l.8-13M9 7V4h6v3"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.9-1.7 2.9-2.1-.5a7.8 7.8 0 0 1-1.6.9l-.7 2.1h-3.3l-.7-2.1a7.8 7.8 0 0 1-1.6-.9l-2.1.5-1.7-2.9 1.1-1.9A7.4 7.4 0 0 1 6 13l-2-1v-3l2-1a7.4 7.4 0 0 1 .1-1.1L5 5.1l1.7-2.9 2.1.5a7.8 7.8 0 0 1 1.6-.9l.7-2.1h3.3l.7 2.1a7.8 7.8 0 0 1 1.6.9l2.1-.5 1.7 2.9-1.1 1.9A7.4 7.4 0 0 1 19 8l2 1v3l-2 1a7.4 7.4 0 0 1 .4 2Z" transform="translate(0 1) scale(.92)"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 5 5-4 1-4 4-1 5-2-2-5 5-1-1 5-5-2-2 5-1 4-4Z"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-6-6 6 6 6-6"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>',
    reply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v2"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m-5 5 5-5 5 5M4 20h16"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></svg>',
    restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16v13H4zM8 6.5V4h8v2.5M9 11h6m-6 4h4"/></svg>'
  };

  const youMessageTail = '<svg class="youmessage-tail" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M 14.5 0 C 14.5 6 15.6 17.3 19 19.5 Q 19.6 20.1 18.4 20.6 Q 13.4 20.1 8.5 15.5 L 2 14 L 2 0 Z" fill="currentColor"/></svg>';

  // YouMessage family presets use iMessage-style tails and per-group timestamps.
  // Register future variants with the "youmessage-" prefix (for example, youmessage-soft).
  function isYouMessagePreset() {
    const preset = String(document.documentElement.dataset.preset || '').toLowerCase();
    return preset.startsWith('you');
  }

  function formatMessageTime(timestamp) {
    const date = new Date(Number(timestamp));
    if (!Number.isFinite(date.getTime())) return '';
    const pad = value => String(value).padStart(2, '0');
    return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function syncMessageGrouping(area, list) {
    if (!area) return;
    const showYouMessageTime = isYouMessagePreset();
    list.forEach((message, index) => {
      const row = area.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`);
      if (!row) return;
      const previousSameSide = index > 0 && list[index - 1].side === message.side;
      const nextSameSide = index < list.length - 1 && list[index + 1].side === message.side;
      row.classList.toggle('grouped-prev', previousSameSide);
      row.classList.toggle('grouped-next', nextSameSide);
      const bubble = row.querySelector('.message-bubble');
      if (!bubble) return;

      const tail = bubble.querySelector('.youmessage-tail');
      if (!showYouMessageTime || nextSameSide) {
        if (tail) tail.remove();
      } else if (!tail) {
        bubble.insertAdjacentHTML('beforeend', youMessageTail);
      }

      const stack = row.querySelector(':scope > .message-stack');
      if (showYouMessageTime && !nextSameSide) {
        let messageStack = stack;
        if (!messageStack) {
          messageStack = document.createElement('div');
          messageStack.className = 'message-stack';
          row.insertBefore(messageStack, bubble);
          messageStack.appendChild(bubble);
        }
        let timeLabel = messageStack.querySelector('.message-time');
        if (!timeLabel) {
          timeLabel = document.createElement('span');
          timeLabel.className = 'message-time';
          messageStack.appendChild(timeLabel);
        }
        timeLabel.textContent = formatMessageTime(message.createdAt ?? message.updatedAt);
      } else if (stack) {
        row.insertBefore(bubble, stack);
        stack.remove();
      }
    });
  }

  function icon(name) { return icons[name] || icons.book; }
  function uid() { return (crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`); }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function safeText(value) { return String(value ?? '').trim(); }
  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 2300);
  }
  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('数据库操作失败'));
      tx.onabort = () => reject(tx.error || new Error('数据库操作已取消'));
    });
  }
  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('conversations')) database.createObjectStore('conversations', { keyPath: 'id' });
        if (!database.objectStoreNames.contains('messages')) {
          const store = database.createObjectStore('messages', { keyPath: 'id' });
          store.createIndex('conversationId', 'conversationId', { unique: false });
        }
        if (!database.objectStoreNames.contains('trash')) database.createObjectStore('trash', { keyPath: 'id' });
        if (!database.objectStoreNames.contains('settings')) database.createObjectStore('settings', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function all(storeName) {
    const tx = db.transaction(storeName, 'readonly');
    const done = txDone(tx);
    const values = await requestResult(tx.objectStore(storeName).getAll());
    await done;
    return values;
  }
  async function put(storeName, value) {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    await txDone(tx);
  }
  async function remove(storeName, key) {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    await txDone(tx);
  }
  async function refreshData() {
    [conversations, messages, trashItems] = await Promise.all([all('conversations'), all('messages'), all('trash')]);
    const saved = await all('settings');
    settings = { theme: 'system', preset: 'default' };
    for (const item of saved) settings[item.key] = item.value;
  }
  function getConversation(id) { return conversations.find(item => item.id === id); }
  function getConversationMessages(id) { return messages.filter(item => item.conversationId === id).sort((a, b) => a.createdAt - b.createdAt); }
  function previewFor(message) {
    if (!message) return '还没有消息，先记下第一个想法吧';
    if (message.type === 'image') return '▧ 图片';
    const content = String(message.content || '').replace(/\s+/g, ' ').trim();
    if (content) return content.slice(0, 76);
    if (message.quote?.type === 'image') return '↪ 图片引用';
    if (message.quote?.content) return '↪ ' + String(message.quote.content).replace(/\s+/g, ' ').slice(0, 70);
    return '引用消息';
  }
  function imageSrc(message) {
    if (!imageUrls.has(message.id)) imageUrls.set(message.id, URL.createObjectURL(message.blob));
    return imageUrls.get(message.id);
  }
  function quoteImageSrc(ownerId, quote) {
    const blob = quote?.imageBlob || messages.find(item => item.id === quote?.messageId)?.blob;
    if (!blob) return '';
    const key = 'quote:' + ownerId;
    if (!imageUrls.has(key)) imageUrls.set(key, URL.createObjectURL(blob));
    return imageUrls.get(key);
  }
  function revokeImage(id) {
    if (imageUrls.has(id)) {
      URL.revokeObjectURL(imageUrls.get(id));
      imageUrls.delete(id);
    }
  }
  function revokeQuoteImage(ownerId) {
    const key = 'quote:' + ownerId;
    if (imageUrls.has(key)) {
      URL.revokeObjectURL(imageUrls.get(key));
      imageUrls.delete(key);
    }
  }
  async function updateConversationPreview(conversationId) {
    const conv = getConversation(conversationId);
    if (!conv) return;
    const remaining = getConversationMessages(conversationId);
    const last = remaining[remaining.length - 1];
    conv.lastMessagePreview = previewFor(last);
    conv.updatedAt = last ? (last.updatedAt || last.createdAt) : conv.createdAt;
    await put('conversations', conv);
    await refreshData();
  }

function applyTheme() { 
  const theme = settings.theme || 'system'; 
  const preset = settings.preset === 'youmessage' ? 'youmessage' : 'default'; 
  document.documentElement.dataset.theme = theme; 
  document.documentElement.dataset.preset = preset;
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
  const color = preset === 'youmessage' ? (isDark ? '#000000' : '#FFFFFF') : (isDark ? '#171916' : '#f5f5f2');
  const oldMeta = document.querySelector('meta[name="theme-color"]');
  if (!oldMeta || oldMeta.content !== color) { 
    if (oldMeta) oldMeta.remove(); const newMeta = document.createElement('meta'); 
    newMeta.name = 'theme-color'; 
    newMeta.content = color; 
    document.head.appendChild(newMeta); 
  } 
}
  function sortedConversations() {
    return [...conversations].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  function emptyState(title, copy, symbol = 'empty') {
    return `<div class="empty-state"><div class="empty-orb">${icon(symbol)}</div><div class="empty-title">${esc(title)}</div><div class="empty-copy">${esc(copy)}</div></div>`;
  }

  function render() {
    applyTheme();
    if (screen === 'chat') renderChat();
    else if (screen === 'search') renderSearch();
    else renderHome();
  }

  function renderHome() {
    const titleMap = { chats: '对话', favorites: '收藏', trash: '回收站', settings: '设置' };
    const subtitleMap = { chats: '把脑海里的念头，随手放在这里', favorites: '值得留下的片段', trash: '删除的消息会暂存在这里', settings: '你的私人空间，由你决定' };
    let body = '';
    if (activeView === 'chats') {
      const list = sortedConversations();
      body = list.length ? `<div class="section-heading"><span>所有对话</span><span>${list.length} 个</span></div><div class="list-card">${list.map(conv => `
        <div class="conversation-row" data-action="open-chat" data-id="${esc(conv.id)}" role="button" tabindex="0">
          <div class="avatar">${esc(conv.icon || '✦')}</div>
          <div class="conversation-main"><div class="conversation-titleline"><span class="conversation-title">${esc(conv.title)}</span>${conv.pinned ? `<span class="pin-mark">${icon('pin')}</span>` : ''}</div><div class="conversation-preview">${esc(conv.lastMessagePreview || '还没有消息，先记下第一个想法吧')}</div></div>
          <button class="row-more" data-action="conversation-menu" data-id="${esc(conv.id)}" aria-label="对话选项">${icon('dots')}</button>
        </div>`).join('')}</div>` : emptyState('还没有对话', '创建一个话题窗口，把零散的想法放进去。', 'chats');
    } else if (activeView === 'favorites') {
      const favs = [...messages].filter(item => item.favorite).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      body = favs.length ? `<div class="section-heading"><span>收藏的消息</span><span>${favs.length} 条</span></div><div class="list-card">${favs.map(message => favoriteRow(message)).join('')}</div>` : emptyState('这里还空着', '长按一条消息，选择收藏。喜欢的句子和灵感会集中在这里。', 'heart');
    } else if (activeView === 'trash') {
      const deleted = [...trashItems].filter(item => item.type === 'message').sort((a, b) => b.deletedAt - a.deletedAt);
      body = deleted.length ? `<div class="section-heading"><span>已删除的消息</span><button class="setting-action" data-action="empty-trash">清空</button></div><div class="list-card">${deleted.map(trashRow).join('')}</div>` : emptyState('回收站是空的', '删除的消息会先来到这里，你可以恢复，也可以彻底删除。', 'trash');
    } else if (activeView === 'settings') {
      body = renderSettingsBody();
    }

    const topActions = activeView === 'chats' ? `<div class="topbar-actions"><button class="icon-btn" data-action="open-search" aria-label="搜索">${icon('search')}</button><button class="primary-icon-btn" data-action="new-conversation" aria-label="新建对话">${icon('compose')}</button></div>` :
      activeView === 'settings' ? `<div class="topbar-actions"><button class="icon-btn" data-action="theme-cycle" aria-label="切换主题">${settings.theme === 'dark' ? icon('moon') : icon('sun')}</button></div>` : '';

    app.innerHTML = `
      <header class="topbar"><div><div class="topbar-title">${titleMap[activeView]}</div><div class="topbar-subtitle">${subtitleMap[activeView]}</div></div>${topActions}</header>
      <main class="content" id="home-content">${body}</main>
      <nav class="bottom-nav" aria-label="主导航">
        <button class="nav-item ${activeView === 'chats' ? 'active' : ''}" data-action="change-tab" data-tab="chats">${icon('chats')}<span>对话</span></button>
        <button class="nav-item ${activeView === 'favorites' ? 'active' : ''}" data-action="change-tab" data-tab="favorites">${icon('heart')}<span>收藏</span></button>
        <button class="nav-item ${activeView === 'trash' ? 'active' : ''}" data-action="change-tab" data-tab="trash">${icon('trash')}<span>回收站</span></button>
        <button class="nav-item ${activeView === 'settings' ? 'active' : ''}" data-action="change-tab" data-tab="settings">${icon('settings')}<span>设置</span></button>
      </nav>`;
  }

  function favoriteRow(message) {
    const conv = getConversation(message.conversationId);
    const preview = previewFor(message);
    return `<div class="search-result" data-action="jump-message" data-id="${esc(message.id)}">
      <div class="result-icon">${esc(conv?.icon || '✦')}</div><div class="result-body"><div class="result-title">${esc(conv?.title || '已删除的对话')}</div><div class="result-snippet">${esc(preview.slice(0, 160))}</div></div>
      <button class="row-more" data-action="favorite-toggle" data-id="${esc(message.id)}" aria-label="取消收藏">${icon('heart')}</button>
    </div>`;
  }
  function trashRow(item) {
    const msg = item.original;
    const conv = getConversation(msg.conversationId);
    const preview = previewFor(msg);
    return `<div class="trash-item"><div class="result-title">${esc(conv?.title || '原对话已不存在')}</div><div class="result-snippet">${esc(preview.slice(0, 180))}</div><div class="trash-actions"><button data-action="restore-message" data-id="${esc(item.id)}">${icon('restore')} 恢复</button><button class="permanent" data-action="permanent-delete" data-id="${esc(item.id)}">彻底删除</button></div></div>`;
  }

  function renderSettingsBody() {
    return `
      <div class="settings-group"><div class="settings-title">外观</div><div class="settings-card">
      <div class="setting-row"><div><div class="setting-label">聊天主题</div><div class="setting-help">选择预设的界面风格</div></div><select class="setting-select" id="preset-select"><option value="default" ${settings.preset !== 'youmessage' ? 'selected' : ''}>默认主题</option><option value="youmessage" ${settings.preset === 'youmessage' ? 'selected' : ''}>YouMessage</option></select></div> <div class="setting-row"><div><div class="setting-label">主题模式</div><div class="setting-help">跟随系统，或固定使用浅色 / 深色</div></div><select class="setting-select" id="theme-select"><option value="system" ${settings.theme === 'system' ? 'selected' : ''}>跟随系统</option><option value="light" ${settings.theme === 'light' ? 'selected' : ''}>浅色模式</option><option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>深色模式</option></select></div>
      </div></div>
      <div class="settings-group"><div class="settings-title">数据与备份</div><div class="settings-card">
        <div class="setting-row"><div><div class="setting-label">导出全部数据</div><div class="setting-help">生成 JSON 备份，包含对话、消息、收藏和图片</div></div><button class="setting-action" data-action="export-backup">导出 JSON</button></div>
        <div class="setting-row"><div><div class="setting-label">导入备份</div><div class="setting-help">按记录 ID 合并数据，不会清空现有内容</div></div><button class="setting-action" data-action="import-backup">选择文件</button></div>
        <div class="setting-row"><div><div class="setting-label">导出单个对话</div><div class="setting-help">选择一个对话，保存为 TXT 文字文件</div></div><button class="setting-action" data-action="export-one">导出 TXT</button></div>
        <div class="setting-row"><div><div class="setting-label">申请持久化存储</div><div class="setting-help">尽量降低浏览器自动清理本站数据的可能</div></div><button class="setting-action" data-action="persist-storage">申请</button></div>
      </div></div>
      <div class="settings-group"><div class="settings-title">版本与更新</div><div class="settings-card">
        <div class="setting-row"><div><div class="setting-label">随想 v${APP_VERSION}</div><div class="setting-help" id="update-status" aria-live="polite">${serviceWorkerUpdateReady ? '已发现新版本，点击立即更新。' : '检查是否有可用的新版本'}</div></div><button class="setting-action" id="check-update-button" data-action="check-update">${serviceWorkerUpdateReady ? '立即更新' : '检查更新'}</button></div>
      </div></div>
      <div class="settings-group"><div class="settings-title">安装</div><div class="settings-card">
        <div class="setting-row"><div><div class="setting-label">添加到手机桌面</div><div class="setting-help">安装后可从桌面全屏打开，支持离线使用</div></div><button class="setting-action" data-action="install-app">安装说明</button></div>
      </div></div>
      <div class="settings-card about-card"><div class="about-heading">随想 · 私人聊天室</div>数据默认只保存在当前浏览器的本机 IndexedDB 中。建议定期导出 JSON 备份，尤其是在清理浏览器数据或更换手机之前。</div>`;
  }

  function renderChat() {
    const conv = getConversation(currentConversationId);
    if (!conv) { screen = 'home'; renderHome(); return; }
    const list = getConversationMessages(conv.id);
    const intro = `<div class="chat-intro"><div class="intro-avatar">${esc(conv.icon || '✦')}</div><strong>${esc(conv.title)}</strong><span>这是一个只属于这个话题的空间</span></div>`;
    const messageHtml = list.map((message, index) => renderMessageRowHtml(message, list, index)).join('');
    const chatHeaderHtml = isYouMessagePreset()
      ? `<header class="chat-header">
          <div class="chat-header-action">
            <button class="icon-btn back-btn" data-action="back-home" aria-label="返回">${icon('back')}</button>
          </div>
          <div class="chat-header-center">
            <div class="avatar">${esc(conv.icon || '✦')}</div>
            <div class="chat-header-title">${esc(conv.title)}</div>
          </div>
          <div class="chat-header-action">
            <button class="icon-btn chat-menu-btn" data-action="conversation-menu" data-id="${esc(conv.id)}" aria-label="对话选项">${icon('dots')}</button>
          </div>
        </header>`
      : `<header class="chat-header">
          <button class="icon-btn back-btn" data-action="back-home" aria-label="返回">${icon('back')}</button>
          <div class="avatar">${esc(conv.icon || '✦')}</div>
          <div class="chat-header-title">${esc(conv.title)}</div>
          <button class="icon-btn" data-action="conversation-menu" data-id="${esc(conv.id)}" aria-label="对话选项">${icon('dots')}</button>
        </header>`;
    app.innerHTML = `
      <section class="chat-screen">
        ${chatHeaderHtml}
        <main class="messages" id="messages-area">${intro}${messageHtml}</main>
        <footer class="composer-wrap">
          ${editingMessageId ? `<div class="editing-banner"><span>正在修改这条消息</span><button class="icon-btn" style="width:28px;height:28px" data-action="cancel-edit" aria-label="取消修改">${icon('close')}</button></div>` : ''}
          <form class="composer" id="composer-form">
          <button class="attach-btn" type="button" data-action="send-opposite" aria-label="发送对面消息">${icon('reply')}</button>
            <button class="attach-btn" type="button" data-action="choose-image" aria-label="发送图片">${icon('image')}</button>
            <textarea id="composer-input" rows="1" maxlength="20000" placeholder="写下此刻的想法……" aria-label="输入消息"></textarea>
            <button class="send-btn" type="submit" id="send-button" disabled aria-label="发送">${icon('send')}</button>
          </form>
        </footer>
      </section>`;
    renderComposerQuotePreview();
    const input = document.getElementById('composer-input');
    if (editingMessageId) {
      const editing = messages.find(item => item.id === editingMessageId);
      if (editing) input.value = editing.content;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
    resizeComposer(input);
    updateSendButton();
    const area = document.getElementById('messages-area');
    syncMessageGrouping(area, list);
    if (pendingJumpTo) {
      const target = pendingJumpTo;
      pendingJumpTo = null;
      pendingScrollTop = null;
      requestAnimationFrame(() => scrollToMessage(target, 'smooth', true));
    } else if (pendingScrollTop !== null) {
      const scrollTop = pendingScrollTop;
      pendingScrollTop = null;
      requestAnimationFrame(() => { area.scrollTop = scrollTop; });
    } else {
      requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
    }
  }


  function renderMessageRowHtml(message, list, index) {
    const previousSameSide = index > 0 && list[index - 1].side === message.side;
    const nextSameSide = index < list.length - 1 && list[index + 1].side === message.side;
    const leftRow = message.side === 'left' ? ' message-row-left' : '';
    const leftBubble = message.side === 'left' ? ' opposite-bubble' : '';
    const grouped = (previousSameSide ? ' grouped-prev' : '') + (nextSameSide ? ' grouped-next' : '');
    const tail = !nextSameSide && isYouMessagePreset() ? youMessageTail : '';
    const quote = message.quote ? renderQuoteCard(message.id, message.quote, true) : '';
    const previousDifferentSide = index > 0 && list[index - 1].side !== message.side;
    const quotedRow = quote
      ? ' has-quote' + (previousDifferentSide ? ' quote-after-different' : '')
      : '';

    if (message.type === 'image') {
      const src = imageSrc(message);
      return '<div class="message-row' + leftRow + grouped + quotedRow + '" data-message-id="' + esc(message.id) + '">' +
        quote + '<div class="message-bubble image-bubble' + leftBubble + '" data-id="' + esc(message.id) + '">' +
        '<img src="' + src + '" alt="图片消息" data-action="view-image" data-id="' + esc(message.id) + '">' + tail +
        '</div></div>';
    }

    const body = String(message.content || '');
    const bubble = body
      ? '<div class="message-bubble' + leftBubble + '" data-id="' + esc(message.id) + '"><span class="bubble-text">' + esc(body) + '</span>' + tail + '</div>'
      : '<div class="message-bubble empty-bubble' + leftBubble + '" data-id="' + esc(message.id) + '">' + tail + '</div>';
    return '<div class="message-row' + leftRow + grouped + quotedRow + '" data-message-id="' + esc(message.id) + '">' + quote + bubble + '</div>';
  }

  function renderQuoteCard(ownerId, quote, interactive = true) {
    const sourceSide = quote?.side === 'left' ? 'quote-from-left' : 'quote-from-right';
    let content = '';
    if (quote?.type === 'image') {
      const src = quoteImageSrc(ownerId, quote);
      content = src
        ? '<img class="message-quote-image" src="' + src + '" alt="被引用的图片">'
        : '<span class="message-quote-image-fallback">图片</span>';
    } else {
      content = '<span class="message-quote-text">' + esc(quote?.content || '') + '</span>';
    }

    if (interactive) {
      return '<button type="button" class="message-quote ' + sourceSide + '" data-action="jump-quote" data-id="' +
        esc(ownerId) + '" data-target-id="' + esc(quote?.messageId || '') + '" aria-label="跳转到被引用的消息">' + content + '</button>';
    }
    return '<div class="message-quote ' + sourceSide + '">' + content + '</div>';
  }

  function renderComposerQuotePreview() {
    const wrap = document.querySelector('.composer-wrap');
    if (!wrap) return;
    wrap.querySelector('.quote-composer-preview')?.remove();

    const editing = editingMessageId ? messages.find(item => item.id === editingMessageId) : null;
    const quote = pendingQuote || editing?.quote || null;
    if (!quote) {
      revokeQuoteImage('composer');
      return;
    }

    const canCancel = Boolean(pendingQuote) && !editingMessageId;
    const cancelButton = canCancel
      ? '<button type="button" class="quote-cancel-btn" data-action="cancel-quote" aria-label="取消引用">' + icon('close') + '</button>'
      : '';
    wrap.insertAdjacentHTML('afterbegin',
      '<div class="quote-composer-preview">' + renderQuoteCard('composer', quote, false) + cancelButton + '</div>');
  }

  function startQuoteMessage(id) {
    const original = messages.find(item => item.id === id);
    if (!original) return;
    if (editingMessageId) {
      closeModal();
      toast('请先保存或取消当前修改，再引用其他消息');
      return;
    }

    revokeQuoteImage('composer');
    longPressTriggered = false;
    pendingQuote = {
      messageId: original.id,
      conversationId: original.conversationId,
      type: original.type,
      side: original.side,
      createdAt: original.createdAt
    };
    if (original.type === 'image') pendingQuote.imageBlob = original.blob;
    else pendingQuote.content = String(original.content || original.quote?.content || (original.quote?.type === 'image' ? '图片' : ''));

    closeModal();
    renderComposerQuotePreview();
    updateSendButton();
    document.getElementById('composer-input')?.focus();
  }

  function jumpToQuotedMessage(ownerId, targetId) {
    const owner = messages.find(item => item.id === ownerId);
    const quote = owner?.quote;
    const target = messages.find(item => item.id === targetId || item.id === quote?.messageId);
    closeModal();

    if (!target) {
      toast('原消息已删除，引用内容仍然保留');
      return;
    }

    if (screen === 'chat' && currentConversationId === target.conversationId) {
      scrollToMessage(target.id, 'smooth', true);
      return;
    }

    currentConversationId = target.conversationId;
    pendingJumpTo = target.id;
    pendingScrollTop = null;
    pendingQuote = null;
    revokeQuoteImage('composer');
    editingMessageId = null;
    screen = 'chat';
    render();
  }

  function resizeComposer(input) {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
  }
  function updateSendButton() {
    const input = document.getElementById('composer-input');
    const button = document.getElementById('send-button');
    if (input && button) {
      const hasText = Boolean(input.value.trim());
      button.disabled = editingMessageId ? !hasText : (!hasText && !pendingQuote);
    }
  }

  function scrollToMessage(id, behavior = 'smooth', highlight = false) {
    const area = document.getElementById('messages-area');
    const row = area?.querySelector(`[data-message-id="${CSS.escape(id)}"]`);
    if (!area || !row) return;
    row.scrollIntoView({ block: 'center', behavior });
    if (highlight) {
      const bubble = row.querySelector('.message-bubble:not(.empty-bubble)') || row.querySelector('.message-quote') || row;
      bubble.classList.add('highlight');
      setTimeout(() => bubble.classList.remove('highlight'), 1800);
    }
  }

  function scrollChatToEdge(edge) {
    const area = document.getElementById('messages-area');
    if (!area) return;
    const top = edge === 'top' ? 0 : Math.max(0, area.scrollHeight - area.clientHeight);
    closeModal();
    area.scrollTo({ top, behavior: 'smooth' });
  }

  function renderSearch() {
    app.innerHTML = `
      <header class="topbar"><div style="display:flex;align-items:center;gap:8px;flex:1"><button class="icon-btn" data-action="back-home" aria-label="返回">${icon('back')}</button><div><div class="topbar-title" style="font-size:22px">搜索</div><div class="topbar-subtitle">在所有对话中查找想法</div></div></div></header>
      <main class="content"><label class="search-field">${icon('search')}<input id="global-search" type="search" placeholder="搜索消息或对话名称" value="${esc(searchQuery)}" autocomplete="off"><button class="icon-btn" style="width:30px;height:30px" data-action="clear-search" aria-label="清空">${icon('close')}</button></label><div id="search-results">${renderSearchResultsHtml()}</div></main>`;
    const input = document.getElementById('global-search');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
  function highlighted(value, query) {
    const safe = esc(value);
    if (!query) return safe;
    const q = esc(query);
    try { return safe.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>'); }
    catch { return safe; }
  }
  function renderSearchResultsHtml() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return emptyState('搜索所有想法', '输入一个词语，找回曾经写下的消息。', 'search');
    const matchingConversations = conversations.filter(conv => conv.title.toLowerCase().includes(q));
    const matchingMessages = messages.filter(message => {
      const body = message.type === 'text' ? String(message.content || '').toLowerCase() : '';
      const quoted = message.quote?.type === 'text' ? String(message.quote.content || '').toLowerCase() : '';
      return body.includes(q) || quoted.includes(q);
    });
    const results = [];
    matchingConversations.forEach(conv => results.push(`<div class="search-result" data-action="open-chat" data-id="${esc(conv.id)}"><div class="result-icon">${esc(conv.icon || '✦')}</div><div class="result-body"><div class="result-title">对话 · ${highlighted(conv.title, q)}</div><div class="result-snippet">${esc(conv.lastMessagePreview || '还没有消息')}</div></div></div>`));
    matchingMessages.forEach(message => {
      const conv = getConversation(message.conversationId);
      if (!conv) return;
      const bodyText = message.type === 'text' ? String(message.content || '') : '';
      const quotedText = message.quote?.type === 'text' ? String(message.quote.content || '') : '';
      const matchedText = bodyText.toLowerCase().includes(q) ? bodyText : quotedText;
      const index = matchedText.toLowerCase().indexOf(q);
      const start = Math.max(0, index - 42);
      const excerpt = (matchedText === quotedText && quotedText ? '引用：' : '') +
        (start > 0 ? '…' : '') + matchedText.slice(start, start + 130) +
        (start + 130 < matchedText.length ? '…' : '');
      results.push(`<div class="search-result" data-action="jump-message" data-id="${esc(message.id)}"><div class="result-icon">${esc(conv.icon || '✦')}</div><div class="result-body"><div class="result-title">${esc(conv.title)}</div><div class="result-snippet">${highlighted(excerpt, searchQuery.trim())}</div></div></div>`);
    });
    return results.length ? `<div class="section-heading"><span>搜索结果</span><span>${results.length} 条</span></div><div class="list-card">${results.join('')}</div>` : emptyState('没有找到相关内容', '试试更短的关键词，或换一个说法。', 'search');
  }
  function refreshSearchResults() {
    const target = document.getElementById('search-results');
    if (target) target.innerHTML = renderSearchResultsHtml();
  }

  function showModal(title, body, actions = '') {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-handle"></div><div class="modal-title">${esc(title)}</div>${body}${actions}</section></div>`;
  }
  function closeModal() { modalRoot.innerHTML = ''; }
  function modalActions(cancel = '取消', confirm = '确定', confirmClass = 'btn-primary') {
    return `<div class="modal-actions"><button type="button" class="btn-secondary" data-action="modal-close">${cancel}</button><button type="submit" class="${confirmClass}">${confirm}</button></div>`;
  }
  function openConversationForm(conv = null) {
    const isEdit = Boolean(conv);
    showModal(isEdit ? '编辑对话' : '创建新对话', `<form id="conversation-form"><label class="form-label" for="conv-title">对话名称</label><input id="conv-title" name="title" class="form-input" maxlength="40" required placeholder="例如：小说构思" value="${esc(conv?.title || '')}"><label class="form-label" for="conv-icon">对话图标（emoji 或符号）</label><input id="conv-icon" name="icon" class="form-input" maxlength="4" value="${esc(conv?.icon || '✦')}" placeholder="✦">${modalActions('取消', isEdit ? '保存' : '创建')}</form>`);
    const form = document.getElementById('conversation-form');
    form.dataset.editId = conv?.id || '';
    document.getElementById('conv-title').focus();
  }
  function openConversationMenu(id) {
    const conv = getConversation(id);
    if (!conv) return;
    const scrollActions = screen === 'chat' && currentConversationId === id ? `
      <button class="menu-item" data-action="scroll-chat-top">${icon('send')}回到顶部</button>
      <button class="menu-item" data-action="scroll-chat-bottom">${icon('arrowDown')}回到底部</button>
    ` : '';
    showModal(conv.title, `<div class="menu-list">
      ${scrollActions}
      <button class="menu-item" data-action="rename-conversation" data-id="${esc(id)}">${icon('edit')}重命名 / 更换图标</button>
      <button class="menu-item" data-action="toggle-pin" data-id="${esc(id)}">${icon('pin')}${conv.pinned ? '取消置顶' : '置顶对话'}</button>
      <button class="menu-item" data-action="export-conversation" data-id="${esc(id)}">${icon('download')}导出为 TXT</button>
      <button class="menu-item danger" data-action="delete-conversation" data-id="${esc(id)}">${icon('trash')}删除整个对话</button>
    </div>`);
  }
  function openMessageMenu(id) {
    const message = messages.find(item => item.id === id);
    if (!message) return;
    const favoriteLabel = message.favorite ? '取消收藏' : '收藏这条消息';
    const body = `<div class="menu-list">
      <button class="menu-item" data-action="quote-message" data-id="${esc(id)}">${icon('reply')}引用消息</button>
      ${message.type === 'text' ? `<button class="menu-item" data-action="edit-message" data-id="${esc(id)}">${icon('edit')}修改消息</button><button class="menu-item" data-action="copy-message" data-id="${esc(id)}">${icon('copy')}复制文字</button>` : `<button class="menu-item" data-action="view-image" data-id="${esc(id)}">${icon('image')}查看图片</button>`}
      <button class="menu-item" data-action="toggle-message-side" data-id="${esc(id)}">
  ${icon('reply')}${message.side === 'left' ? '移到右侧' : '移到左侧'}
</button>
      <button class="menu-item" data-action="favorite-toggle" data-id="${esc(id)}">${icon('heart')}${favoriteLabel}</button>
      <button class="menu-item danger" data-action="delete-message" data-id="${esc(id)}">${icon('trash')}移入回收站</button>
    </div>`;
    showModal('消息操作', body);
  }
  function openDeleteConversationConfirm(id) {
    const conv = getConversation(id);
    if (!conv) return;
    showModal('删除这个对话？', `<form id="delete-conv-form" data-id="${esc(id)}"><p class="small-note">「${esc(conv.title)}」及其中的所有消息将被删除。这个操作无法通过消息回收站恢复，建议先导出重要内容。</p>${modalActions('保留', '删除对话', 'btn-danger')}</form>`);
  }
  function openImageViewer(message) {
    if (!message?.blob) return;
    const src = imageSrc(message);
    const el = document.createElement('div');
    el.className = 'image-viewer';
    el.innerHTML = `<button aria-label="关闭">×</button><img src="${src}" alt="图片预览">`;
    el.addEventListener('click', () => el.remove());
    modalRoot.appendChild(el);
  }

  async function createConversation(title, emoji) {
    const now = Date.now();
    const conv = { id: uid(), title: safeText(title) || '新对话', icon: safeText(emoji) || '✦', pinned: false, createdAt: now, updatedAt: now, lastMessagePreview: '还没有消息，先记下第一个想法吧' };
    await put('conversations', conv);
    await refreshData();
    activeView = 'chats';
    currentConversationId = conv.id;
    screen = 'chat';
    render();
  }

async function sendTextMessage(side = 'right') {
  const input = document.getElementById('composer-input');
  if (!input || !currentConversationId) return;

  const content = safeText(input.value);
  if (!content && !pendingQuote) return;
  const conv = getConversation(currentConversationId);

  if (editingMessageId) {
    const old = messages.find(item => item.id === editingMessageId);
    if (old) {
      old.content = content;
      old.side = side;
      old.updatedAt = Date.now();
      await put('messages', old);
    }

    editingMessageId = null;
    await refreshData();
    await updateConversationPreview(currentConversationId);

    if (old) {
      const row = document.querySelector('[data-message-id="' + CSS.escape(old.id) + '"]');
      if (row) {
        row.classList.toggle('message-row-left', side === 'left');
        const bubble = row.querySelector('.message-bubble');
        if (bubble) {
          bubble.classList.toggle('opposite-bubble', side === 'left');
          bubble.classList.remove('empty-bubble');
          let bubbleText = bubble.querySelector('.bubble-text');
          if (!bubbleText) {
            bubbleText = document.createElement('span');
            bubbleText.className = 'bubble-text';
            bubble.prepend(bubbleText);
          }
          bubbleText.textContent = content;
        }
        syncMessageGrouping(
          document.getElementById('messages-area'),
          getConversationMessages(currentConversationId)
        );
      }
    }

    document.querySelector('.editing-banner')?.remove();
    renderComposerQuotePreview();
    input.value = '';
    resizeComposer(input);
    updateSendButton();
    toast('已保存修改');
    return;
  }

  const now = Date.now();
  const quote = pendingQuote ? { ...pendingQuote } : null;
  const message = {
    id: uid(),
    conversationId: currentConversationId,
    type: 'text',
    content,
    side,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    ...(quote ? { quote } : {})
  };

  const tx = db.transaction(['messages', 'conversations'], 'readwrite');
  tx.objectStore('messages').put(message);
  if (conv) {
    conv.lastMessagePreview = previewFor(message);
    conv.updatedAt = now;
    tx.objectStore('conversations').put(conv);
  }

  await txDone(tx);
  if (quote) {
    pendingQuote = null;
    revokeQuoteImage('composer');
  }
  await refreshData();

  const area = document.getElementById('messages-area');
  if (area) {
    const currentList = getConversationMessages(currentConversationId);
    const index = currentList.findIndex(item => item.id === message.id);
    area.insertAdjacentHTML('beforeend', renderMessageRowHtml(message, currentList, index));
    syncMessageGrouping(area, currentList);
    area.scrollTop = area.scrollHeight;
  }

  input.value = '';
  resizeComposer(input);
  renderComposerQuotePreview();
  updateSendButton();
}

  async function sendImageFiles(files) {
    if (!currentConversationId || !files?.length) return;
    const conv = getConversation(currentConversationId);
    let quoteForNextImage = pendingQuote ? { ...pendingQuote } : null;
    let sentAny = false;

    for (const file of [...files]) {
      if (!file.type.startsWith('image/')) continue;
      const now = Date.now();
      const message = {
        id: uid(),
        conversationId: currentConversationId,
        type: 'image',
        blob: file.slice(0, file.size, file.type),
        side: 'right',
        favorite: false,
        createdAt: now,
        updatedAt: now,
        ...(quoteForNextImage ? { quote: quoteForNextImage } : {})
      };
      quoteForNextImage = null;
      sentAny = true;

      const tx = db.transaction(['messages', 'conversations'], 'readwrite');
      tx.objectStore('messages').put(message);
      if (conv) {
        conv.lastMessagePreview = previewFor(message);
        conv.updatedAt = now;
        tx.objectStore('conversations').put(conv);
      }
      await txDone(tx);
    }

    if (!sentAny) return;
    if (pendingQuote) {
      pendingQuote = null;
      revokeQuoteImage('composer');
    }
    await refreshData();
    render();
    toast('图片已保存到对话');
  }
  async function beginEditMessage(id) {
    const message = messages.find(item => item.id === id);
    if (!message || message.type !== 'text') return;
    const area = document.getElementById('messages-area');
    pendingScrollTop = area ? area.scrollTop : null;
    pendingJumpTo = null;
    pendingQuote = null;
    revokeQuoteImage('composer');
    currentConversationId = message.conversationId;
    editingMessageId = id;
    screen = 'chat';
    closeModal();
    render();
  }
  async function deleteMessage(id) {
    const message = messages.find(item => item.id === id);
    if (!message) return;
    const trashRecord = { id: `trash_${id}_${Date.now()}`, type: 'message', original: message, deletedAt: Date.now() };
    const tx = db.transaction(['messages', 'trash'], 'readwrite');
    tx.objectStore('trash').put(trashRecord);
    tx.objectStore('messages').delete(id);
    await txDone(tx);
    revokeImage(id);
    revokeQuoteImage(id);
    await refreshData();
    await updateConversationPreview(message.conversationId);
    closeModal();
    render();
    toast('已移入回收站');
  }
  async function toggleMessageSide(id) {
  const message = messages.find(item => item.id === id);
  if (!message) return;
  const area = document.getElementById('messages-area');
  const currentScrollTop = area ? area.scrollTop : null;
  message.side = message.side === 'left' ? 'right' : 'left';
  await put('messages', message);
  await refreshData();
  closeModal();
  pendingJumpTo = null;
  pendingScrollTop = currentScrollTop;
  render();
  toast(message.side === 'left' ? '消息已移到左侧' : '消息已移到右侧');
}
  async function toggleFavorite(id) {
    const message = messages.find(item => item.id === id);
    if (!message) return;
    message.favorite = !message.favorite;
    await put('messages', message);
    await refreshData();
    closeModal();
    render();
    toast(message.favorite ? '已收藏' : '已取消收藏');
  }
  async function restoreMessage(trashId) {
    const item = trashItems.find(record => record.id === trashId && record.type === 'message');
    if (!item) return;
    if (!getConversation(item.original.conversationId)) {
      toast('原对话已不存在，无法恢复这条消息');
      return;
    }
    const tx = db.transaction(['messages', 'trash'], 'readwrite');
    tx.objectStore('messages').put(item.original);
    tx.objectStore('trash').delete(trashId);
    await txDone(tx);
    await refreshData();
    await updateConversationPreview(item.original.conversationId);
    render();
    toast('消息已恢复');
  }
  async function permanentlyDelete(trashId) {
    const item = trashItems.find(record => record.id === trashId);
    if (!item) return;
    const tx = db.transaction('trash', 'readwrite');
    tx.objectStore('trash').delete(trashId);
    await txDone(tx);
    if (item.original?.id) {
      revokeImage(item.original.id);
      revokeQuoteImage(item.original.id);
    }
    await refreshData();
    render();
    toast('已彻底删除');
  }
  async function emptyTrash() {
    const tx = db.transaction('trash', 'readwrite');
    tx.objectStore('trash').clear();
    await txDone(tx);
    for (const item of trashItems) if (item.original?.id) {
      revokeImage(item.original.id);
      revokeQuoteImage(item.original.id);
    }
    await refreshData();
    render();
    toast('回收站已清空');
  }
  async function deleteConversation(id) {
    const tx = db.transaction(['conversations', 'messages'], 'readwrite');
    const done = txDone(tx);
    tx.objectStore('conversations').delete(id);
    const store = tx.objectStore('messages');
    const request = store.getAll();
    request.onsuccess = () => {
      request.result.filter(item => item.conversationId === id).forEach(item => {
        store.delete(item.id);
        revokeImage(item.id);
        revokeQuoteImage(item.id);
      });
    };
    await done;
    await refreshData();
    if (currentConversationId === id) { currentConversationId = null; editingMessageId = null; screen = 'home'; }
    activeView = 'chats';
    closeModal();
    render();
    toast('对话已删除');
  }
  async function togglePin(id) {
    const conv = getConversation(id);
    if (!conv) return;
    conv.pinned = !conv.pinned;
    await put('conversations', conv);
    await refreshData();
    closeModal();
    render();
    toast(conv.pinned ? '已置顶' : '已取消置顶');
  }
  async function copyMessage(id) {
    const message = messages.find(item => item.id === id);
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message.content || message.quote?.content || '');
      toast('已复制');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message.content || message.quote?.content || '';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      toast('已复制');
    }
    closeModal();
  }

  function downloadFile(filename, content, mime = 'application/octet-stream') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function safeFilename(value) { return (value || 'conversation').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40); }
  async function exportConversation(id) {
    const conv = getConversation(id);
    if (!conv) return;
    const list = getConversationMessages(id);
    const lines = [`# ${conv.title}`, ''];
    for (const message of list) {
      if (message.quote) {
        const quotedContent = message.quote.type === 'image' ? '图片' : (message.quote.content || '');
        lines.push('【引用】' + quotedContent);
      }
      lines.push(message.type === 'image' ? '【图片】' : (message.content || ''), '');
    }
    downloadFile(`${safeFilename(conv.title)}.txt`, lines.join('\n'), 'text/plain;charset=utf-8');
    closeModal();
    toast('TXT 文件已生成');
  }
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('无法读取图片'));
      reader.readAsDataURL(blob);
    });
  }
  async function serializeRecord(record) {
    if (!record) return record;
    const copy = { ...record };
    if (copy.blob instanceof Blob) {
      copy.imageDataUrl = await blobToDataUrl(copy.blob);
      delete copy.blob;
    }
    if (copy.quote?.imageBlob instanceof Blob) {
      copy.quote = { ...copy.quote, imageDataUrl: await blobToDataUrl(copy.quote.imageBlob) };
      delete copy.quote.imageBlob;
    }
    if (copy.original) copy.original = await serializeRecord(copy.original);
    return copy;
  }
  function dataUrlToBlob(dataUrl) {
    const [meta, data] = dataUrl.split(',');
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  function deserializeRecord(record) {
    if (!record) return record;
    const copy = { ...record };
    if (copy.imageDataUrl) {
      copy.blob = dataUrlToBlob(copy.imageDataUrl);
      delete copy.imageDataUrl;
    }
    if (copy.quote?.imageDataUrl) {
      copy.quote = { ...copy.quote, imageBlob: dataUrlToBlob(copy.quote.imageDataUrl) };
      delete copy.quote.imageDataUrl;
    }
    if (copy.original) copy.original = deserializeRecord(copy.original);
    return copy;
  }
  async function exportBackup() {
    try {
      const serializedMessages = await Promise.all(messages.map(serializeRecord));
      const serializedTrash = await Promise.all(trashItems.map(serializeRecord));
      const data = { app: 'suixiang', version: 1, exportedAt: new Date().toISOString(), conversations, messages: serializedMessages, trash: serializedTrash, settings };
      downloadFile(`随想备份_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data), 'application/json;charset=utf-8');
      toast('JSON 备份已生成');
    } catch (error) {
      console.error(error);
      toast('备份失败，请检查手机可用空间');
    }
  }
  async function importBackup(file) {
    try {
      const raw = JSON.parse(await file.text());
      if (!raw || raw.app !== 'suixiang' || raw.version !== 1 || !Array.isArray(raw.conversations) || !Array.isArray(raw.messages)) throw new Error('备份文件格式不正确');
      const importedConversations = raw.conversations.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string');
      const importedMessages = raw.messages.filter(item => item && typeof item.id === 'string' && typeof item.conversationId === 'string').map(deserializeRecord);
      const importedTrash = Array.isArray(raw.trash) ? raw.trash.filter(item => item && typeof item.id === 'string').map(deserializeRecord) : [];
      const tx = db.transaction(['conversations', 'messages', 'trash', 'settings'], 'readwrite');
      importedConversations.forEach(item => tx.objectStore('conversations').put(item));
      importedMessages.forEach(item => tx.objectStore('messages').put(item));
      importedTrash.forEach(item => tx.objectStore('trash').put(item));
      if (raw.settings && typeof raw.settings === 'object' && ['system', 'light', 'dark'].includes(raw.settings.theme)) tx.objectStore('settings').put({ key: 'theme', value: raw.settings.theme });
      if (raw.settings && typeof raw.settings === 'object' && ['default', 'youmessage'].includes(raw.settings.preset)) tx.objectStore('settings').put({ key: 'preset', value: raw.settings.preset });
      await txDone(tx);
      await refreshData();
      render();
      toast(`已导入 ${importedConversations.length} 个对话、${importedMessages.length} 条消息`);
    } catch (error) {
      console.error(error);
      toast(`导入失败：${error.message || '文件读取错误'}`);
    } finally {
      backupPicker.value = '';
    }
  }

  function openInstallHelp() {
    const content = installPrompt
      ? '浏览器已提供安装选项。点击下方按钮，可将「随想」添加到手机桌面。'
      : '在 Android 的 Chrome 或 Edge 中打开本应用，点浏览器右上角菜单，选择「安装应用」或「添加到主屏幕」。安装后可以像普通 App 一样从桌面打开。';
    showModal('安装到手机', `<p class="small-note">${content}</p><p class="small-note">首次安装并成功打开一次后，应用文件会缓存到本机。之后再次打开可离线使用。</p>`, `<div class="modal-actions"><button class="btn-secondary" data-action="modal-close">知道了</button>${installPrompt ? `<button class="btn-primary" data-action="confirm-install">立即安装</button>` : ''}</div>`);
  }

  function setUpdateFeedback(message, buttonText) {
    const status = document.getElementById('update-status');
    const button = document.getElementById('check-update-button');
    if (status) status.textContent = message;
    if (button && buttonText) button.textContent = buttonText;
  }

  async function waitForServiceWorkerUpdate(registration, activeBefore, controllerBefore) {
    const deadline = Date.now() + 10000;
    const hasChanged = () => (
      (registration.active && registration.active !== activeBefore) ||
      (navigator.serviceWorker.controller && navigator.serviceWorker.controller !== controllerBefore)
    );

    while (Date.now() < deadline) {
      if (hasChanged()) return true;

      const worker = registration.installing || registration.waiting;
      if (!worker) return false;
      if (worker.state === 'redundant') return false;
      if (worker.state === 'activated') return hasChanged();

      const remaining = deadline - Date.now();
      if (remaining <= 0) return null;

      await new Promise(resolve => {
        let finished = false;
        let timer;
        const finish = () => {
          if (finished) return;
          finished = true;
          worker.removeEventListener('statechange', onStateChange);
          clearTimeout(timer);
          resolve();
        };
        const onStateChange = () => {
          if (worker.state === 'activated' || worker.state === 'redundant') finish();
        };
        worker.addEventListener('statechange', onStateChange);
        timer = setTimeout(finish, remaining);
      });
    }

    return hasChanged() ? true : null;
  }

  async function checkForUpdates(button) {
    if (updateCheckInProgress) return;
    const updateButton = button || document.getElementById('check-update-button');
    if (updateButton) {
      updateButton.disabled = true;
      updateButton.textContent = '检查中…';
    }
    updateCheckInProgress = true;

    let reloadRequired = false;
    try {
      if (!('serviceWorker' in navigator)) {
        setUpdateFeedback('当前浏览器不支持应用更新检查。', '检查更新');
        return;
      }
      if (!navigator.onLine) {
        setUpdateFeedback('当前处于离线状态，请联网后重试。', '重新检查');
        return;
      }

      const registration = serviceWorkerRegistration || await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register('./sw.js');
      serviceWorkerRegistration = registration;

      if (serviceWorkerUpdateReady) {
        setUpdateFeedback('已发现新版本，正在刷新应用…', '正在更新…');
        reloadRequired = true;
        window.location.reload();
        return;
      }

      const activeBefore = registration.active;
      const controllerBefore = navigator.serviceWorker.controller;
      await registration.update();
      const changed = await waitForServiceWorkerUpdate(registration, activeBefore, controllerBefore);

      if (changed || serviceWorkerUpdateReady || registration.waiting) {
        serviceWorkerUpdateReady = true;
        setUpdateFeedback('已发现新版本，正在刷新应用…', '正在更新…');
        reloadRequired = true;
        window.location.reload();
      } else if (changed === null) {
        setUpdateFeedback('更新仍在准备中，请稍后重新检查。', '重新检查');
      } else {
        setUpdateFeedback(`当前已是最新版本（v${APP_VERSION}）`, '重新检查');
      }
    } catch (error) {
      console.warn('Update check failed', error);
      setUpdateFeedback('检查更新失败，请确认网络连接后重试。', '重新检查');
    } finally {
      updateCheckInProgress = false;
      if (!reloadRequired && updateButton) updateButton.disabled = false;
    }
  }

  // Event delegation
  document.addEventListener('click', async event => {
    const target = event.target.closest('[data-action]');
    if (!target) {
      if (event.target.classList.contains('modal-backdrop')) closeModal();
      return;
    }
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (action === 'backdrop-close' && event.target === target) closeModal();
    else if (action === 'modal-close') closeModal();
    else if (action === 'new-conversation') openConversationForm();
    else if (action === 'open-search') { searchQuery = ''; screen = 'search'; render(); }
    else if (action === 'clear-search') { searchQuery = ''; const input = document.getElementById('global-search'); if (input) { input.value = ''; input.focus(); } refreshSearchResults(); }
    else if (action === 'back-home') { screen = 'home'; editingMessageId = null; pendingQuote = null; revokeQuoteImage('composer'); render(); }
    else if (action === 'change-tab') { activeView = target.dataset.tab; screen = 'home'; editingMessageId = null; pendingQuote = null; revokeQuoteImage('composer'); render(); }
    else if (action === 'open-chat') { currentConversationId = id; screen = 'chat'; editingMessageId = null; pendingQuote = null; revokeQuoteImage('composer'); render(); }
    else if (action === 'conversation-menu') { openConversationMenu(id); }
    else if (action === 'scroll-chat-top') scrollChatToEdge('top');
    else if (action === 'scroll-chat-bottom') scrollChatToEdge('bottom');
    else if (action === 'rename-conversation') { closeModal(); openConversationForm(getConversation(id)); }
    else if (action === 'toggle-pin') await togglePin(id);
    else if (action === 'export-conversation') await exportConversation(id);
    else if (action === 'delete-conversation') openDeleteConversationConfirm(id);
    else if (action === 'quote-message') startQuoteMessage(id);
    else if (action === 'jump-quote') { if (longPressTriggered) { longPressTriggered = false; return; } jumpToQuotedMessage(id, target.dataset.targetId); }
    else if (action === 'cancel-quote') {
      pendingQuote = null;
      revokeQuoteImage('composer');
      renderComposerQuotePreview();
      updateSendButton();
      document.getElementById('composer-input')?.focus();
    }
    else if (action === 'edit-message') await beginEditMessage(id);
    else if (action === 'copy-message') await copyMessage(id);
    else if (action === 'favorite-toggle') await toggleFavorite(id);
    else if (action === 'delete-message') await deleteMessage(id);
    else if (action === 'cancel-edit') { editingMessageId = null; render(); }
    else if (action === 'view-image') { const msg = messages.find(item => item.id === id); closeModal(); openImageViewer(msg); }
    else if (action === 'restore-message') await restoreMessage(id);
    else if (action === 'permanent-delete') await permanentlyDelete(id);
    else if (action === 'empty-trash') {
      showModal('清空回收站？', `<form id="empty-trash-form"><p class="small-note">回收站中的消息和图片将被彻底删除，无法恢复。</p>${modalActions('取消', '彻底清空', 'btn-danger')}</form>`);
    }
    else if (action === 'jump-message') {
      const msg = messages.find(item => item.id === id);
      if (msg) {
        currentConversationId = msg.conversationId;
        pendingJumpTo = id;
        pendingScrollTop = null;
        screen = 'chat';
        editingMessageId = null;
        pendingQuote = null;
        revokeQuoteImage('composer');
        render();
      }
    }
    else if (action === 'send-opposite') await sendTextMessage('left');
    else if (action === 'toggle-message-side') await toggleMessageSide(id);
    else if (action === 'choose-image') imagePicker.click();
    else if (action === 'export-backup') await exportBackup();
    else if (action === 'import-backup') backupPicker.click();
    else if (action === 'export-one') {
      const choices = sortedConversations();
      if (!choices.length) { toast('还没有可以导出的对话'); return; }
      showModal('选择要导出的对话', `<div class="menu-list">${choices.map(conv => `<button class="menu-item" data-action="export-conversation" data-id="${esc(conv.id)}"><span>${esc(conv.icon || '✦')}</span>${esc(conv.title)}</button>`).join('')}</div>`);
    }
    else if (action === 'persist-storage') {
      if (navigator.storage?.persist) {
        const granted = await navigator.storage.persist();
        toast(granted ? '浏览器已授予持久化存储' : '浏览器未授予持久化存储，可定期备份');
      } else toast('当前浏览器不支持此功能');
    }
    else if (action === 'check-update') await checkForUpdates(target);
    else if (action === 'install-app') openInstallHelp();
    else if (action === 'confirm-install') {
      if (installPrompt) {
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
      }
      closeModal();
    }
    else if (action === 'theme-cycle') {
      const order = ['system', 'light', 'dark'];
      settings.theme = order[(order.indexOf(settings.theme) + 1) % order.length];
      await put('settings', { key: 'theme', value: settings.theme });
      await refreshData();
      render();
    }
  });

  document.addEventListener('submit', async event => {
    if (event.target.id === 'composer-form') {
      event.preventDefault();
      await sendTextMessage();
    } else if (event.target.id === 'conversation-form') {
      event.preventDefault();
      const data = new FormData(event.target);
      const title = safeText(data.get('title'));
      const emoji = safeText(data.get('icon')) || '✦';
      const editId = event.target.dataset.editId;
      if (!title) return;
      if (editId) {
        const conv = getConversation(editId);
        if (conv) { conv.title = title; conv.icon = emoji; await put('conversations', conv); await refreshData(); closeModal(); render(); toast('对话已更新'); }
      } else {
        closeModal();
        await createConversation(title, emoji);
      }
    } else if (event.target.id === 'delete-conv-form') {
      event.preventDefault();
      await deleteConversation(event.target.dataset.id);
    } else if (event.target.id === 'empty-trash-form') {
      event.preventDefault();
      closeModal();
      await emptyTrash();
    }
  });

  document.addEventListener('input', event => {
    if (event.target.id === 'composer-input') {
      resizeComposer(event.target);
      updateSendButton();
    } else if (event.target.id === 'global-search') {
      searchQuery = event.target.value;
      refreshSearchResults();
    }
  });
  document.addEventListener('change', async event => {
    if (event.target.id === 'theme-select') {
      settings.theme = event.target.value;
      await put('settings', { key: 'theme', value: settings.theme });
      await refreshData();
      render();
    }
    else if (event.target.id === 'preset-select') {
  settings.preset = event.target.value === 'youmessage' ? 'youmessage' : 'default';
  await put('settings', { key: 'preset', value: settings.preset });
  await refreshData();
  render();
}
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (modalRoot.innerHTML) closeModal();
      else if (screen !== 'home') { screen = 'home'; render(); }
    }
    if (event.target.matches('[data-action="open-chat"]') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      currentConversationId = event.target.dataset.id;
      screen = 'chat';
      render();
    }
  });

  document.addEventListener('pointerdown', event => {
    if (event.target.closest('#send-button, [data-action="send-opposite"]')) {
  event.preventDefault();
  return;
}
    const bubble = event.target.closest('.message-bubble[data-id], .message-quote[data-id]');
    if (!bubble) return;
    const id = bubble.dataset.id;
    longPressTriggered = false;
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      longPressTriggered = true;
      openMessageMenu(id);
    }, 520);
  });
  ['pointerup', 'pointercancel', 'pointermove'].forEach(name => document.addEventListener(name, () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }, { passive: true }));
  document.addEventListener('contextmenu', event => {
    if (event.target.closest('.message-bubble[data-id], .message-quote[data-id]')) event.preventDefault();
  });

  imagePicker.addEventListener('change', async event => {
    const files = event.target.files;
    if (files?.length) await sendImageFiles(files);
    imagePicker.value = '';
  });
  backupPicker.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (file) await importBackup(file);
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => toast('已安装到手机桌面'));
  if ('serviceWorker' in navigator) {
    serviceWorkerController = navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const currentController = navigator.serviceWorker.controller;
      if (serviceWorkerController && currentController && currentController !== serviceWorkerController) {
        serviceWorkerUpdateReady = true;
        setUpdateFeedback('已发现新版本，点击“立即更新”即可刷新。', '立即更新');
      }
      serviceWorkerController = currentController;
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => { serviceWorkerRegistration = registration; })
        .catch(error => console.warn('Service worker registration failed', error));
    });
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
      if (settings.theme === 'system') applyTheme();
    });
  }

  async function init() {
    try {
      db = await openDatabase();
      await refreshData();
      render();
    } catch (error) {
      console.error(error);
      app.innerHTML = `<div class="empty-state"><div class="empty-title">暂时无法打开本地数据库</div><div class="empty-copy">请使用支持 IndexedDB 的现代浏览器，并通过 HTTPS 或 localhost 打开应用。</div></div>`;
    }
  }
  init();
})();
