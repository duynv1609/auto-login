chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed, setting alarm for 5 minutes");
    chrome.alarms.create("autoLogin", {
        delayInMinutes: 0,
        periodInMinutes: 5
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "autoLogin") {
        console.log("Alarm triggered, opening tab");
        chrome.tabs.create({ url: "https://789be89.com/Deposit" }, (tab) => {
            console.log("Opened tab for 789be89.com, tab ID:", tab.id);
        });
    }
});