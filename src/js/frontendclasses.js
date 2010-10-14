/* Vimiax frontend classes */

/* shortcuts */
S = {
	map: {}, /* current mode map */
	cmap: {}, /* command mode map */
	imap: {}, /* insert mode map */
	cs: '', /* command stack */

	/* Correction map for both Windows and Linux. See Webkit #19906. More
	 * informations are availables on ascii(7). */
	keyfix: {
		"U+00C0": ["U+0060", "U+007E"], // `~
		"U+00BD": ["U+002D", "U+005F"], // -_
		"U+00BB": ["U+003D", "U+002B"], // =+
		"U+00DB": ["U+005B", "U+007B"], // [{
		"U+00DD": ["U+005D", "U+007D"], // ]}
		"U+00DC": ["U+005C", "U+007C"], // \|
		"U+00BA": ["U+003B", "U+003A"], // ;:
		"U+00DE": ["U+0027", "U+0022"], // '"
		"U+00BC": ["U+002C", "U+003C"], // ,<
		"U+00BE": ["U+002E", "U+003E"], // .>
		"U+00BF": ["U+002F", "U+003F"], // /?
		"U+0034": ["U+0034", "U+0024"], // 4$
	},

	add: function(keys, cmd, mode) {
		if(!C[cmd])
			return;

		if(!mode)
			mode = D.modes.Command;

		if(!U.ismode(mode))
			return;

		switch(mode) {
			case D.modes.Command:
				S.cmap[keys] = C[cmd];
				break;
			case D.modes.Insert:
				S.imap[keys] = C[cmd];
				break;
			case D.modes.Global:
				S.cmap[keys] = C[cmd];
				S.imap[keys] = C[cmd];
				break;
		}
	},

	match: function(ev) {
		var s = '', m;

		if(U.ismodifier(ev))
			return [];

		if(S.cs)
			s = S.cs;
		s += S.unctrl(ev);
		m = S.find(s);

		/* 1 or more matches */
		if(m.length != 1) {
			S.cs = m.length ? s : '';
			return [];
		}

		/* Don't auto-match unambiguous commands */
		if(s != m[0]) {
			S.cs = s;
			return;
		}

		S.cs = '';
		return m[0];
	},

	find: function(ik) {
		var k, ret = [];

		S.setmap();

		for(k in S.map) {
			if(k.substr(0, ik.length) == ik)
				ret[ret.length] = k;
		}
		return ret;
	},

	unctrl: function(ev) {
		var k, c, m;

		if(ev.ctrlKey)
			m = '^';

		/* check keycodes first */
		for(k in D.keys) {
			if(ev.which == D.keys[k]) {
				c = '<' + k + '>';
				break;
			}
		}
		if(!c)
			c = U.tochar(ev);

		return m ? m + c : c;
	},

	setmap: function() {
		switch(D.modes.current) {
			case D.modes.Command:
				S.map = S.cmap;
				break;
			case D.modes.Insert:
				S.map = S.imap;
				break;
		}
	}
}

/* commands */
C = {
	/*
	 * Scrolling routines. They are labeled following the ATscrollR scheme:
	 *
	 *	A: axis: may be v (vertical) or h (horizontal);
	 *	T: type: may be l (line), hp (half-page) or fp (page);
	 *	scroll: the string "scroll";
	 *	R: route: may be up, down, left or right.
	 *
	 * So, the vhpscrollup routine name means vertical half-page scroll up.
	*/
	vlscrollup: function() { window.scrollBy(0, -1 * D.conf.LineScrollStep); },
	vlscrolldown: function() { window.scrollBy(0, D.conf.LineScrollStep); },
	hlscrollleft: function() { window.scrollBy(-1 * D.conf.LineScrollStep, 0); },
	hlscrollright: function() { window.scrollBy(1 * D.conf.LineScrollStep, 0); },
	vhpscrollup: function() { window.scrollBy(0, -1 * window.innerHeight / 2); },
	vhpscrolldown: function() { window.scrollBy(0, window.innerHeight / 2); },
	vfpscrollup: function() { window.scrollBy(0, -1 * window.innerHeight); },
	vfpscrolldown: function() { window.scrollBy(0, window.innerHeight); },
	scrolltop: function() { window.scrollTo(0, 0); },
	scrollbottom: function() { window.scrollTo(0, document.body.scrollHeight); },

	/* history */
	historyprev: function() { history.back(); },
	historynext: function() { history.forward(); },

	/* tabs */
	nexttab: function(unused, num) { U.send('C.selecttab', num ? num : 'next'); },
	prevtab: function(unused, num) { U.send('C.selecttab', num ? -num : 'prev'); },
	firsttab: function(unused, norep) { U.send('C.selecttab', 'first'); },
	lasttab: function(unused, norep) { U.send('C.selecttab', 'last'); },
	reload: function() { window.location.reload(); },
	reloadall: function(unused, norep) { U.send('C.reloadall'); },
	closetab: function() { U.send('C.closetab'); },
	restoretab: function() { U.send('C.restoretab'); },
	restoretabsel: function() { U.send('C.restoretab', true); },
	clonetab: function(unused, unused) { U.send('C.clonetab'); },

	/* utils */
	viewsource: function() {
		U.send('U.geturl', function(url) {
			if(url.substr(0, 12) != 'view-source:')
				window.location = 'view-source:' + url;
			else
				window.location.reload();
		});
	},
	prompt: function(ev) { B.prompt(D.reg.bar, U.tochar(ev), null, P.exec); },
	linkprev: function(unused, unused) {
		var l = U.getlink(D.conf.LinkPrevWords);

		if(l)
			window.location = l.href;
	},
	linknext: function(unused, unused) {
		var l = U.getlink(D.conf.LinkNextWords);

		if(l)
			window.location = l.href;
	},

	/*
	 * Searching routines. They're labeled following the searchW scheme:
	 *
	 *	W: where: f (forward), b (backward), n (next) and p (previous).
	 *
	 * search[fb] starts a new search while search[pn] incrementally
	 * continue the previous search.
	*/
	searchf: function(ev) {
		E.activate({
			id: D.reg.bar,
			ps: U.tochar(ev),
			callback: function(id) {
				var v = B.getelem(id).input.value;

				if(v == '') {
					if(!D.reg.search.text)
						B.hide(id);
					else {
						D.reg.search.back = false;
						C.searchn();
					}
					return;
				}

				D.reg.search.text = v;
				D.reg.search.back = false;
				D.reg.search.opts = {
					cs: true,
					back: D.reg.search.back
				};

				U.search();
			}
		});
	},
	searchb: function(ev) {
		E.activate({
			id: D.reg.bar,
			ps: U.tochar(ev),
			callback: function(id) {
				var v = B.getelem(id).input.value;

				if(v == '') {
					if(!D.reg.search.text)
						B.hide(id);
					else {
						D.reg.search.back = true;
						C.searchn();
					}
					return;
				}

				D.reg.search.text = v;
				D.reg.search.back = true;
				D.reg.search.opts = {
					cs: true,
					back: D.reg.search.back
				};

				U.search();
			}
		});
	},
	searchp: function() {
		D.reg.search.opts.back = !D.reg.search.back;
		U.search();
	},
	searchn: function() {
		D.reg.search.opts.back = D.reg.search.back;
		U.search();
	},

	gotohomecur: function() { U.send('U.goto', 'chrome://newtab', false); },
	gotohomenew: function() { U.send('U.goto', 'chrome://newtab', true); },

	gotoparent: function() { window.location = '..'; },
	gotoroot: function() { window.location = '/'; },

	linkhintscur: function() {
		D.modes.current = D.modes.Insert; /* pass digits to hints */
		H.setup(D.conf.LinkHintsChars, function(el) {
			D.modes.current = D.modes.Command;

			/* Let's focus the element and blur it if it's not an input field */
			el.focus();
			U.doclick(el);
			if(!U.isselect(el))
				el.blur();
		});
	},
	linkhintsnew: function() {
		D.modes.current = D.modes.Insert; /* pass digits to hints */
		H.setup(D.conf.LinkHintsChars, function(el) {
			D.modes.current = D.modes.Command;

			/* Let the user realize which link has been selected */
			el.focus();
			setTimeout(function() {
				U.doclick(el, true);
				if(!U.isselect(el))
					el.blur();
			}, 500);
		});
	},

	zoomin: function(unused, fact) {
		var pct;

		if(!fact)
			fact = D.conf.ZoomFact;
		pct = D.reg.zoom + fact;
		if(pct > 300)
			pct = 300; /* zoom max */
		U.setzoom(pct);
	},
	zoomout: function(unused, fact) {
		var pct;

		if(!fact)
			fact = D.conf.ZoomFact;
		pct = D.reg.zoom - fact;
		if(pct <= 0)
			pct = 1; /* zoom min */
		U.setzoom(pct);
	},
	zoomall: function() {
		U.setzoom(300);
	},
	zoomnone: function() {
		U.setzoom(D.conf.DefaultZoom);
	}
}

/* utils */
U = {
	ismodifier: function(ev) {
		switch(ev.which) {
			case D.keys.Shift:
			case D.keys.Ctrl:
			case D.keys.Alt:
				return true;
		}
		return false;
	},

	isescape: function(ev) {
		return ev.keyCode == D.keys.Esc || (ev.ctrlKey && U.tochar(ev) == '[');
	},

	tochar: function(ev) {
		var c, ukid, kid = ev.keyIdentifier;
		if(!kid)
			return;

		/* fix for webkit #19906 */
		if(D.reg.arch == 'Windows' || D.reg.arch == 'Linux' && S.keyfix[kid]) {
			c = S.keyfix[kid];
			kid = ev.shiftKey ? c[1] : c[0];
		}

		ukid = '0x' + kid.substring(2);
		c = String.fromCharCode(parseInt(ukid));
		return ev.shiftKey ? c.toUpperCase() : c.toLowerCase();
	},

	ismode: function(mode) {
		var m;

		for(m in D.modes) {
			if(mode == D.modes[m])
				return true;
		}
		return false;
	},

	iseditable: function(target) {
		var n, t;

		if(target.getAttribute('contentEditable') == 'true')
			return true;

		n = target.tagName.toLowerCase(), t = target.type ? target.type.toLowerCase() : '';
		return n == 'textarea' || (n == 'input' && (t == 'text' || t == 'search' || t == 'password'));
	},

	isdigit: function(c) {
		return !isNaN(c);
	},

	send: function() {
		var cb = null;

		if(typeof arguments[arguments.length - 1] == 'function') {
			cb = arguments[arguments.length - 1];
			delete arguments[arguments.length - 1];
		}

		chrome.extension.sendRequest(JSON.stringify(arguments), function(r) {
			if(cb)
				cb(r);
		});
	},

	search: function() {
		var s = D.reg.search;

		if(s.active || !s.text)
			return;
		D.reg.search.active = true;
		B.clear(D.reg.bar);

		/* Well, no idea why it works like this but it's needed to wait
		 * a bit in order to let Chromium update its internal state
		 * (?). If not, the text is found to the bar value (even if
		 * it's has been explicitally cleared by calling B.clear()
		 * above. Does this means that window.find() is called before
		 * Chromium updates the input value (via B.clear())? */
		setTimeout(function() {
			var found = window.find(s.text, s.opts.cs, s.opts.back, true, false, true, false);
			if(found) {
				B.hide(D.reg.bar);
				D.reg.search.active = false;
			}
			else {
				B.error(D.reg.bar, 'Match not found: ' + s.text, function(hidden) {
					D.reg.search.active = false;
					if(hidden)
						B.clear(D.reg.bar);
					else
						B.update(D.reg.bar, s.text);
				});
			}
		}, 10);
	},

	apply: function(el, style) {
		var i;

		for(i in style)
			el.style[i] = style[i];
	},

	setzoom: function(pct) {
		document.documentElement.style.zoom = pct + '%';
		D.reg.zoom = pct;
	},

	getlink: function(wlist) {
		var i, links = document.getElementsByTagName('a'), words = wlist.split(',');

		for(i = 0; i < links.length; ++i)
			if(U.wordsmatch(words, U.linktext(links[i])))
				return links[i];

		return null;
	},

	wordsmatch: function(words, txt) {
		var i;

		for(i = 0; i < words.length; ++i)
			if(txt.toLowerCase() == words[i].toLowerCase())
				return true;
		return false;
	},

	linktext: function(link) {
		var i, node;

		for(i = 0; i < link.childNodes.length; ++i)
			if((node = link.childNodes[i]) && node.innerHTML)
				return U.linktext(node);
		return link.innerHTML;
	},

	doclick: function(el, newtab) {
		var ev, nt = (typeof newtab == 'undefined' ? false : newtab);

		ev = document.createEvent('MouseEvents');
		ev.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, nt, false, false, false, 0, null);
		el.dispatchEvent(ev);
	},

	isselect: function(el) {
		var types = ['search', 'text', 'password'];

		return (el.tagName == 'INPUT' && types.indexOf(el.type) != -1) || el.tagName == 'TEXTAREA';
	}
}

/* new status bar implementation */
B = {
	/* container */
	cstyle: {
		border: '1px solid #888',
		position: 'fixed',
		zIndex: 1000,
		fontSize: '12px',
		fontFamily: 'Lucida Grande, Arial, Sans',
		backgroundColor: '#abc',

		/* bottom */
		width: '100%',
		height: '18px',
		bottom: 0,
		left: 0
	},

	/* input */
	istyle: {
		height: '100%',
		margin: 0,
		padding: 0,
		outline: 'none',
		border: 0,
		background: 'transparent',
	},

	/* prompt */
	pstyle: {
		margin: 0,
		padding: 0,
	},

	/* error */
	estyle: {
		backgroundColor: 'yellow',
		border: '1px solid red'
	},

	bars: [],

	add: function() {
		var id = B.bars.length, bar = B.newbar(id), ps = B.newps(), input = B.newinput();

		bar.appendChild(ps);
		bar.appendChild(input);

		U.apply(bar, B.cstyle);
		U.apply(input, B.istyle);
		U.apply(ps, B.pstyle);

		document.body.appendChild(bar);

		B.bars[id] = {
			bar: bar,
			input: input,
			ps: ps
		};

		return id;
	},

	prompt: function(id, ps, val, callback) {
		if(val)
			B.getelem(id).input.value = val;
		E.activate({
			id: id,
			ps: ps,
			callback: callback
		});
	},

	update: function(id, val) {
		var ret;

		if(!B.bars[id])
			return;
		ret = B.bars[id].input.value;
		B.bars[id].input.value = val;
		return ret;
	},

	newbar: function(id) {
		var bar = document.createElement('div');

		bar.style.display = 'none';

		return bar;
	},

	newps: function() {
		var ps = document.createElement('span');
		return ps;
	},

	newinput: function() {
		var input = document.createElement('input');

		input.type = 'text';
		return input;
	},

	lock: function(id) {
		if(!B.bars[id])
			return;
		B.bars[id].input.readOnly = true;
		B.bars[id].input.blur();
	},

	unlock: function(id) {
		if(!B.bars[id])
			return;
		B.bars[id].input.readOnly = false;
		B.bars[id].input.focus();
	},

	hide: function(id) {
		if(!B.bars[id])
			return;
		B.bars[id].bar.style.display = 'none';
	},

	show: function(id) {
		if(!B.bars[id])
			return;
		B.bars[id].bar.style.display = 'block';
	},

	isvisible: function(id) {
		return B.bars[id].bar.style.display != 'none';
	},

	clear: function(id) {
		var ret;

		if(!B.bars[id])
			return null;

		ret = B.bars[id].input.value;
		B.bars[id].input.value = '';
		return ret;
	},

	getelem: function(id) {
		return B.bars[id];
	},

	setps: function(id, ps) {
		var ret;

		if(!B.bars[id])
			return;
		ret = B.bars[id].ps.innerHTML;
		B.bars[id].ps.innerHTML = ps;
		return ret;
	},

	error: function(id, txt, callback) {
		var o, b = B.bars[id].bar;

		if(!B.isvisible(id))
			B.show(id);

		B.setps(id, '');
		U.apply(b, B.estyle);
		if(callback)
			o = B.update(id, txt);

		B.autohide(id, function(hidden) {
			U.apply(b, B.cstyle);
			if(callback) {
				callback(hidden);
				return;
			}
			B.update(id, o);
		});
	},

	autohide: function(id, callback) {
		var tm, cb, input = B.bars[id].input;

		B.lock(id);

		tm = setTimeout(function() {
			B.hide(id);
			input.removeEventListener('focus', cb);
			if(callback)
				callback(true);
		}, D.conf.StatusTimeout);

		cb = function() {
			clearTimeout(tm);
			input.removeEventListener('focus', cb);
			if(callback)
				callback(false);
		};

		input.addEventListener('focus', cb);
	}
}

/* inline editor */
E = {
	opts: {},
	bar: null,

	activate: function(opts) {
		E.setup(opts);
	},

	setup: function(opts) {
		if(!((E.opts = opts) && (E.bar = B.getelem(opts.id).input)))
			return;

		B.setps(opts.id, opts.ps);
		D.modes.current = D.modes.Insert; /* skip digits from keydown events */
		B.show(opts.id);
		B.unlock(opts.id);

		/* Dynamically sets the input width. This is not update if the
		 * window is resized while the prompt is show.
		 *
		 * XXX Do a real computation of the width. */
		B.getelem(opts.id).input.style.width = parseInt(
			document.documentElement.clientWidth + opts.ps.length - 8
		) + 'px';

		E.bar.addEventListener('keydown', E.run);
		E.bar.addEventListener('blur', E.exit);
	},

	cleanup: function() {
		D.modes.current = D.modes.Command;
		E.bar.removeEventListener('keydown', E.run);
		E.bar.removeEventListener('blur', E.exit);
		B.lock(E.opts.id);

		E.opts = {};
		E.bar = null;
	},

	exit: function() {
		B.hide(E.opts.id);
		E.cleanup();
	},

	/* Note: there should be a better way to do. It would be nice to be
	 * able to apply the editor to a string and change it accordingly with
	 * the given event; having it using "hardcoded" elements is not
	 * flexible nor suckless. */
	run: function(ev) {
		var i, t, ch = S.unctrl(ev);

		if(ch == '<Return>') {
			E.opts.callback(E.opts.id, E.bar.value);
			E.cleanup();
		}
		else if(ch == '<Esc>' || (ch == '<Backspace>' && !E.bar.value)) {
			B.clear(E.opts.id);
			E.exit();
		}
		else if(ch == '^h') {
			var c = E.bar.selectionStart;

			if(c) {
				E.bar.value = E.bar.value.substr(0, c - 1) + E.bar.value.substr(c);
				if(c - 1 != E.bar.value.length)
					E.bar.selectionStart = E.bar.selectionEnd = c - 1;
			}
			ev.preventDefault();
		}
		else if(ch == '^u') {
			var c = E.bar.selectionStart;

			if(c) {
				E.bar.value = E.bar.value.substr(c);
				E.bar.selectionStart = E.bar.selectionEnd = 0;
			}
			ev.preventDefault();
		}
		else if(ch == '^w') {
			i = E.bar.value.lastIndexOf(' ');
			E.bar.value = (i == -1 ? '' : E.bar.value.substr(0, i));
			ev.preventDefault();
		}
		else if(ch == '^d') {
			var c = E.bar.selectionStart;

			if(c < E.bar.value.length) {
				E.bar.value = E.bar.value.substr(0, c) + E.bar.value.substr(c + 1);
				if(c != E.bar.value.length)
					E.bar.selectionStart = E.bar.selectionEnd = c;
			}
			ev.preventDefault();
		}
		else if(ch == '^a') {
			E.bar.selectionStart = E.bar.selectionEnd = 0;
			ev.preventDefault();
		}
		else if(ch == '^e') {
			E.bar.selectionStart = E.bar.value.length;
			ev.preventDefault();
		}
	}
}
