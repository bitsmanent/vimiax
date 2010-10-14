/* Vimiax classes */

/* commands */
C = {
	/*
	 * argv[0] represents the tab to be selected. This value specify if the
	 * tabs list have to be slide to the left or right depending if it's <
	 * or > of zero. The values "first", "last", "prev" and "next" are also
	 * allowed and works as expected.
	 *
	 * XXX: I wrote this routine quite quickly so it's likely it contains
	 * bugs. It'll be improved as soon as possible.
	*/
	selecttab: function(argc, argv) {
		var to = argv[0];
		chrome.tabs.getAllInWindow(null, function(tabs) {
			var n, sel, last = tabs.length - 1;

			for(n = 0; n < tabs.length; ++n)
				if(tabs[n].selected)
					break;
			sel = n;
			if(to == 'next')
				n = (sel == last ? 0 : sel + 1);
			else if(to == 'prev')
				n = (!sel ? last : sel - 1);
			else if(to == 'first')
				n = 0;
			else if(to == 'last')
				n = last;
			else {
				if(to > 0) {
					if((n = to - 1) > last)
						return;
				}
				else {
					if(-to > last)
						return;
					n = sel + to;
					if(n < 0) {
						to = -to - sel;
						n = last - to + 1;
					}
				}
			}

			chrome.tabs.update(tabs[n].id, {selected: true});
		});
	},

	reloadall: function() {
		chrome.tabs.getAllInWindow(null, function(tabs) {
			var i;

			for(i in tabs)
				chrome.tabs.update(tabs[i].id, {url: tabs[i].url});
		});
	},

	closetab: function() {
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.remove(tab.id);
		});
	},

	restoretab: function(argc, argv) {
		T.restore(argv[0] ? true : false);
	},

	clonetab: function() {
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.create({
				url: tab.url,
				index: tab.index + 1
			}, null);
		});
	}
}

/* utils */
U = {
	length: function(obj) {
		var k, size = 0;

		for(k in obj)
			++size;
		return size;
	},

	getconf: function() { return D.conf; },

	geturl: function(unused, unused2, reply) {
		chrome.tabs.getSelected(null, function(tab) {
			reply(tab.url);
		});
	},

	goto: function(argc, argv) {
		var url = argv[0] ? argv[0] : '', newtab = argv[1] ? true : false;

		if(!url)
			return;

		if(newtab)
			chrome.tabs.create({url: url, selected: true});
		else
			chrome.tabs.getSelected(null, function(tab) {
				chrome.tabs.update(tab.id, {url: url});
			});
	},

	recv: function(req, from, reply) {
		var i, cb, ret, argv = [], r = JSON.parse(req);

		if(!r[0]) {
			reply({0: false});
			return;
		}

		cb = eval(r[0]);

		for(i = 1; r[i]; ++i)
			argv[i - 1] = r[i];

		/*
		 * XXX This may be improved.
		 *
		 * This is the same tecnique as frontend.js.
		 * If the callback takes three arguments (argc, argv and reply)
		 * then don't send the response to the caller; let the routine
		 * do it itself instead. This way it's much easy to implements
		 * functions like U.geturl().
		*/
		if(/^function \(\w*, \w*\, \w*\)/.test(cb))
			cb(argv.length, argv, reply);
		else {
			ret = cb(argv.length, argv);
			reply(JSON.stringify(ret));
		}
	},
}

/* tabs */
T = {
	tabs: [],
	closed: [],

	/* Scan for open tabs. It's needed in order to restore closed tabs
	 * which has been opened before the extension was loaded. This routine
	 * should also injects the needed code into the pages in order to
	 * handle pages opened before the extension has been loaded; it's not
	 * so easy as it seems. */
	scan: function() {
		chrome.tabs.getAllInWindow(null, function(tabs) {
			var i;
			
			for(i in tabs)
				T.create(tabs[i]);
		});
	},

	/* Note: this routine refresh the whole tabs list. It would be nice to
	 * get the last (re)moved/created tab in order to update the relevant
	 * tabs range only. */
	refresh: function() {
		chrome.tabs.getAllInWindow(null, function(tabs) {
			var i, id;

			for(i in tabs) {
				var id = tabs[i].id;
				if(T.tabs[id])
					T.tabs[id].index = tabs[i].index;
			}
		});
	},

	create: function(tab) {
		T.tabs[tab.id] = {
			url: tab.url,
			index: tab.index,
			selected: false
		};
		T.refresh();
	},

	update: function(id, info, isupdate) {
		/* onMoved */
		if(!isupdate) {
			T.tabs[id].index = info.toIndex;
			T.refresh();
			return;
		}

		if(info.url && T.tabs[id].url != info.url)
			T.tabs[id].url = info.url;
	},

	remove: function(id, isdetached) {
		if(!T.tabs[id])
			return;
		if(!isdetached)
			T.closed.push(T.tabs[id]);
		delete T.tabs[id];
		T.refresh();
	},

	restore: function(sel) {
		var t = T.closed.pop();
		if(!t)
			return;
		t.selected = sel;
		chrome.tabs.create(t);
	}
}
