

const getAllData = async () => {
    // const url = 'https://quanlysim.vn/api/list-vendor';
    const url = 'https://bantkg.test/api/list-vendor';

    const response = await fetch(url);

    if (!response.ok) {
        return null;
    }
    const data = await response.json();

    const status = data.success;

    const total = data.total;

    const list_data = data.data;

    return [status, total, list_data];
}


chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed, setting alarm for 5 minutes");
    chrome.alarms.create("loginExecute",
        {
            delayInMinutes: 0,
            periodInMinutes: 30
        });
});



chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "loginExecute") {
        console.log("Alarm triggered, opening tab");
        const [status, total, data] = await getAllData();
        const urls = [];
        for (let i = 0; i < data.length; i++) {
            var obj = data[i];
            var url = obj.domain;
            urls.push(url);
        }
        urls.forEach(url => {
            chrome.tabs.create({ url: url }, (tab) => {
                console.log("Opened tab, tab ID:", tab.id);
            });
        });

        // Mở tab https://www.google.com/ khi tất cả task hoàn tất
        // console.log("All tasks completed, opening Google");
        // try {
        //     await new Promise((resolve) => {
        //         chrome.tabs.create({ url: 'https://bantkg.test/api/send-message-bet' }, (tab) => {
        //             console.log("Opened Google tab, ID:", tab.id);
        //             resolve();
        //         });
        //     });
        //     console.log("Successfully opened Google tab");
        // } catch (error) {
        //     console.error("Failed to open Google tab:", error);
        // }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "closeTab" && sender.tab.id) {
        chrome.tabs.remove(sender.tab.id);
    }
});