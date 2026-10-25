/* ================= bash-style terminal layer =================
   Relies on globals from index.html inline script:
   doCompress / doDecompress / doTextEncode / doTextDecode /
   setStatus / setProgress, etc. */
(function () {
  var out = document.getElementById('termOut');
  var inp = document.getElementById('cmdInput');
  var cmdLine = document.getElementById('cmdLine');
  var psEl = document.getElementById('ps1');
  var LANGS = (typeof LANG_ORDER !== 'undefined') ? LANG_ORDER : ['zh_Hans', 'en_US'];
  var cwd = '~';
  var mode = 'normal';   /* normal | pw1 | pw2 */
  var pwFirst = '';

  var FS = {
    '~': { dirs: ['games', 'contrap', 'tools', 'settings'], files: ['index.html', 'nav.html', '404.html', 'favicon.png'] },
    '~/games': { dirs: [], files: ['index.html'] },
    '~/contrap': { dirs: [], files: ['index.html'] },
    '~/tools': { dirs: [], files: ['index.html'] },
    '~/settings': { dirs: [], files: ['index.html'] }
  };
  var MAN = {
    help: ['HELP(1)', '  Display available commands.'],
    encrypt: ['ENCRYPT(1)', '  Encrypt selected files. Opens a file picker when nothing is selected.'],
    decrypt: ['DECRYPT(1)', '  Decrypt .cz files. Opens a file picker when nothing is selected.'],
    text: ['TEXT(1)', '  Usage: text encode <text> | text decode <text>'],
    key: ['KEY(1)', '  Usage: key <password>   Set the password directly.'],
    passwd: ['PASSWD(1)', '  Usage: passwd [password]   Change the password (interactive when omitted).'],
    name: ['NAME(1)', '  Usage: name <filename>   Set the output file name (without .cz).'],
    lang: ['LANG(1)', '  Usage: lang <code>   One of: ' + LANGS.join(' / ')],
    files: ['FILES(1)', '  Show the currently selected files.'],
    pick: ['PICK(1)', '  Usage: pick | pick .cz   Open the file picker.'],
    cd: ['CD(1)', '  Usage: cd <dir>   Change the virtual directory.'],
    ls: ['LS(1)', '  Usage: ls [-l]   List the current directory.'],
    cat: ['CAT(1)', '  Usage: cat <file>   Display a file.'],
    clear: ['CLEAR(1)', '  Clear the screen.'],
    support: ['SUPPORT(1)', '  Open the support page.']
  };
  function promptText() { return 'czealo@states:' + cwd + '$ '; }
  function scrollDown() { out.scrollTop = out.scrollHeight; }
  function setPrompt() { psEl.textContent = promptText(); }

  function add(text, cls) {
    var d = document.createElement('div');
    d.className = 'line' + (cls ? ' ' + cls : '');
    d.textContent = text;
    out.insertBefore(d, cmdLine);
    scrollDown();
    return d;
  }
  function echo(cmd) {
    var d = document.createElement('div');
    d.className = 'line';
    var s = document.createElement('span');
    s.className = 'ps1';
    s.textContent = promptText();
    d.appendChild(s);
    d.appendChild(document.createTextNode(cmd));
    out.insertBefore(d, cmdLine);
    scrollDown();
  }

  var HELP = [
    'CZEncoder bash — built-in commands:',
    '',
    '  encrypt                  Encrypt selected files (opens a picker when empty)',
    '  decrypt                  Decrypt .cz files (opens a picker when empty)',
    '  text encode <text>       Encrypt a text string',
    '  text decode <text>       Decrypt a text string',
    '  files                    Show selected files',
    '  passwd [password]        Change the password (interactive when omitted)',
    '  key <password>           Set the password directly',
    '  name <filename>          Set the output file name',
    '  lang <code>              Switch language: zh_Hans / zh_Hant / en_US / ja_JP / ko_KR / ru_RU',
    '  pick | pick .cz          Open the file picker',
    '  support                  Open the support page',
    '  cd <dir> / ls [-l] / cat <file> / man <cmd>',
    '  clear / cls              Clear the screen',
    '  echo / date / history / uname / id / uptime / neofetch',
    '  which / pwd / whoami / version / !! / exit / sudo / rm',
    ''
  ];

  /* Route the original status output into the terminal */
  var origStatus = window.setStatus, origTextStatus = window.setTextStatus, origProgress = window.setProgress;
  var lastStatus = null;
  if (typeof origStatus === 'function') {
    window.setStatus = function (text, cls) {
      origStatus(text, cls);
      if (!text) return;
      var key = String(text).slice(0, 12);
      if (lastStatus && lastStatus.key === key) {
        lastStatus.el.textContent = text;
        lastStatus.el.className = 'line' + (cls === 'ok' ? ' ok' : cls === 'err' ? ' err' : '');
        return;
      }
      var d = document.createElement('div');
      d.className = 'line' + (cls === 'ok' ? ' ok' : cls === 'err' ? ' err' : '');
      d.textContent = text;
      out.insertBefore(d, cmdLine);
      out.scrollTop = out.scrollHeight;
      lastStatus = { key: key, el: d };
    };
  }
  if (typeof origTextStatus === 'function') {
    window.setTextStatus = function (text, cls) {
      origTextStatus(text, cls);
      if (text) add('[text] ' + text, cls === 'ok' ? 'ok' : cls === 'err' ? 'err' : '');
    };
  }
  var progEl = null;
  if (typeof origProgress === 'function') {
    window.setProgress = function (p) {
      origProgress(p);
      if (!progEl) {
        progEl = document.createElement('div');
        progEl.className = 'line';
        out.insertBefore(progEl, cmdLine);
      }
      var n = Math.max(0, Math.min(100, Math.round(p)));
      var f = Math.round(n / 10);
      progEl.textContent = '  [' + '█'.repeat(f) + '░'.repeat(10 - f) + '] ' + n + '%';
      out.scrollTop = out.scrollHeight;
      if (n >= 100) progEl = null;
    };
  }

  function picker(isDec) {
    var el = document.getElementById(isDec ? 'decompressInput' : 'compressInput');
    if (el) el.click();
  }
  function filesList() {
    var f = (typeof compressFiles !== 'undefined') ? compressFiles : [];
    if (!f.length) add('(empty) no files selected', 'info');
    f.forEach(function (x) {
      add('  ' + x.name + '  (' + (x.size / 1024).toFixed(1) + ' KB)');
    });
    if (typeof decompressFile !== 'undefined' && decompressFile) {
      add('  pending decrypt: ' + decompressFile.name);
    }
  }
  function doText(dir, content) {
    var ti = document.getElementById('textInput');
    ti.value = content;
    var p = (dir === 'encode') ? doTextEncode() : doTextDecode();
    return p.then(function () {
      var to = document.getElementById('textOutput');
      if (to.value) add('result: ' + to.value, 'hl');
    });
  }
  function setAllKeys(pw) {
    ['compressKey', 'decompressKey', 'textKey'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = pw;
    });
  }
  function startPasswd() {
    mode = 'pw1';
    inp.type = 'password';
    psEl.textContent = 'Enter new password: ';
    inp.focus();
  }
  function finishPasswd() {
    mode = 'normal';
    inp.type = 'text';
    setPrompt();
  }

  async function run(cmdline) {
    echo(cmdline);
    var parts = cmdline.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return;
    var c = parts[0].toLowerCase(), a = parts.slice(1);
    switch (c) {
      case 'help':
        HELP.forEach(function (t) { add(t, t === '' ? '' : 'info'); });
        break;
      case 'clear':
      case 'cls':
        while (out.firstChild && out.firstChild !== cmdLine) {
          out.removeChild(out.firstChild);
        }
        lastStatus = null;
        progEl = null;
        break;
      case 'encrypt':
        var cf = (typeof compressFiles !== 'undefined') ? compressFiles : [];
        if (!cf.length) {
          add('No files selected — opening the file picker...', 'info');
          picker(false);
        } else if (typeof doCompress === 'function') {
          await doCompress();
        }
        break;
      case 'decrypt':
        if (typeof decompressFile === 'undefined' || !decompressFile) {
          add('No .cz file selected — opening the file picker...', 'info');
          picker(true);
        } else if (typeof doDecompress === 'function') {
          await doDecompress();
        }
        break;
      case 'pick':
        picker(a[0] === '.cz');
        break;
      case 'files':
        filesList();
        break;
      case 'passwd':
        if (a.length) {
          setAllKeys(a.join(' '));
          add('passwd: password updated successfully', 'ok');
        } else {
          startPasswd();
        }
        break;
      case 'key':
        if (!a.length) { add('bash: key: missing operand (password)', 'err'); break; }
        setAllKeys(a.join(' '));
        add('Password set for encrypt / decrypt / text.', 'ok');
        break;
      case 'name':
        if (!a.length) { add('Usage: name <filename>', 'err'); break; }
        document.getElementById('customFileName').value = a.join(' ');
        add('Output file name set to: ' + a.join(' ') + '.cz', 'ok');
        break;
      case 'lang':
        var code = a[0];
        if (!code) { add('Usage: lang <code>   one of: ' + LANGS.join(' / '), 'err'); break; }
        var sel = document.getElementById('langSelect');
        if (sel && LANGS.indexOf(code) > -1) {
          sel.value = code;
          sel.dispatchEvent(new Event('change'));
          try { localStorage.setItem('czealo_lang', code); } catch (err) {}
          add('Language set to ' + code, 'ok');
        } else {
          add('bash: lang: invalid language: ' + code, 'err');
        }
        break;
      case 'text':
        if (a[0] === 'encode' || a[0] === 'decode') {
          var content = a.slice(1).join(' ');
          if (!content) { add('Usage: text ' + a[0] + ' <text>', 'err'); break; }
          await doText(a[0], content);
        } else {
          add('Usage: text encode <text> | text decode <text>', 'err');
        }
        break;
      case 'encode':
      case 'decode':
        var content2 = a.join(' ');
        if (!content2) { add('Usage: ' + c + ' <text>', 'err'); break; }
        await doText(c, content2);
        break;
      case 'support':
        add('Opening support page...', 'info');
        window.open('https://www.afdian.com/a/Czealo', '_blank', 'noopener,noreferrer');
        break;
      case 'ls':
        var node = FS[cwd] || FS['~'];
        if (a[0] === '-l') {
          node.dirs.forEach(function (x) { add('drwxr-xr-x 2 czealo czealo 4096 ' + x + '/'); });
          node.files.forEach(function (x) { add('-rw-r--r-- 1 czealo czealo 2048 ' + x); });
          if (!node.dirs.length && !node.files.length) add('total 0');
        } else if (node.dirs.length || node.files.length) {
          if (node.dirs.length) add(node.dirs.map(function (x) { return x + '/'; }).join('   '), 'hl');
          if (node.files.length) add(node.files.join('   '));
        }
        break;
      case 'cd':
        var t = a[0];
        if (!t || t === '~' || t === '/') { cwd = '~'; setPrompt(); break; }
        var base = cwd === '~' ? '' : cwd.slice(2);
        var path = (t === '..') ? base.replace(/\/?[^\/]+$/, '') : ((t.charAt(0) === '/') ? t.replace(/^\/+/, '') : (base ? base + '/' + t : t));
        var norm = path ? '~/' + path : '~';
        norm = norm.replace(/\/+$/, '');
        if (FS[norm]) { cwd = norm; setPrompt(); }
        else add('bash: cd: ' + t + ': No such file or directory', 'err');
        break;
      case 'pwd':
        add('/home/czealo/states' + (cwd === '~' ? '' : cwd.slice(1)));
        break;
      case 'man':
        var mp = MAN[a[0]];
        if (mp) mp.forEach(function (x) { add(x, 'info'); });
        else add('No manual entry for ' + (a[0] || '(null)'), 'err');
        break;
      case 'which':
        if (a[0]) add('/usr/local/bin/' + a[0]);
        else add('bash: which: missing argument', 'err');
        break;
      case 'id':
        add('uid=1000(czealo) gid=1000(czealo) groups=1000(czealo),27(sudo)');
        break;
      case 'uptime':
        add(' ' + new Date().toTimeString().slice(0, 8) + ' up 3 days, 2:14,  1 user,  load average: 0.00, 0.01, 0.00');
        break;
      case 'neofetch':
        add('        czealo@states', 'hl');
        add('        ------------', 'hl');
        add('  OS       : CzealoOS 1.0 (terminal edition)');
        add('  Shell    : bash 5.2.21');
        add('  Kernel   : 6.8.0-ba1');
        add('  Uptime   : 114514 minutes');
        add('  Packages : 1 (czencoder)');
        add('  Terminal : black-box terminal');
        add('  CPU      : Czealo Core i9-1919810 @ 2.60GHz');
        add('  Locale   : en_US');
        break;
      case '!!':
        var rep = hist[hist.length - 1];
        if (rep === '!!') rep = hist[hist.length - 2];
        if (!rep) { add('bash: !!: no previous command', 'err'); break; }
        return run(rep);
      case 'whoami':
        add('czealo');
        break;
      case 'version':
        add('GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)');
        break;
      case 'exit':
        add('exit: no shell to exit; you are already in the browser', 'info');
        break;
      case 'sudo':
        add('czealo is not in the sudoers file. This incident will be reported.', 'err');
        break;
      case 'rm':
        add('rm: permission denied (thank goodness)', 'err');
        break;
      case 'echo':
        add(a.join(' '));
        break;
      case 'date':
        add(new Date().toString());
        break;
      case 'history':
        hist.forEach(function (h, i) { add('  ' + (i + 1) + '  ' + h); });
        break;
      case 'uname':
        add('Linux czealo-states 6.8.0-ba1 #1 SMP PREEMPT x86_64 GNU/Linux');
        break;
      case 'cat':
        var file = a[0];
        if (!file) { add('cat: missing operand', 'err'); break; }
        var fn = FS[cwd] || FS['~'];
        if (fn.files.indexOf(file) === -1) { add('cat: ' + file + ': No such file or directory', 'err'); break; }
        var full = (cwd === '~' ? '' : cwd.slice(2) + '/') + file;
        if (full === '404.html') add('404: this page does not exist... but here it is (logic complete)', 'err');
        else if (full === 'index.html') add('(the HTML source is too long to display here)', 'info');
        else if (full === 'nav.html') add('navigation? just open the menu yourself.', 'info');
        else if (full === 'favicon.png') add('cat: favicon.png: binary file (not shown)', 'err');
        else add('(empty file)', 'info');
        break;
      default:
        add('bash: ' + c + ': command not found', 'err');
    }
  }

  var CMDS = ['help', 'encrypt', 'decrypt', 'text', 'encode', 'decode', 'files', 'passwd', 'key', 'name', 'lang', 'pick', 'support', 'clear', 'cls', 'ls', 'cd', 'pwd', 'whoami', 'version', 'exit', 'sudo', 'rm', 'echo', 'date', 'history', 'uname', 'cat', 'man', 'which', 'id', 'uptime', 'neofetch'];
  var hist = [], hi = 0;

  inp.addEventListener('keydown', function (e) {
    if (mode !== 'normal') {
      if (e.key === 'Enter') {
        var val = inp.value;
        inp.value = '';
        if (mode === 'pw1') {
          if (!val) { add('passwd: password cannot be empty', 'err'); finishPasswd(); return; }
          pwFirst = val;
          mode = 'pw2';
          psEl.textContent = 'Retype new password: ';
          inp.focus();
        } else {
          if (val === pwFirst) {
            setAllKeys(val);
            add('passwd: password updated successfully', 'ok');
            finishPasswd();
          } else {
            add('passwd: passwords do not match, try again', 'err');
            mode = 'pw1';
            inp.type = 'password';
            psEl.textContent = 'Enter new password: ';
            inp.focus();
          }
        }
      }
      return;
    }
    if (e.key === 'Enter') {
      var v = inp.value;
      inp.value = '';
      if (v.trim()) hist.push(v);
      hi = hist.length;
      run(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hist.length) return;
      hi = Math.max(0, hi - 1);
      inp.value = hist[hi];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!hist.length) return;
      hi = Math.min(hist.length, hi + 1);
      inp.value = (hi === hist.length) ? '' : hist[hi];
    } else if (e.key === 'Tab') {
      e.preventDefault();
      var p = inp.value.split(/\s+/)[0].toLowerCase();
      var matches = CMDS.filter(function (x) { return x.indexOf(p) === 0; });
      if (matches.length) {
        var cur = (matches.indexOf(p) === -1) ? -1 : matches.indexOf(p);
        inp.value = matches[(cur + 1) % matches.length] + ' ';
      }
    }
  });

  document.querySelector('.terminal').addEventListener('click', function () {
    inp.focus();
  });

  /* ---- boot ---- */
  var d = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  add('Last login: ' + d.toDateString() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' from 127.0.0.1', 'info');
  add("Type 'help' to see available commands.", 'info');
  add('');
  /* default language: en (or previously chosen) */
  (function initLang() {
    var code = 'en_US';
    try { code = localStorage.getItem('czealo_lang') || 'en_US'; } catch (err) {}
    var tries = 0;
    (function apply() {
      var sel = document.getElementById('langSelect');
      if (sel) {
        sel.value = code;
        sel.dispatchEvent(new Event('change'));
        try { currentLang = code; } catch (err) {}
        return;
      }
      if (++tries < 40) setTimeout(apply, 100);
    })();
  })();
  if (window.matchMedia('(pointer: fine)').matches) inp.focus();
})();
