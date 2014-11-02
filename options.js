$(function() {
	// default feed text that gets loaded in
	var defaultfeed = null;
	// static index.html page
	var indexhtml = null;
	
	// reject the enter key from the text boxes
	$('#downloadFolder').bind('keypress', function(e){
		if (e.keyCode == 13) {
			e.preventDefault();
		}
	});
	
	// if the storage is updated we need to update the text
	$(window).bind('storage', function (ev) {
		// make sure the text itself is being updated
		if (ev.originalEvent.key.indexOf("feed") != -1) {
			$("#feed").val(ev.originalEvent.newValue);
		}
	});
	
	// when the feed text changes, highlight in red if it's not valid
	$("#feed").on("change keyup", function() {
		var feedxml = $("#feed").val();
		try {
			$.parseXML(feedxml);
		} catch (e) {
			feedxml = null;
		}
		if (!feedxml) {
			$("#feed").css("border", "2px solid red");
		} else {
			$("#feed").css("border", "");
		}
	});
	
	// if the reset button is pressed
	$("#reset-feed").click(function(ev) {
		ev.preventDefault();
		$("#confirm-reset-feed").toggle();
	});
	$("#confirm-reset-feed").hide();
	$("#confirm-reset-feed").click(function(ev) {
		ev.preventDefault();
		$("#confirm-reset-feed").hide();
		$("#feed").val(defaultfeed).trigger("change");
	});
	
	// copy the index.html file to the folder
	$("#download-index").click(function(ev) {
		ev.preventDefault();
		console.log(chrome.downloads.download);
		chrome.downloads.download({
			"url": "data:text/html;base64," + btoa(indexhtml),
			"filename": getFolder() + "/index.html",
			"conflictAction": "overwrite"
		});
	});
	
	// once the window is loaded check if there is valid data and update to default if it's empty
	$(window).on("load", function() {
		// if there is no feed text in the box already use the loaded default
		$.get("feed.xml", function(feed) {
			defaultfeed = feed;
			var feedxml = getGarlic("feed");
			if (!feedxml) {
				$("#feed").val(feed).trigger("change");
			}
		}, "text");
		
		// load our static index.html page
		$.get("index.html", function(html) {
			indexhtml = html;
		}, "text");
		
		// catch garlic's first
		$("#feed").trigger("change");
	});
});
