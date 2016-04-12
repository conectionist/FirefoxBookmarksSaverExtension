var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var notifications = require("sdk/notifications");
var myIconURL = "./bradvault64.png";
var plsComeAgainImg = "./plsComeAgainImg.png";
var querystring = require("sdk/querystring");
var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var ss = require("sdk/simple-storage");

var serverAddr = "127.0.0.1";
var port = "80";
var serverContextPath = "bookmarks";
var bookmarkLink = "";
var theUrl = "";

var button1 = ToggleButton({
  id: "my-button",
  label: "Bookmark Saver",
  icon: {
    "16": "./bradvault32.png",
    "32": "./bradvault32.png",
    "64": "./bradvault64.png"
  },
  onChange: handleChange
});

function handleChange(state) {
  if (state.checked) {
	  if (isLoggedIn()) {
		panel.show({
		  position: button1
		});
	  }
	  else {
		  login.show({
		  position: button1
		});
	  }
  }
}

var panel = panels.Panel({
  contentURL: self.data.url("panel.html"),
  contentScriptFile: self.data.url("get-tags.js"),
  onHide: handleHide
});

var login = panels.Panel({
  contentURL: self.data.url("login.html"),
  contentScriptFile: self.data.url("perform-login.js"),
  onHide: handleHide
});

function handleHide() {
  button1.state('window', {checked: false});
}

function getCurrentUTCTimestamp() {
	//var d1 = new Date();
	//var d2 = new Date( d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes(), d1.getUTCSeconds() );
	//return Math.floor(d2.getTime()/ 1000);
	return Math.floor(new Date().getTime()/1000);
}

function isLoggedIn() {
	var {Cc, Ci} = require("chrome");
	
	var cookieManager = Cc["@mozilla.org/cookiemanager;1"]
                      .getService(Ci.nsICookieManager2);
					  
	var cookies = cookieManager.getCookiesFromHost(serverAddr);
	
	while (cookies.hasMoreElements()){
		var cookie = cookies.getNext();
		if (cookie instanceof Ci.nsICookie){
			if(cookie.name == "username") {
				console.log(cookie.expires);
				console.log(getCurrentUTCTimestamp());
				return cookie.expires > getCurrentUTCTimestamp();
			}
		}
	}
	
	return false;
}

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
panel.on("show", function() {
  panel.port.emit("show");
});

// Listen for messages called "text-entered" coming from
// the content script. The message payload is the text the user
// entered.
// In this implementation we'll just log the text to the console.
panel.port.on("text-entered", function (tagsList) {
  saveLinkOnServer(tagsList);
  panel.hide();
});

panel.port.on("logout", function () {
  logout();
  panel.hide();
});

login.port.on("credentials-entered", function (username, pass) {
  login.hide();
  console.log(username);
  //ss.storage.username = user;
  performLogin(username, pass);
});

function deleteCookie() {
	var {Cc, Ci} = require("chrome");
	
	var cookieManager = Cc["@mozilla.org/cookiemanager;1"]
                      .getService(Ci.nsICookieManager2);
					  
	var cookies = cookieManager.getCookiesFromHost(serverAddr);
	
	while (cookies.hasMoreElements()){
		var cookie = cookies.getNext();
		if (cookie instanceof Ci.nsICookie){
			if(cookie.name == "username") {
				cookieManager.remove(cookie.host, cookie.name, cookie.path, false);
			}
		}
	}
}

function logout() {
	//delete ss.storage.username;
	
	deleteCookie();
	
	notifications.notify(
	{
		title : "Bookmarks Saver",
		text: "You have been successfully logged out.\nPlease come again!",
		iconURL: plsComeAgainImg
	});
}

function saveLinkOnServer(tagsList)
{
	var Request = require("sdk/request").Request;
	
	bookmarkLink = tabs.activeTab.url;
	theUrl = "http://" + serverAddr + ":" + port + "/" + serverContextPath + "/create";
	
	var quijote = Request({
	  url: theUrl,
	  content: { link: bookmarkLink, tags: tagsList, user: 'dan', title: tabs.activeTab.title },
	  onComplete: function (response) {
		notifications.notify(
		{
			title : "Bookmarks Saver",
			text: response.text,
			iconURL: myIconURL
		});
	  }
	});

	quijote.get();
}

function loginSucceeded(response) {
	return response.status == 200;
}

function getNotificationTextFromStatusCode(status) {
	if(status == 200)
		return "Welcome!";
	else if(status == 401)
		return "Login failed";
	else
		return "Some other http status code";
}

function performLogin(user, pass) {
	var Request = require("sdk/request").Request;
	var theLoginUrl = "http://" + serverAddr + ":" + port + "/" + serverContextPath + "/auth"
	var req = Request({
	  url: theLoginUrl,
	  content: { username: user, password: pass },
	  onComplete: function (response) {
		/*if(loginSucceeded(response)) {
			console.log("login succeeded");
			//ss.storage.username = user;
		}
		*/
		notifications.notify(
		{
			title : "Bookmarks Saver",
			text: getNotificationTextFromStatusCode(response.status),
			iconURL: myIconURL
		});
	  }
	});
	
	req.post();
}	
