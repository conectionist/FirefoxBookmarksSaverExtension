// When the user hits return, send the "text-entered"
// message to main.js.
// The message payload is the contents of the edit box.
var username = document.getElementById("username");
var pass = document.getElementById("password");
var btn = document.getElementById("btnLogin");
btn.addEventListener("click", myFunction);

function myFunction() {
	self.port.emit("credentials-entered", username.value, pass.value);
}