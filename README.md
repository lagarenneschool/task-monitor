# task-monitor
lg task monitor, but make it spicy, open source, and i think i have a mental issue at this point.

This task monitor was designed for the sole purpose of making kids' lives better, or worse, ddepending on how you define "torture"

runs on js, coded on js/html, needs node.js to run server, unless you are some crazy maniac who wants to run their server on python :=)))))))))))

the login page uses local credentials, so if you are planning on using this in a production env, please use something safer. I don't care if your credentials get stolen, just thought it would be funny to tell you! (sarcasm)

the credentials for the popup.html are also local, this is because it is just a basic html page that is needed for the extension to run, and does not have any functionality whatsoever. you may change it to something useful.

you will need mongodb or any other db server in order to store "gracePeriod", "user" and "status" values in. this is, unless you want to be an idiot and make evrything run locally. if you choose to do so, to you i say good luck and have a nice time crying at your desk.

1x 2 minute grace period every hour, you can change it to be what you want, personally i chose 2 minutes but you can choose any value betweek 1-59, unless you change it to every 2-24 hours.
