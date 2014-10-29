// get one of the garlic stored options
function getGarlic(name) {
	// extract configuration options
	for (var k in localStorage) {
		if (k.indexOf("." + name) == k.length - (name.length + 1)) {
			return [k, localStorage.getItem(k)];
		}
	}
}

// set one of the garlic stored options
function setGarlic(name, value) {
	for (var k in localStorage) {
		if (k.indexOf("." + name) == k.length - (name.length + 1)) {
			localStorage.setItem(k, value);
		}
	}	
}

