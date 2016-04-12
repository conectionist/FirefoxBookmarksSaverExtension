// When the user hits return, send the "text-entered"
// message to main.js.
// The message payload is the contents of the edit box.
var textArea = document.getElementById("edit-box");
var btn = document.getElementById("btn");
btn.addEventListener("click", myFunction);

var btnLogout = document.getElementById("btnLogout");
btnLogout.addEventListener("click", logout);

function myFunction() {
	var lines = textArea.value.replace(/\r\n/g,"\n").split("\n");
	
	textArea.value = '';
	
	var line = lines[0];
	for (var i = 1 ; i < lines.length ; i++)
		line += "," + lines[i];
	
	self.port.emit("text-entered", line);
}

function logout() {
	self.port.emit("logout");
}