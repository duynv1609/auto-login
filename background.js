const ENVIRONMENT = "production"; // Thay thành "production" khi deploy

const CONFIG = {
  local: {
    API_BASE_URL: "https://bantkg.test",
    LIST_VENDOR_API: "https://bantkg.test/api/list-vendor",
    SEND_MESSAGE_BET_API: "https://bantkg.test/api/send-message-bet",
    SENT_TOKEN_BET_API: "https://bantkg.test/api/token-bet-telegram",
    UPDATE_TYPE_VENDOR: "https://bantkg.test/api/update-type-vendor",
  },
  // local: {
  //     API_BASE_URL: "http://192.168.1.206:8000",
  //     LIST_VENDOR_API: "http://192.168.1.206:8000/api/list-vendor",
  //     SEND_MESSAGE_BET_API: "http://192.168.1.206:8000/api/send-message-bet",
  //     SENT_TOKEN_BET_API: "http://192.168.1.206:8000/api/token-bet-telegram",
  //     UPDATE_TYPE_VENDOR: "http://192.168.1.206:8000/api/update-type-vendor",
  // },
  production: {
    API_BASE_URL: "https://quanlysim.vn",
    LIST_VENDOR_API: "https://quanlysim.vn/api/list-vendor",
    SEND_MESSAGE_BET_API: "https://quanlysim.vn/api/send-message-bet",
    UPDATE_TYPE_VENDOR: "https://quanlysim.vn/api/update-type-vendor",
    SENT_TOKEN_BET_API: "https://quanlysim.vn/api/token-bet-telegram",
  },
};
const getAllData = async () => {
  const url = CONFIG[ENVIRONMENT].LIST_VENDOR_API;

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }
  const data = await response.json();

  const status = data.success;

  const total = data.total;

  const list_data = data.data;

  const block_domains = data.blocks;

  const count_blocks = data.count_blocks;

  return [status, total, list_data, block_domains, count_blocks];
};

// chrome.webRequest.onHeadersReceived.addListener(
//     (details) => {
//         let xSecData = null;
//         // Kiểm tra header phản hồi
//         for (const header of details.responseHeaders) {
//             if (header.name.toLowerCase() === "x-sec-data") {
//                 xSecData = header.value;
//                 console.log(`Found x-sec-data for URL ${details.url}:`, xSecData);
//                 break;
//             }
//         }
//
//         // Lưu x-sec-data vào storage nếu có
//         if (xSecData && details.tabId !== -1) {
//             chrome.storage.local.set({
//                 [`x-sec-data-${details.tabId}`]: xSecData
//             }, () => {
//                 console.log(`Stored x-sec-data for tab ${details.tabId}: ${xSecData}`);
//             });
//         }
//
//         return { responseHeaders: details.responseHeaders };
//     },
//     ["responseHeaders"]
// );

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed, setting alarm for 5 minutes");
  chrome.alarms.create("loginExecute", {
    delayInMinutes: 0,
    periodInMinutes: 45,
  });
});

// Mảng để theo dõi các tab đã mở
let openedTabs = [];
let cachedData = null;
// Khi mở tab, thêm tab ID vào mảng
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "loginExecute") {
    console.log("Alarm triggered, opening tabs");
    const [status, total, data, block, count_blocks] = await getAllData();

    if (status && data && data.length > 0) {
      cachedData = data;
      console.log("Data fetched and cached:", cachedData);
    } else {
      console.error("Failed to fetch data or no data available");
      cachedData = [];
    }

    const urls = [];
    for (let i = 0; i < data.length; i++) {
      var obj = data[i];

      var url = obj.domain;

      // Kiểm tra URL có truy cập được không
      // const isAccessible = await checkUrlAccessibility(url);
      // if (!isAccessible) {
      //     console.log(`URL not accessible: ${url}`);
      //     await reportInvalidUrl(url); // Gửi thông tin về API
      //     continue; // Bỏ qua URL không hợp lệ
      // }

      urls.push(url);
    }

    urls.forEach((url) => {
      chrome.tabs.create({ url: url }, (tab) => {
        console.log("Opened tab, tab ID:", tab.id);
        openedTabs.push(tab.id); // Thêm tab ID vào mảng
      });
    });
  }
});

// Lắng nghe sự kiện đóng tab
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Xóa tab ID khỏi mảng khi tab bị đóng
  const index = openedTabs.indexOf(tabId);
  if (index > -1) {
    openedTabs.splice(index, 1);
    console.log(
      `Tab closed, tab ID: ${tabId}. Remaining tabs: ${openedTabs.length}`
    );
  }

  // Kiểm tra nếu tất cả các tab đã đóng
  if (openedTabs.length === 0) {
    console.log("All tabs have been closed!");
    //================1.kiểm tra xem có trang nào bị block không
    console.log("BLOCK SITE!!! Alarm triggered to check block site");
    const [status, total, data, block, count_blocks] = await getAllData();

    if (status && block && count_blocks > 1) {
      cachedDataBlock = block;
      console.log("Data block fetched and cached:", cachedDataBlock);
      const urls = [];
      for (let i = 0; i < count_blocks; i++) {
        var obj = block[i];
        var url = obj.domain;
        urls.push(url);
      }

      urls.forEach((url) => {
        chrome.tabs.create({ url: url }, (tab) => {
          console.log("Opened block site tab, tab ID:", tab.id);
          openedTabs.push(tab.id); // Thêm tab ID vào mảng
        });
      });
    } else {
      // Thực hiện hành động khi tất cả các tab đã đóng
      sendCompletionApi();
    }
  }
});

// Hàm gửi API khi tất cả các tab đã đóng
async function sendCompletionApi() {
  const apiUrl = CONFIG[ENVIRONMENT].SEND_MESSAGE_BET_API;
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Failed to send completion API: ${response.status}, Response: ${text}`
      );
    } else {
      console.log("Completion API sent successfully!");
      // Hủy alarm sau khi hoàn thành
      chrome.alarms.clear("loginExecute", () => {
        console.log("Alarm loginExecute cleared!");
        chrome.alarms.create("loginExecute", {
          delayInMinutes: 45,
          periodInMinutes: 45,
        });
        console.log("Alarm loginExecute created again for 60 minutes later!");
      });
    }
  } catch (error) {
    console.error(`Error sending completion API:`, error);
  }
}

async function getAllDataWithRetry(retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const [status, total, data] = await getAllData();
      if (status && data && data.length > 0) {
        return [status, total, data];
      }
    } catch (e) {
      console.error(`getAllData attempt ${i + 1} failed:`, e);
    }
    // Đợi trước khi thử lại
    await new Promise((res) => setTimeout(res, delay));
  }
  // Nếu sau retries lần vẫn không có data, trả về mảng rỗng
  return [false, 0, []];
}

// Lắng nghe yêu cầu đóng tab từ content.js
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.action === "getData") {
    console.log("Sending cached data to content script:", cachedData);
    if (cachedData == null) {
      const [status, total, data] = await getAllDataWithRetry(5, 1500);

      if (status && data && data.length > 0) {
        cachedData = data;
        console.log("Data fetched and cached:", cachedData);
      } else {
        console.error("Failed to fetch data or no data available");
        cachedData = [];
      }
    }
    sendResponse({ data: cachedData || [] }); // Đảm bảo luôn gửi một mảng (không undefined)
  } else if (request.action === "closeTab" && sender.tab) {
    console.log("Received request to close tab:", sender.tab.id);

    console.log("Closing tabytt66:", sender.tab);

    if (sender.tab.url.includes("jun888h")) {
      console.log("Close request status:", request.status);

      if (request.status == 1) {
        console.log("Close jun88h tab");
        chrome.tabs.remove(sender.tab.id, () => {
          console.log(`Tab closed via message, tab ID: ${sender.tab.id}`);
          sendResponse({ success: true });
        });
      }
    } else if (sender.tab.url.includes("mb669i")) {
      console.log("Close request status mb669:", request.status);
      if (request.status == 1) {
        console.log("Close mb669 tab");
        chrome.tabs.remove(sender.tab.id, () => {
          console.log(`Tab closed via message, tab ID: ${sender.tab.id}`);
          sendResponse({ success: true });
        });
      }
    } else {
      chrome.tabs.remove(sender.tab.id, () => {
        console.log(`Tab closed via message, tab ID: ${sender.tab.id}`);
        sendResponse({ success: true });
      });
    }
  } else if (request.action === "refreshPage") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: refreshPage,
      });
    });
  } else {
    console.error("Unknown action received:", request.action);
    sendResponse({ success: true });
  }
  return true; // Để giữ kết nối mở cho sendResponse
});

// Hàm kiểm tra URL có truy cập được hay không
async function checkUrlAccessibility(url) {
  if (!isValidUrl(url)) {
    console.error(`Invalid URL: ${url}`);
    await reportInvalidUrl(url); // Gửi thông báo về API
    return false; // Bỏ qua URL không hợp lệ
  }

  try {
    const response = await fetch(url, { method: "HEAD" }); // Kiểm tra URL bằng HEAD
    console.log(`Checked URL: ${url}, Status: ${response.status}`);
    if (!response.ok) {
      await reportInvalidUrl(url); // Gửi thông báo về API nếu URL không truy cập được
    }
    return response.ok; // Trả về true nếu URL hợp lệ, false nếu không
  } catch (error) {
    console.error(`Error accessing URL ${url}:`, error.message);
    await reportInvalidUrl(url); // Gửi thông báo về API nếu có lỗi
    return false; // Bỏ qua URL nếu xảy ra lỗi
  }
}

function isValidUrl(url) {
  try {
    new URL(url); // Kiểm tra xem URL có hợp lệ không
    return true;
  } catch (error) {
    console.error(`Invalid URL: ${url}`);
    return false;
  }
}

// Hàm gửi thông tin về API khi URL không truy cập được
async function reportInvalidUrl(domain) {
  const apiUrl = CONFIG[ENVIRONMENT].UPDATE_TYPE_VENDOR;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
        type: 5, // Type 5: URL không truy cập được
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Failed to report invalid URL: ${response.status}, Response: ${text}`
      );
    } else {
      console.log(`Reported invalid URL for domain: ${domain}`);
    }
  } catch (error) {
    console.error(`Error reporting invalid URL for domain ${domain}:`, error);
  }
}
