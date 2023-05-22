# task-monitor
lg task monitor, but make it spicy, open source, and i think i have a mental issue at this point.

This task monitor was designed for the sole purpose of making kids' lives better, or worse, ddepending on how you define "torture"

runs on js, coded on js/html, needs node.js to run server, unless you are some crazy maniac who wants to run their server on python :=)))))))))))

the login page uses local credentials, so if you are planning on using this in a production env, please use something safer. I don't care if your credentials get stolen, just thought it would be funny to tell you! (sarcasm)

the credentials for the popup.html are also local, this is because it is just a basic html page that is needed for the extension to run, and does not have any functionality whatsoever. you may change it to something useful.

you will need mongodb or any other db server in order to store "gracePeriod", "user" and "status" values in. this is, unless you want to be an idiot and make evrything run locally. if you choose to do so, to you i say good luck and have a nice time crying at your desk.

1x 2 minute grace period every hour, you can change it to be what you want, personally i chose 2 minutes but you can choose any value betweek 1-59, unless you change it to every 2-24 hours.

# Usage Instructions 

pretty simple. you need a mongodb server, another server to run everything, and clients, oh and a bunch if time.

setting up the server
`apt install node npm && npm install express mongodb`

`node server.js`

dont forget to change and add your mongodb url and server url in the server.js file

# setting up the extension

same goes for the extension, you need to add your server url/endpoints before being able to pack the extension and install in on the clients' computers.

# working the managemen console

its pretty self explanatory. refresh strus button at the top, shows when everything was last uodated too.
the console updates every 30 seconds with the server too.
when a user is ontask, they will be in green. offtask, red. grace period, orange. grace (extended), purple. presumed off, dark gray. offline? light gray.

settings will allow you to add the exception on a user. please mot as of now, the exception is only management xonsole side, and not server side.
