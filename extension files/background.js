let gracePeriod = false;
let gracePeriodStart = null;
let gracePeriodElapsed = 0;
let currentStatus = 'ontask';

chrome.runtime.onStartup.addListener(() => {
    sendStatusToServer(currentStatus);
    chrome.alarms.clearAll();
});

chrome.runtime.onInstalled.addListener(() => {
    sendStatusToServer(currentStatus);
    chrome.alarms.clearAll();
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
                if (gracePeriodStart) {
                    gracePeriodElapsed += Date.now() - gracePeriodStart;
                    gracePeriodStart = null;
                }
                console.log('On task');
                currentStatus = newStatus;
            }
        } else {
            newStatus = 'offtask';
            if (newStatus !== currentStatus) {
                sendStatusToServer(newStatus);
                if (!gracePeriod) {
                    gracePeriod = true;
                    gracePeriodStart = Date.now();
                    chrome.alarms.create('gracePeriodAlarm', { delayInMinutes: 2 - gracePeriodElapsed / (60 * 1000) });
                    console.log('In grace period');
                    currentStatus = 'grace';
                }
            }
        }
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(`Alarm fired: ${alarm.name}`);
    if (alarm.name === 'gracePeriodAlarm') {
        gracePeriod = false;
        gracePeriodElapsed += (Date.now() - gracePeriodStart) / (60 * 1000);
        if (gracePeriodElapsed >= 2) {
            sendStatusToServer('offtask', null, true);
            console.log('Off task');
            currentStatus = 'offtask';
            gracePeriodElapsed = 0;
        } else {
            chrome.alarms.create('gracePeriodAlarm', { delayInMinutes: 2 - gracePeriodElapsed });
        }
        gracePeriodStart = Date.now();
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

    fetch('http://178.198.237.37:3000/m5-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        currentStatus = data.status;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
