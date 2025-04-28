chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed, setting alarm for 45 minutes");
    chrome.alarms.create("autoLogin", {
      delayInMinutes: 0, // Chạy sau 45 phút
      periodInMinutes: 5 // Lặp lại mỗi 45 phút
    });
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "autoLogin") {
    //   console.log("Alarm triggered, opening tabs");
    //   // Mở tab jun8.kim
    //   chrome.tabs.create({ url: "https://www.jun8.kim/vi-vn/login" }, (tab) => {
    //     console.log("Opened tab for jun8.kim, tab ID:", tab.id);
    //   });
  
      // Mở tab 789be89.com
      chrome.tabs.create({ url: "https://789be89.com/Deposit" }, (tab) => {
        console.log("Opened tab for 789be89.com, tab ID:", tab.id);
      });
    }
  });