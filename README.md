homeautomation with node.js
======================

How to start this application : 

Required Tools : Arduino Uno, Any Computer which can run node.js server (in this case i'm using raspberry pi), Relay Module, Internet Access

Step to run this application :

	$npm install
	$node app.js

note:

a) you should have installed node.js and npm in your computer.

b) To make this app running on the startup, follow this:

	$npm install pm2 -g
	$sudo pm2 start app.js --name homeautomation -x max
  
  voila, you have made your apps automatically start when your server is restarting.

c) I have put ngrok code in app.js, so the apps automatically go online
