(function(window) {
	var doc = window.document,
			$ = function(selector) {
				var result = doc.querySelectorAll(selector);
				return (result.length > 1) ? result : result[0];
			};

	Node.prototype.on = Node.prototype.addEventListener;
	NodeList.prototype.on = function(type, func, flag) {
		[].forEach.call(this, function(node, index) {
			node.on(type, func, flag);
		});
	};

	
}(this));