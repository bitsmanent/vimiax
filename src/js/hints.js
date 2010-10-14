/* Vimiax hints */

/* Note: part of the core implementation has been adapted from Vimium. */

H = {
	data: {},
	style: {
		container: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			zIndex: '100',
		},

		hint: {
			fontSize: '11px',
			border: '1px solid #000',
			padding: '1px 2px',
			lineHeight: '100%',
			borderRadius: '2px',
			background: '#abc',
			cursor: 'pointer' /* since we handle clicks on hints */
		}
	},

	setup: function(chars, callback) {
		if(!(chars && callback))
			return;
		H.data.chars = chars;
		H.data.callback = callback;
		H.data.queue = '';
		H.build();

		if(!H.data.hints)
			return;

		document.addEventListener('keydown', H.keydown, true);
	},

	cleanup: function() {
		if(H.data.container)
			H.data.container.parentNode.removeChild(H.data.container);
		document.removeEventListener('keydown', H.keydown, true);
		H.data = {};
	},

	build: function() {
		var i, hints = H.scan(), container = document.createElement('div');

		if(!hints.length)
			return false;

		U.apply(container, H.style.container);

		for(i = 0; i < hints.length; ++i)
			container.appendChild(H.mark(hints[i]));
		document.body.appendChild(container);

		H.data.hints = hints;
		H.data.container = container;

		H.refresh();

		return true;
	},

	scan: function() {
		var elems = document.body.querySelectorAll('a, input:not([type=hidden]), textarea, select, button, *[onclick]');
		var logxb = function(x, b) { return Math.log(x) / Math.log(b); };
		var i, s, rect, hints = [], nc = Math.ceil(logxb(elems.length, H.data.chars.length));

		for(i = 0; i < elems.length; ++i) {
			if((rect = H.isvisible(elems[i]))) {
				s = H.num2str(i, nc).toUpperCase();
				hints.push({
					element: elems[i],
					rect: rect,
					mark: null, /* not yet attached */
					text: s,
				});
			}
		}

		return hints;
	},

	mark: function(hint) {
		var i, mark = document.createElement('div');
		var zf = D.reg.zoom / 100.0; /* zoom factor */

		U.apply(mark, H.style.hint);

		mark.style.position = 'absolute';
		mark.style.left = hint.rect.left + window.scrollX / zf + 'px';
		mark.style.top = hint.rect.top  + window.scrollY / zf + 'px';
		mark.innerHTML = hint.text;
		mark.addEventListener('click', function() { H.select(hint); });

		hint.mark = mark; /* attach */

		return mark;
	},

	isvisible: function(el) {
		var t, zf = D.reg.zoom / 100.0; /* zoom factor */

		t = el.getBoundingClientRect();
		if(t.bottom <= 4 || t.top * zf >= window.innerHeight - 4 ||
		   t.left < 0 || t.left * zf >= window.innerWidth - 4 ||
		   t.width < 3 || t.height < 3)
		   	return false;

		t = window.getComputedStyle(el, null);
		if(t.getPropertyValue('visibility') != 'visible' ||
		   t.getPropertyValue('display') == 'none')
		   	return false;

		if(!(t = el.getClientRects()[0]))
			return false;

		return t;
	},

	num2str: function(n, len) {
		var r = 0, s = [], c = H.data.chars, b = c.length;

		do {
			r = n % b;
			s.unshift(c[r]);
			n -= r;
			n /= Math.floor(b);
		} while(n > 0);

		/* padding */
		for(r = s.length; r < len; ++r)
			s.unshift(c[0]);

		return s.join('');
	},

	select: function(hint) {
		var cb = H.data.callback;

		H.cleanup();
		cb(hint.element);
	},

	keydown: function(ev) {
		var c;

		ev.stopPropagation();
		ev.preventDefault();

		if(U.ismodifier(ev))
			return;
		if(U.isescape(ev)) {
			H.cleanup();
			return;
		}

		/* Note: actually it's not possible to "attach" the editor
		 * here. This will be fixed in future. ATM a minimal interface
		 * is provided. */
		switch(S.unctrl(ev)) {
			case '<Backspace>':
				H.data.queue = H.data.queue.slice(0, H.data.queue.length - 1);
				break;
			default:
				H.data.queue += U.tochar(ev).toUpperCase();
				break;
		}

		H.update();
	},

	update: function() {
		var i, j, hint , m = [];

		for(i in H.data.hints) {
			hint = H.data.hints[i];
			if(hint.text.substr(0, H.data.queue.length) == H.data.queue) {
				hint.mark.style.opacity = 1;

				hint.mark.innerHTML = '';
				for(j = 0; j < H.data.queue.length; ++j)
					hint.mark.innerHTML += '<b>' + hint.text[j] + '</b>';
				hint.mark.innerHTML += hint.text.substring(j);

				m.push(hint);
			}
			else
				hint.mark.style.opacity = 0;
		}

		H.refresh();

		if(!m.length) {
			H.data.queue = H.data.queue.slice(0, H.data.queue.length - 1);
			H.update();
			return;
		}

		if(m.length == 1) {
			if(H.data.queue)
				H.select(m[0]);
			return;
		}

		return m;
	},

	/* Note: this routine shouldn't exists at all. */
	refresh: function() {
		/* Note: for some reason sites like Facebook doesn't refresh
		 * the DOM properly. This call will "force" a refresh. */
		window.scrollBy(0, 0);
	}
}
