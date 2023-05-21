let gracePeriod = false;
let gracePeriodStart = null;
let currentStatus = 'ontask';

chrome.runtime.onStartup.addListener(() => {
    sendStatusToServer(currentStatus);
    chrome.alarms.clearAll(); // Clear all alarms here
});

chrome.runtime.onInstalled.addListener(() => {
    sendStatusToServer(currentStatus);
    chrome.alarms.clearAll(); // And here
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        let url = new URL(tab.url);
        let hostname = url.hostname;
        let newStatus = null;
        if (hostname === 'www.google.com' || hostname === 'www.managebac.com' || hostname === 'www.mangahigh.com' || hostname === 'www.test.com' || hostname.endsWith('.google.com')) {
            newStatus = 'ontask';
            if (newStatus !== currentStatus) {
                sendStatusToServer(newStatus);
                chrome.alarms.clear('gracePeriodAlarm');
                gracePeriod = false;
                console.log('On task');
                currentStatus = newStatus;
                chrome.alarms.clear('offTaskAlarm');
            }
        } else {
            newStatus = gracePeriod ? 'grace' : 'offtask';
            if (newStatus !== currentStatus) {
                if (!gracePeriod) {
                    gracePeriod = true;
                    gracePeriodStart = Date.now();
                    chrome.alarms.create('gracePeriodAlarm', { delayInMinutes: 2 });
                    sendStatusToServer(newStatus, gracePeriodStart);
                    console.log('In grace period');
                    currentStatus = newStatus;
                }
            }
        }
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(`Alarm fired: ${alarm.name}`);
    if (alarm.name === 'gracePeriodAlarm') {
        gracePeriod = false;
        if (currentStatus === 'grace') {
            // Add a delay before changing the status to 'offtask'
            setTimeout(() => {
                console.log('Before fetch request');
                sendStatusToServer('offtask', null, true);  // pass true for gracePeriodEnded
                console.log('After fetch request');
                console.log('Off task');
                currentStatus = 'offtask';
            }, 1000);
        }
    }
});

function sendStatusToServer(status, gracePeriodStart, gracePeriodEnded = false, gracePeriodEnd = null) {
    console.log(`sendStatusToServer called with status: ${status}`);

    let body = {
        username: 'test',
        userid: '1',
        status: status,
        gracePeriodEnded: gracePeriodEnded,
        gracePeriodEnd: gracePeriodEnd
    };

    if (status === 'grace') {
        body.gracePeriodStart = gracePeriodStart;
    }

    fetch('http://nodejs-url:3000/m5-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // update currentStatus based on the response from the server
        currentStatus = data.status;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
