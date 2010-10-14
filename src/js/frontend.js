/* Vimiax frontend */

/* globals data */
var D = {
	modes: {
		Command: 0,
		Insert: 1,
		Global: 2,

		current: 0
	},

	keys: {
		Backspace: 8,
		Return: 13,
		Shift: 16,
		Ctrl: 17,
		Alt: 18,
		Esc: 27,

		/* Arrows */
		ALeft: 37,
		AUp: 38,
		ARight: 39,
		ADown: 40
	},

	conf: {},

	/* temporary data registry */
	reg: {
		number: 0,
		arch: 'unknown',
		bar: -1,
		zoom: 100,
		search: {
			text: '',
			back: false,
			active: false,
			opts: {
				'case': true,
				'back': false
			}
		}
	}
};

function setup() {
	setarch();
	loadconf();
	prepare();
	interface();
	bindkeys();
	document.addEventListener('keydown', driver);
}

function setarch() {
	var nua = navigator.userAgent;

	if(nua.indexOf('Mac') != -1)
		nua = 'Mac';
	else if(nua.indexOf('Linux') != -1)
		nua = 'Linux';
	else
		nua = 'Windows';

	D.reg.arch = nua;
}

function prepare() {
	U.setzoom(D.conf.DefaultZoom);
	fixpage();
}

function fixpage() { }

function interface() {
	if(!D.conf.Scrollbar)
		document.documentElement.style.overflow = 'hidden';
	D.reg.bar = B.add();
}

function bindkeys() {
	/* scroll */
	S.add('k', 'vlscrollup');
	S.add('^y', 'vlscrollup');
	S.add('<AUp>', 'vlscrollup');
	S.add('j', 'vlscrolldown');
	S.add('^e', 'vlscrolldown');
	S.add('<Return>', 'vlscrolldown');
	S.add('<ADown>', 'vlscrolldown');
	S.add('h', 'hlscrollleft');
	S.add('<ALeft>', 'hlscrollleft');
	S.add('l', 'hlscrollright');
	S.add('<ARight>', 'hlscrollright');
	S.add('^u', 'vhpscrollup');
	S.add('^d', 'vhpscrolldown');
	S.add('^b', 'vfpscrollup');
	S.add('^f', 'vfpscrolldown');
	S.add('gg', 'scrolltop');
	S.add('G', 'scrollbottom');

	/* history */
	S.add('H', 'historyprev');
	S.add('L', 'historynext');

	/* tabs */
	S.add('gt', 'nexttab');
	S.add('gT', 'prevtab');
	S.add('g0', 'firsttab');
	S.add('g$', 'lasttab');
	S.add('r', 'reload');
	S.add('R', 'reloadall');
	S.add('d', 'closetab');
	S.add('D', 'clonetab');
	S.add('u', 'restoretab');
	S.add('U', 'restoretabsel');

	/* utils */
	//S.add(':', 'prompt');
	S.add('gf', 'viewsource');
	S.add('/', 'searchf');
	S.add('?', 'searchb');
	S.add('n', 'searchn');
	S.add('N', 'searchp');

	/* navigations utils */
	S.add('gh', 'gotohomecur');
	S.add('gH', 'gotohomenew');
	S.add('gu', 'gotoparent');
	S.add('gU', 'gotoroot');
	S.add('f', 'linkhintscur');
	S.add('F', 'linkhintsnew');
	S.add('[[', 'linkprev');
	S.add(']]', 'linknext');

	/* zoom */
	S.add('zi', 'zoomin');
	S.add('zo', 'zoomout');
	S.add('z$', 'zoomall');
	S.add('z0', 'zoomnone');
}

function loadconf() {
	/* XXX read configuration from ~/.vimiaxrc */
}

function driver(ev) {
	var k, m, n;

	if(U.ismodifier(ev))
		return;

	if(U.isescape(ev)) {
		if(D.modes.current != D.modes.Command) {
			if(U.iseditable(ev.target))
				ev.target.blur();
			D.modes.current = D.modes.Command;
		}
		else
			oreset();
		return;
	}

	if(D.modes.current == D.modes.Command) {
		n = U.tochar(ev);
		if(!S.cs && U.isdigit(n)) {
			D.reg.number += n;
			return;
		}
	}

	/* auto-switch mode */
	if(U.iseditable(ev.target)) {
		if(D.modes.current != D.modes.Insert)
			D.modes.current = D.modes.Insert;
	}
	else if(D.modes.current != D.modes.Command)
		D.modes.current = D.modes.Command;

	if(!(m = S.match(ev)))
		return;
	for(k in S.map)
		if(k == m)
			break;

	/*
	 * XXX This may be improved.
	 *
	 * If the callback takes two arguments (in addition to the event
	 * object), then the number is passed as argument instead of to be used
	 * to repeatly call the function. This way it's possible to allow, say,
	 * nexttab() to *switch to* the # tab instead of *skip* # tabs.
	 * Actually all the callbacks takes exactly an argument (the event);
	 * the only exception is when they takes the prefixing digits. This,
	 * though, may change in future so a better way to deal with it should
	 * be designed and implemented.
	*/
	n = parseInt(D.reg.number, 10);
	if(/^function \(\w*, \w*\)/.test(S.map[m].toString()))
		S.map[m](ev, n);
	else
		repeat(function() { S.map[m](ev) }, n);
	ev.preventDefault();
	oreset();
}

function oreset() {
	D.reg.number = 0;
	S.cs = '';
}

function repeat(f, n) {
	do {
		f();
	} while(--n > 0);
}

/* main */
U.send('U.getconf', function(r) {
	D.conf = JSON.parse(r);
	setup();
});
