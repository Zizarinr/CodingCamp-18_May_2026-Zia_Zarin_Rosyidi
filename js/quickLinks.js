/**
 * quickLinks.js — testable ES module export.
 * Exposes the QuickLinks object for use in tests.
 */

import { StorageService } from './storageService.js';

var QuickLinks = {
  _links: [],

  init: function () {
    if (typeof document === 'undefined') return;
    var storedLinks = StorageService.get('links');
    QuickLinks._links = Array.isArray(storedLinks) ? storedLinks : [];
    QuickLinks.render();

    var form = document.getElementById('links-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var labelInput = document.getElementById('link-label-input');
        var urlInput = document.getElementById('link-url-input');
        var label = labelInput ? labelInput.value : '';
        var url = urlInput ? urlInput.value : '';
        QuickLinks.addLink(label, url);
      });
    }
  },

  addLink: function (label, url) {
    var errorEl = (typeof document !== 'undefined') ? document.getElementById('links-error') : null;
    if (errorEl) errorEl.textContent = '';

    var trimmedLabel = (typeof label === 'string') ? label.trim() : '';
    var trimmedUrl = (typeof url === 'string') ? url.trim() : '';

    if (trimmedLabel.length === 0) {
      if (errorEl) errorEl.textContent = 'Label cannot be empty.';
      return;
    }

    if (!QuickLinks.validateUrl(trimmedUrl)) {
      if (errorEl) errorEl.textContent = 'Invalid URL. Must be http:// or https://.';
      return;
    }

    var link = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Date.now().toString(),
      label: trimmedLabel,
      url: trimmedUrl
    };

    QuickLinks._links.push(link);
    QuickLinks.save();
    QuickLinks.render();

    if (typeof document !== 'undefined') {
      var labelInput = document.getElementById('link-label-input');
      var urlInput = document.getElementById('link-url-input');
      if (labelInput) labelInput.value = '';
      if (urlInput) urlInput.value = '';
      if (labelInput) labelInput.focus();
    }
  },

  deleteLink: function (id) {
    QuickLinks._links = QuickLinks._links.filter(function (l) { return l.id !== id; });
    QuickLinks.save();
    QuickLinks.render();
  },

  openLink: function (url) {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  validateUrl: function (url) {
    try {
      var parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_e) {
      return false;
    }
  },

  render: function () {
    if (typeof document === 'undefined') return;
    var panel = document.getElementById('links-panel');
    if (!panel) return;
    panel.innerHTML = '';
    QuickLinks._links.forEach(function (link) {
      var el = QuickLinks.renderLink(link);
      if (el) panel.appendChild(el);
    });
  },

  renderLink: function (link) {
    if (typeof document === 'undefined') return null;
    var div = document.createElement('div');
    div.className = 'quick-link';

    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.textContent = link.label;
    openBtn.setAttribute('aria-label', 'Open link: ' + link.label);
    openBtn.addEventListener('click', function () {
      QuickLinks.openLink(link.url);
    });

    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
    delBtn.addEventListener('click', function () {
      QuickLinks.deleteLink(link.id);
    });

    div.appendChild(openBtn);
    div.appendChild(delBtn);
    return div;
  },

  save: function () {
    return StorageService.set('links', QuickLinks._links);
  }
};

export { QuickLinks };
