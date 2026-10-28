/* Хранилище: всё содержимое базы шифруется целиком (AES-GCM), ключ выводится
   из мастер-пароля через PBKDF2-SHA256. В IndexedDB лежит только шифртекст. */
(function () {
  'use strict';
  var DB_NAME = 'kartoteka', STORE = 'vault', KEY = 'main';
  var ITER = 600000;
  var AAD = new TextEncoder().encode('kartoteka:v1');
  var enc = new TextEncoder(), dec = new TextDecoder();
  var key = null;      // CryptoKey, не извлекаемый
  var record = null;   // последняя сохранённая зашифрованная запись
  var queue = Promise.resolve();

  function b64(buf) {
    var a = new Uint8Array(buf), s = '';
    for (var i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }

  function openDb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idb(mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(STORE, mode), out = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { db.close(); res(out && out.result); };
        tx.onerror = tx.onabort = function () { db.close(); rej(tx.error); };
      });
    });
  }

  function deriveKey(password, salt, iter) {
    return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }
  function encrypt(k, data, meta) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: AAD }, k, enc.encode(JSON.stringify(data)))
      .then(function (ct) {
        return { app: 'kartoteka', v: 1, kdf: 'PBKDF2-SHA256', iter: meta.iter, salt: meta.salt, iv: b64(iv), ct: b64(ct) };
      });
  }
  function decrypt(k, rec) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv), additionalData: AAD }, k, unb64(rec.ct))
      .then(function (buf) { return JSON.parse(dec.decode(buf)); });
  }
  function validRecord(r) {
    return r && r.app === 'kartoteka' && r.v === 1 && typeof r.salt === 'string' && typeof r.iv === 'string' &&
      typeof r.ct === 'string' && Number.isInteger(r.iter) && r.iter >= 100000 && r.iter <= 10000000;
  }

  function persist(data) {
    var meta = { iter: record.iter, salt: record.salt };
    var k = key;
    queue = queue.then(function () {
      if (!k) throw new Error('Хранилище заблокировано');
      return encrypt(k, data, meta).then(function (rec) {
        return idb('readwrite', function (s) { return s.put(rec, KEY); }).then(function () { record = rec; });
      });
    });
    return queue.catch(function (e) { queue = Promise.resolve(); throw e; });
  }

  window.Vault = {
    ITER: ITER,
    isUnlocked: function () { return !!key; },
    exists: function () {
      return idb('readonly', function (s) { return s.get(KEY); }).then(function (r) { record = r || null; return !!r; });
    },
    create: function (password, data) {
      var salt = crypto.getRandomValues(new Uint8Array(16));
      return deriveKey(password, salt, ITER).then(function (k) {
        key = k; record = { iter: ITER, salt: b64(salt) };
        return persist(data);
      });
    },
    unlock: function (password) {
      if (!validRecord(record)) return Promise.reject(new Error('Хранилище повреждено'));
      return deriveKey(password, unb64(record.salt), record.iter).then(function (k) {
        return decrypt(k, record).then(function (data) { key = k; return data; });
      });
    },
    save: persist,
    lock: function () { key = null; },
    exportText: function () { return JSON.stringify(record); },
    /* Расшифровывает файл экспорта его собственным мастер-паролем, не меняя текущую базу. */
    decryptFile: function (text, password) {
      var rec;
      try { rec = JSON.parse(text); } catch (e) { return Promise.reject(new Error('format')); }
      if (!validRecord(rec)) return Promise.reject(new Error('format'));
      return deriveKey(password, unb64(rec.salt), rec.iter).then(function (k) { return decrypt(k, rec); });
    },
    isRecord: function (text) { try { return validRecord(JSON.parse(text)); } catch (e) { return false; } },
    changePassword: function (password, data) {
      var salt = crypto.getRandomValues(new Uint8Array(16));
      return deriveKey(password, salt, ITER).then(function (k) {
        key = k; record = { iter: ITER, salt: b64(salt) };
        return persist(data);
      });
    },
    wipe: function () {
      key = null; record = null;
      return idb('readwrite', function (s) { return s.delete(KEY); });
    }
  };
})();
