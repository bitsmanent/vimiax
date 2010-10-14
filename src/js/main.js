/* Vimiax core */

/* data */
var D = {
	/* configuration */
	conf: {
		LineScrollStep: 25,
		Scrollbar: true,
		StatusTimeout: 1500,
		LinkHintsChars: "abcdefghijklmnopqrstuvwxyz",
		DefaultZoom: 100,
		ZoomFact: 20,
		/* XXX &laquo; and &raquo; doesn't seems to work */
		LinkPrevWords: "[[,<,«,&laquo;,&lt;,Prev,Previous,Indietro,Precedente",
		LinkNextWords: "]],>,»,&raquo;,&gt;,Next,Avanti,Successivo",
	}
};

function setup() {
	T.scan();
	bindevs();
}

function bindevs() {
	chrome.extension.onRequest.addListener(U.recv);
	chrome.tabs.onCreated.addListener(T.create);
	chrome.tabs.onAttached.addListener(T.create);
	chrome.tabs.onUpdated.addListener(T.update);
	chrome.tabs.onMoved.addListener(T.update);
	chrome.tabs.onRemoved.addListener(T.remove);
	chrome.tabs.onDetached.addListener(T.remove);
}

setup();
