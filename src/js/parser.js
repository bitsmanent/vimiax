/* Vimiax command line parser */

P = {
	exec: function(id, data) {
		var argv = P.parse(data), argc = argv.length;

		/*
		if(!argc) {
			B.hide(id);
			return;
		}
		*/

		B.error(id, 'Command line parser has not been implemented yet.');
	},

	parse: function(line) {
		return [];
	}
}
