

const getAllData=async()=>
    {
   const url='https://quanlysim.vn/api/list-vendor';
   
   const response = await fetch(url);
   
   if(!response.ok)
   {
    return null;
   }
  const data = await response.json();

  const status  = data.success;

  const total = data.total;

  const list_data=data.data;

  return [status,total,list_data];
    }


chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed, setting alarm for 5 minutes");
    chrome.alarms.create("loginExecute", 
    {
        delayInMinutes: 0,
        periodInMinutes: 5
    });
});



chrome.alarms.onAlarm.addListener(async(alarm) => {
    if (alarm.name === "loginExecute") {
        console.log("Alarm triggered, opening tab");
        const [status,total,data]=await getAllData();
        const urls=[];
        for(let i =0;i<data.length;i++)
            {
                var obj=data[i];
                var url=obj.domain;
                urls.push(url);
            } 
        urls.forEach(url => 
        {
            chrome.tabs.create({ url:url}, (tab) => {
                console.log("Opened tab, tab ID:", tab.id);
            });
        });
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "closeTab" && sender.tab.id) 
    {
      chrome.tabs.remove(sender.tab.id);      
    }
  });