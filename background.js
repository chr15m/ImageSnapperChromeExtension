// Set up context menu at install time.
chrome.runtime.onInstalled.addListener(function() {
	var context = "image";
	var title = "Snap image to RSS feed";
	var id = chrome.contextMenus.create({
		"title": title,
		"contexts":[context],
		"id": "context" + context
	});
});

// load in the item template
var template = null;
$.get("item-template.xml", function(t) {
	template = "\n" + t + "\n";
}, "text");

// very simple templating function
function templateReplace(str, vals) {
	for(var k in vals) {
		str = str.replace(new RegExp('{{' + k + '}}', 'gmi'), vals[k]);
	}
	return str;
}

function getFeedXML(callback) {
	var xmlcontainer = getGarlic("feed");
	if (!xmlcontainer) {
		window.open("options.html");
	} else {
		var jxml = null;
		try {
			var jxml = $.parseXML(xmlcontainer[1]);
		} catch (e) {
			var jxml = null;
		}
		
		// console.log("jxml", jxml);
		if (!jxml) {
			// invalid xml, reset it
			// setGarlic("feed", );
			window.open("options.html");
		} else {
			callback(jxml);
		}
	}
}

// download IDs this plugin is currently listening for -> config object
var listenIds = {};

// suggest filenames for xml and images
/*chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
	if (item.byExtensionName == "Snapper" && item.byExtensionId == chrome.runtime.id) {
		console.log("determining", item);
		var suggestion = {};
		if (item.filename == "download") {
			suggestion.filename = folder + "/feed.xml";
			suggestion.conflictAction = "overwrite";
		} else {
			suggestion.filename = folder + "/" + item.filename;
		}
		console.log("suggestion", suggestion);
		suggest(suggestion);
	}	
});*/

chrome.downloads.onChanged.addListener(function(delta) {
	// check if this is one of the Ids we are listening for
	if (listenIds[delta.id]) {
		console.log("changed", delta);
		// if this delta contains a filename, update the real filename for our ID
		if (delta["filename"]) {
			listenIds[delta.id]["filename"] = delta.filename["current"].split("/").pop();
		}
		
		// if this delta contains a state change (might be finished)
		if (delta["state"]) {
			// one of our files has finished downloading
			if (delta.state["current"] == "complete") {
				console.log("templateargs", listenIds[delta.id]);
				
				getFeedXML(function(jxml) {
					console.log("jxml", jxml);
					// render the template with the download info
					var rendered = templateReplace(template, listenIds[delta.id]);
					// update the pubDate field to this latest download
					$(jxml).find("pubDate").text(listenIds[delta.id]["date"]);
					// add our new entry to the feed xml
					var items = $(jxml).find("item");
					if (items.length == 0) {
						$(jxml).find("channel").append(rendered);
					} else {
						$(items[0]).before(rendered);
					}
					
					// get the string version of the xml document
					var feedstring = (new XMLSerializer()).serializeToString(jxml);
					
					// save the feedxml back into the localStorage/options form
					setGarlic("feed", feedstring);
					
					// initiate the XML download
					chrome.downloads.download({
						"url": "data:text/xml;base64," + btoa(feedstring),
						"filename": getFolder() + "/feed.xml",
						"conflictAction": "overwrite"
					}, function(id) {
						// console.log(arguments);
						// console.log("done");
					});
				});
			}
			// file is no longer downloading, remove it from our list
			if (delta.state["current"] == "interrupted" || delta.state["current"] == "complete") {
				// remove the listen Id from the list of ones we are listening for
				delete listenIds[delta.id];
			}
		}
	} else {
		console.log("ignored:", delta);
		return true;
	}
});

// add click event
chrome.contextMenus.onClicked.addListener(
	function onClickHandler(info, tab) {
		console.log("clicked", info);
		getFeedXML(function(jxml) {
			// figure out the filename
			var filename = getFolder() + "/" + (info.srcUrl.split("/").pop()).split(/[\?\#]/)[0];
			console.log("xml", jxml);
			// start the image download
			chrome.downloads.download({
				"url": info["srcUrl"],
				"filename": filename
			}, function(did) {
				// arguments that will go into our item template
				listenIds[did] = {
					"srcUrl": info["srcUrl"],
					"pageUrl": info["pageUrl"],
					"date": (new Date()).toGMTString()
				};
				console.log("download", listenIds[did]);
			});
		});
	}
);
