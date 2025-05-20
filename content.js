const ENVIRONMENT = "local"; // Thay thành "production" khi deploy

const CONFIG = {
    local: {
        API_BASE_URL: "http://192.168.1.206:8000",
        LIST_VENDOR_API: "http://192.168.1.206:8000/api/list-vendor",
        SEND_MESSAGE_BET_API: "http://192.168.1.206:8000/api/send-message-bet",
        SENT_TOKEN_BET_API: "http://192.168.1.206:8000/api/token-bet-telegram",
        UPDATE_TYPE_VENDOR: "http://192.168.1.206:8000/api/update-type-vendor",
    },
    production: {
        API_BASE_URL: "https://quanlysim.vn",
        LIST_VENDOR_API: "https://quanlysim.vn/api/list-vendor",
        SEND_MESSAGE_BET_API: "https://quanlysim.vn/api/send-message-bet",
        UPDATE_TYPE_VENDOR: "https://quanlysim.vn/api/update-type-vendor",
        SENT_TOKEN_BET_API: "https://quanlysim.vn/api/token-bet-telegram",
    }
};
console.log("Content script loaded");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getAuthToken() {
    const patCookie = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('_pat='));
    if (!patCookie) {
        const newAuthToken = localStorage.getItem("token") || "";
        return newAuthToken.replace(/"/g, "");
    }
    return patCookie.split('=')[1];
}


const getAllData = async () => {
    // const url = 'https://bantkg.test/api/list-vendor';
    const url = CONFIG[ENVIRONMENT].LIST_VENDOR_API;


    const response = await fetch(url);

    if (!response.ok) {
        chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
            console.log("Request to close tab sent to background script.");
        });
        return false; // Thoát hàm nếu đã gửi token
    }
    const data = await response.json();

    const status = data.success;

    const total = data.total;

    const list_data = data.data;

    return [status, total, list_data];
}

// Hàm mô phỏng nhập dữ liệu
function simulateInput(element, value) {
    if (element) {
        element.focus();
        console.log("Focused on input:", element.id || element.placeholder, "with value:", value);
        element.value = value;
        const inputEvent = new Event('input', {bubbles: true});
        element.dispatchEvent(inputEvent);
        console.log("Simulated input for:", element.id || element.placeholder, "with value:", value);
        element.blur();
    } else {
        console.log("Element not found for simulation");
    }
}

// Hàm giải mã CAPTCHA
async function solveCaptcha(base64Src) {
    // try {
    //     const worker = await Tesseract.createWorker('eng');
    //     await worker.setParameters({ tessedit_char_whitelist: '0123456789' });
    //     const { data: { text } } = await worker.recognize(imageElement);
    //     await worker.terminate();
    //     console.log("CAPTCHA text:", text);
    //     return text.trim();
    // } catch (error) {
    //     console.error("CAPTCHA solving failed:", error);
    //     return null;
    // }
    try {
        // Loại bỏ prefix data:image
        base64Src = base64Src.split(",")[1]; // Lấy phần base64 sau dấu phẩy
        console.log("Base64 source:", base64Src);
        // Gửi yêu cầu tới Google Cloud Vision API
        const apiKey = "AIzaSyDSKgzTCOFeDBpBpRLC1-L9PJvbbgdLxGE"; // Thay bằng API key thực tế của bạn
        const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                requests: [
                    {
                        image: {
                            content: base64Src
                        },
                        features: [
                            {
                                type: "TEXT_DETECTION"
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            console.error("Google Vision API request failed:", response.status, response.statusText);
            chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
                console.log("Request to close tab sent to background script.");
            });
            return false; // Thoát hàm nếu đã gửi token
        }

        const data = await response.json();
        console.log("Google Vision API response:", data);

        // Kiểm tra phản hồi
        if (
            data.responses &&
            data.responses[0] &&
            data.responses[0].textAnnotations &&
            data.responses[0].textAnnotations[0] &&
            data.responses[0].textAnnotations[0].description
        ) {
            const captchaText = data.responses[0].textAnnotations[0].description.trim();
            console.log("CAPTCHA text:", captchaText);
            return captchaText.trim();
        } else {
            chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
                console.log("Request to close tab sent to background script.");
            });
            return false; // Thoát hàm nếu đã gửi token
        }
    } catch (error) {
        chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
            console.log("Request to close tab sent to background script.");
        });
        return false; // Thoát hàm nếu đã gửi token
    }
}

// Hàm gửi authToken tới API
async function sendAuthTokenToApi(betDomain, betToken) {
    let apiUrlSentToken = CONFIG[ENVIRONMENT].SENT_TOKEN_BET_API;
    console.log(CONFIG[ENVIRONMENT].SENT_TOKEN_BET_API);
    console.log(betDomain);
    console.log(betToken);
    console.log("DCMM");
    await sleep(3000);
    try {
        const response = await fetch(apiUrlSentToken, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                betDomain: betDomain,
                betToken: betToken
            })
        });
        if (!response.ok) {
            const text = await response.text();
            console.error(`Failed to send auth token to API: ${response.status}, Response: ${text}`);
            await sleep(5000);
            return false;
        }
        // Kiểm tra Content-Type để đảm bảo là JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`API returned non-JSON response: ${text}`);
            await sleep(5000);
            return false;
        }
        const result = await response.json();
        console.log("API response:", result);
        await sleep(5000);
        return true;
    } catch (error) {
        console.error("Error sending auth token to API:", error);
        await sleep(5000);
        return false;
    }
}

async function getTekcorePosition(nameCheck) {
    const container = document.querySelector('div.standard-form-field.standard-deposit-select-option-full.undefined');
    if (!container) {
        console.log('Container not found');
        return -1;
    }

    const bankContainers = container.querySelectorAll('div.standard-bank-container.container-show-with-bank-image-and-text');
    let position = -1;

    Array.from(bankContainers).forEach((bank, index) => {
        const label = bank.querySelector('span.standard-radio-content-label');
        if (label && label.textContent.trim() === nameCheck) {
            position = index + 1; // Vị trí bắt đầu từ 1
        }
    });

    console.log(`Thẻ Cào TEKCORE is at position: ${position}`);
    return position;
}

async function loginJUN88CMD(currentUrl, nameCheck) {
    let btnNapTien = document.querySelector('a.deposit-btn.css-xgccq');
    await sleep(3000);
    if (btnNapTien) {
        btnNapTien.click();
        console.log("Clicked button deposit");
        await sleep(5000);
        const imageCMDTheCao = document.querySelector('img[src="/public/html/default_whitelabel/shared-image/settings/v4/mobilecard.svg"]');
        if (imageCMDTheCao) {
            imageCMDTheCao.click();
            console.log("OK NHA");
            // Gọi trong autoLogin, ví dụ sau clickMobileCardImage
            console.log(nameCheck);
            await sleep(3000);
            const tekcorePosition = await getTekcorePosition(nameCheck);
            console.log(tekcorePosition);
            if (tekcorePosition === -1) {
                console.warn('Thẻ Cào TEKCORE not found in list');
            }
            console.log("VI TRI CMD: ", tekcorePosition);
            const apiSuccess = await sendAuthTokenToApi(currentUrl, tekcorePosition);
            if (apiSuccess) {
                console.log("Successfully sent auth token to API");
                return true;
            } else {
                console.log("Failed to send auth token to API");
                return false;
            }
        }
    } else {
        console.log("Button deposit not found");
        return true;
    }
}

function simulateEnterKeypress(target) {
  const enterEvent = new KeyboardEvent("keydown", {
    cancelable: true,
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13
  });
  target.dispatchEvent(enterEvent);
  console.log("Simulated Enter keypress");
}

// Trong content.js
async function autoLogin(obj) {
    const currentUrl = obj.domain;
    const nameSite = obj.name_site;
    const userName = obj.username;
    const passWord = obj.password;
    const siteNote = obj.note;
    const nameCheck = obj.name_check;

    let newAuthToken = "";
    let newAuthTokenCMD = "";
    newAuthTokenCMD = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('t='));
    await sleep(3000);
    console.log("newAuthTokenCMD CMD: ", newAuthTokenCMD);
    if (nameSite === "CMD" && newAuthTokenCMD !== undefined) {
        const resultJUN88CMD = await loginJUN88CMD(currentUrl, nameCheck);
        console.log("RESULT JUN88CMD: ", resultJUN88CMD);
        await sleep(4000);
        // Đóng tab sau khi gửi API
        console.log("Sent token request success : ", currentUrl);
        chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
            console.log("Request to close tab sent to background script.");
        });
        await sleep(5000);
        return true; // Thoát hàm nếu đã gửi token
    }
    const authToken = getAuthToken();
    await sleep(4000);
    if (authToken != null && authToken !== "") {
        console.log("Auth token found:", authToken);
        // Gửi authToken tới API
        const apiSuccess = await sendAuthTokenToApi(currentUrl, authToken);
        if (apiSuccess) {
            console.log("Successfully sent auth token to API");
        } else {
            console.log("Failed to send auth token to API");
        }
        await sleep(4000);
        // Đóng tab sau khi gửi API
        console.log("Sent token request success : ", currentUrl);
        chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
            console.log("Request to close tab sent to background script.");
        });
        return true; // Thoát hàm nếu đã gửi token
    }
    await sleep(2000);

    console.log("Content script running on:", currentUrl);

    // if (nameSite == "789BET12" || nameSite == "SH232") {
    // alert("Cái ĐCMMMM    " + currentUrl);
    console.log("Processing deposit page " + nameSite);
    await sleep(2000);

    let close_second_button = null;

    try {
        close_second_button = document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
    } catch (error) {
        console.log("Error finding button:", error);
    }

    if (close_second_button != null) {
        console.log("Button found, clicking it now!");
        close_second_button.click();
    }

    let closeButton = null;
    try {
        closeButton = document.querySelector('div.close') ||
            document.querySelector('i.mps-close') ||
            document.querySelector('div.standard-modal-close') ||
            document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
        if (closeButton) {
            closeButton.click();
            console.log("Clicked close button (div.close, i.mps-close, or btn-link)");
        } else {
            console.log("Close button not found");
        }
    } catch (error) {
        console.log("Error finding close button:", error);
    }

    await sleep(2000);

    const spanButton = document.querySelector('span[ng-click="$ctrl.ok()"][translate="Common_Closed"].ng-scope');

    if (spanButton) {
        spanButton.click();
        console.log("Clicked span with class ng-scope");
    }
    // alert(siteNote);

    await sleep(2000);
  if (nameSite === "CMD" && newAuthTokenCMD == undefined) {
        let closeButtonCMD = null;
        try {
            closeButtonCMD = document.querySelector('div.close') ||
                document.querySelector('i.mps-close') ||
                document.querySelector('div.standard-modal-close') ||
                document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
            if (closeButtonCMD) {
                closeButtonCMD.click();
                console.log("Clicked close button (div.close, i.mps-close, or btn-link)");
            } else {
                console.log("Close button not found");
            }
        } catch (error) {
            console.log("Error finding close button:", error);
        }
        console.log(nameSite);
        let modalLoginFormBtnCMD = null;
        let attemptsModalCMD = 0;
        while (!modalLoginFormBtnCMD && attemptsModalCMD < 3) {
            await sleep(5000);
            modalLoginFormBtnCMD = document.querySelector('div.header-btn.login') ||
                document.querySelector('button.btnLogin');
            attemptsModalCMD++;
            console.log(`Attempt ${attemptsModalCMD}: Login button ${modalLoginFormBtnCMD ? 'found' : 'not found'}`);
        }
        if (modalLoginFormBtnCMD) {
            await sleep(3000);
            modalLoginFormBtnCMD.click();
            console.log("Clicked login button with class ng-scope");
        }
        console.log("Waited 3 seconds before filling inputs");

        let accountInputCMD = null;
        let passwordInputCMD = null;
        var attemptsInputCMD = 0;
        while ((!accountInputCMD || !passwordInputCMD) && attemptsInputCMD < 5) {
            await sleep(1000);
            accountInputCMD = document.querySelector('input#login');
            passwordInputCMD = document.querySelector('input#password');
            attemptsInputCMD++;
            console.log(attemptsInputCMD);
            console.log(`Attempt ${attemptsInputCMD}: Account input ${accountInputCMD ? 'found' : 'not found'}, Password input ${passwordInputCMD ? 'found' : 'not found'}`);
            if (attemptsInputCMD > 3) {
                await sleep(15000)
                console.log("Attempts reached 3, reloading the page to recheck.");
                location.reload();
                return; // Exit the function to prevent further execution after reload
            }
        }
        console.log(attemptsInputCMD);
        if (accountInputCMD) simulateInput(accountInputCMD, userName);
        if (passwordInputCMD) simulateInput(passwordInputCMD, passWord); // Thay 'xyz' bằng mật khẩu thực tế
        console.log("CLMM CMD")
        await sleep(2000);
        passwordInputCMD.focus();
        //simulateEnterKeypress(passwordInputCMD);


        // Nhấp vào nút ĐĂNG NHẬP
        // await sleep(2000);
        console.log("Waited 2 seconds before clicking login span");

        let loginSpan = null;
        let attemptsLoginBtn = 0;
        while (!loginSpan && attemptsLoginBtn < 5) {
            await sleep(100);
            loginSpan = document.querySelector('button.header-btn');
            attemptsLoginBtn++;
            console.log(`Attempt ${attemptsLoginBtn}: Login span ${loginSpan ? 'found' : 'not found'}`);
        }
        console.log("Clicked login so lan", attemptsLoginBtn);
        if (attemptsLoginBtn === 4) 
        {
            console.log("Clicked login so lan", attemptsLoginBtn);
            chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
                console.log("Request to close tab sent to background script.");
            });
            return true;
        }
        console.log(currentUrl+"/vi-vn/myaccount/deposit");
        console.log("Clicked login loginSpan");
        if (loginSpan) 
        {
            //return;
            //await sleep(5000);
        await sleep(5000);
        
        const clickEvent = new MouseEvent("click", 
    {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100
    });

    loginSpan.dispatchEvent(clickEvent);

    await sleep(8000);
            // console.log("Clicked login loginSpan");
            // return;
        }
        //window.location.href = currentUrl+"/vi-vn/myaccount/deposit";
        await sleep(5000);        
        let btnNapTien = document.querySelector('a.deposit-btn.css-xgccq');
        await sleep(3000);
        if (btnNapTien!=null) 
        {
            btnNapTien.click();
            console.log("Clicked button deposit");
            await sleep(5000);
        }
         else 
         {
            console.log("Button deposit not found");
            
            location.reload();
            // chrome.runtime.sendMessage({ action: "refreshPage" });
            // Đóng tab sau khi gửi API
            await sleep(400000);
            console.log("Sent token request success : ", currentUrl);
            chrome.runtime.sendMessage({action: "closeTab",status:1}, (response) => {
                console.log("Request to close tab sent to background script.");
            });
            return true; // Thoát hàm nếu đã gửi token
        }    

            const count_img_div=0;
            const imageCMDTheCao = document.querySelector('img[src="/public/html/default_whitelabel/shared-image/settings/v4/mobilecard.svg"]');
            while(imageCMDTheCao==null && count_img_div<4)
            {
                count_img_div+=1;
                
                imageCMDTheCao = document.querySelector('img[src="/public/html/default_whitelabel/shared-image/settings/v4/mobilecard.svg"]');            
            }
                        
            if (imageCMDTheCao) 
            {
                imageCMDTheCao.click();
                
                console.log("OK NHA");
                // Gọi trong autoLogin, ví dụ sau clickMobileCardImage
                console.log(nameCheck);
                await sleep(3000);
                
                const tekcorePosition = await getTekcorePosition(nameCheck);
                
                console.log(tekcorePosition);
                
                if (tekcorePosition === -1) {
                    console.warn('Thẻ Cào TEKCORE not found in list');
                }
                console.log("VI TRI CMD: ", tekcorePosition);
                const apiSuccess = await sendAuthTokenToApi(currentUrl, tekcorePosition);
                if (apiSuccess) {
                    console.log("Successfully sent auth token to API");
                    // Đóng tab sau khi gửi API
                    console.log("Sent token request success : ", currentUrl);
                    chrome.runtime.sendMessage({action: "closeTab",status:1}, (response) => 
                    {
                        console.log("Request to close tab sent to background script.");
                    });
                    return true; // Thoát hàm nếu đã gửi token
                }                
            else 
                {
                    console.log("Failed to send auth token to API");
                    return false;
                }
            }
            else
            {  console.log("Image Div not found");
                location.reload();
            }
        
        await sleep(4000);
    }

    if (nameSite === "78WIN" || nameSite === "JUN88") {
        let closeButton = null;
        try {
            closeButton = document.querySelector('div.close') ||
                document.querySelector('i.mps-close') ||
                document.querySelector('div.standard-modal-close') ||
                document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
            if (closeButton) {
                closeButton.click();
                console.log("Clicked close button (div.close, i.mps-close, or btn-link)");
            } else {
                console.log("Close button not found");
            }
        } catch (error) {
            console.log("Error finding close button:", error);
        }
        console.log(nameSite);
        let modalLoginFormBtn = null;
        let attemptsModal = 0;
        while (!modalLoginFormBtn && attemptsModal < 3) {
            await sleep(5000);
            modalLoginFormBtn = document.querySelector('div.header-btn.login') ||
                document.querySelector('button.btnLogin') ||
                document.querySelector('a.btn-big.login');
            attemptsModal++;
            console.log(`Attempt ${attemptsModal}: Login button ${modalLoginFormBtn ? 'found' : 'not found'}`);
        }
        if (modalLoginFormBtn) {
            await sleep(3000);
            modalLoginFormBtn.click();
            console.log("Clicked login button with class ng-scope");
        }

        await sleep(3000);
        console.log("Waited 3 seconds before filling inputs");

        let accountInput = null;
        let passwordInput = null;
        var attemptsInput = 0;
        while ((!accountInput || !passwordInput) && attemptsInput < 5) {
            await sleep(1000);
            accountInput = document.querySelector('input#login');
            passwordInput = document.querySelector('input#password');
            attemptsInput++;
            console.log(attemptsInput);
            console.log(`Attempt ${attemptsInput}: Account input ${accountInput ? 'found' : 'not found'}, Password input ${passwordInput ? 'found' : 'not found'}`);
            if (attemptsInput > 3) {
                await sleep(15000)
                console.log("Attempts reached 3, reloading the page to recheck.");
                location.reload();
                return; // Exit the function to prevent further execution after reload
            }
        }
        console.log(attemptsInput);
        if (accountInput) simulateInput(accountInput, userName);
        if (passwordInput) simulateInput(passwordInput, passWord); // Thay 'xyz' bằng mật khẩu thực tế
        console.log("CLMMM")
        await sleep(4000);

        // Nhấp vào nút ĐĂNG NHẬP
        // await sleep(2000);
        console.log("Waited 2 seconds before clicking login span");

        let loginSpan = null;
        let attemptsLoginBtn = 0;
        while (!loginSpan && attemptsLoginBtn < 5) {
            await sleep(4000);
            loginSpan = document.querySelector('button.nrc-button') || document.querySelector('button.header-btn');
            attemptsLoginBtn++;
            console.log(`Attempt ${attemptsLoginBtn}: Login span ${loginSpan ? 'found' : 'not found'}`);
        }
        if (attemptsLoginBtn === 4) {
            chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
                console.log("Request to close tab sent to background script.");
            });
            return true;
        }
        console.log("Clicked login loginSpan");
        if (loginSpan) {
            await sleep(10000);
            loginSpan.click();
            console.log("Clicked login loginSpan");
        }
        await sleep(3000);
        newAuthToken = localStorage.getItem("token") || "";
        newAuthToken = newAuthToken.replace(/"/g, "");
        console.log(newAuthToken);
        await sleep(5000);
    } else {
        let loginButtonToOpenForm789BET = null;
        let attempts = 0;
        while (!loginButtonToOpenForm789BET && attempts < 3) {
            await sleep(1000);
            loginButtonToOpenForm789BET = document.querySelector('button[ng-click="$ctrl.openLoginModal()"]');
            attempts++;
            console.log(`Attempt ${attempts}: Login button ${loginButtonToOpenForm789BET ? 'found' : 'not found'}`);
        }
        if (loginButtonToOpenForm789BET) {
            loginButtonToOpenForm789BET.click();
            console.log("Clicked login button with class ng-scope");
        }

        await sleep(2000);
        console.log("Waited 3 seconds before filling inputs");

        let accountInput = null;
        let passwordInput = null;
        attempts = 0;
        while ((!accountInput || !passwordInput) && attempts < 5) {
            await sleep(1000);
            accountInput = document.querySelector('input[ng-model="$ctrl.user.account.value"]');
            passwordInput = document.querySelector('input[ng-model="$ctrl.user.password.value"]');
            attempts++;
            console.log(`Attempt ${attempts}: Account input ${accountInput ? 'found' : 'not found'}, Password input ${passwordInput ? 'found' : 'not found'}`);
        }
        if (accountInput) simulateInput(accountInput, userName);
        if (passwordInput) simulateInput(passwordInput, passWord); // Thay 'xyz' bằng mật khẩu thực tế

        await sleep(1000);
        // alert("da dien xong thong tin tai khoan va mat khau tai trang:   " + currentUrl);
        // await sleep(10000000);


        let captchaInput = null;
        attempts = 0;
        while (!captchaInput && attempts < 3) {
            await sleep(1000);
            captchaInput = document.querySelector('.ng-pristine');
            attempts++;
            console.log(`Attempt ${attempts}: CAPTCHA input ${captchaInput ? 'found' : 'not found'}`);
            await sleep(2000);
        }
        console.log("Captcha input found:", captchaInput);
        if (captchaInput) {
            let captchaImage = null;
            await sleep(2000);
            captchaInput.dispatchEvent(new Event('mousedown', {bubbles: true}));
            captchaInput.dispatchEvent(new FocusEvent('focus', {bubbles: true}));
            captchaInput.focus();
            await sleep(2000);
            console.log("Clicked CAPTCHA image to refresh");
            captchaImage = document.querySelector('img[ng-class="$ctrl.styles.captcha"][ng-click="$ctrl.refreshCaptcha()"]');
            const base64Src = captchaImage ? (captchaImage.getAttribute('ng-src') || captchaImage.getAttribute('src')) : null;
            console.log(base64Src, captchaImage);
            await sleep(2000);
            if (!base64Src) {
                location.reload();
            }
            await sleep(2000);
            if (base64Src && base64Src.startsWith('data:image/')) {
                const captchaText = await solveCaptcha(base64Src);
                // await sleep(200000000); //TEST
                // const captchaText = '45455';
                // console.log("CAPTCHA TEXT la:", captchaText);

                if (captchaText) {
                    console.log("STEP 1");
                    simulateInput(captchaInput, captchaText);
                    console.log("Filled CAPTCHA input with value:", captchaText);

                    // Nhấp vào nút ĐĂNG NHẬP
                    await sleep(2000);
                    console.log("Waited 2 seconds before clicking login span");

                    let loginSpan = null;
                    let attemptsLoginSpan = 0;
                    while (!loginSpan && attemptsLoginSpan < 5) {
                        await sleep(1000);
                        loginSpan = document.querySelector('span[ng-if="!$ctrl.loginPending"][translate="Shared_Login"].ng-scope');
                        attemptsLoginSpan++;
                        console.log(`Attempt ${attemptsLoginSpan}: Login span ${loginSpan ? 'found' : 'not found'}`);
                    }

                    if (loginSpan) {
                        console.log("STEP 2");
                        localStorage.setItem(siteNote, true);
                        loginSpan.click();

                        console.log("Clicked login span with class ng-scope");

                        // Kiểm tra thông báo lỗi
                        await sleep(2000);
                        console.log("Checking for error message");
                        console.log("STEP 3");
                        await sleep(2000);
                        let errorDiv = null;
                        let attemptsDivFoundModalErr = 0;
                        while (!errorDiv && attemptsDivFoundModalErr < 3) {
                            await sleep(1000);
                            errorDiv = document.querySelector('div[bind-html-compile="$ctrl.content"]');
                            // if (accountInput) simulateInput(accountInput, "pinkman00789");
                            // if (passwordInput) simulateInput(passwordInput, "Qj6g7FVYGEW"); // Thay 'xyz' bằng mật khẩu thực tế
                            attemptsDivFoundModalErr++;
                            console.log(`Attempt ${attemptsDivFoundModalErr}: Error div ${errorDiv ? 'found' : 'not found'}`);
                            console.log("STEP 5");
                        }

                        if (errorDiv) {
                            console.log(errorDiv.textContent.trim());
                            var textErr = errorDiv.textContent.trim();
                            // "Lỗi mã xác minh hoặc lỗi đầu vào, vui lòng quay lại";
                            if (textErr == "Tài khoản này đang bị vô hiệu hóa, vui lòng liên hệ với bộ phận chăm sóc khách hàng") {
                                chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
                                    console.log("Request to close tab sent to background script.");
                                });
                                return true;
                            }
                            return false;
                        }
                    }
                } else {
                    console.log("Failed to solve CAPTCHA");
                    return false;
                }
            } else {
                console.log("Invalid or missing base64 src for CAPTCHA image");
                return false;
            }

        } else {
            console.log("CAPTCHA input not found after 15 attempts");
            return false;
        }
        newAuthToken = getAuthToken();
    }

    // }
    console.log(newAuthToken);
    console.log("Waiting 4 seconds before checking for new auth token");
    await sleep(4000);
    if (newAuthToken != null && newAuthToken !== "") {
        console.log("Auth token found:", newAuthToken);
        // Gửi newAuthToken tới API
        const apiSuccess = await sendAuthTokenToApi(currentUrl, newAuthToken);
        if (apiSuccess) {
            console.log("Successfully sent auth token to API");
        } else {
            console.log("Failed to send auth token to API");
        }
        await sleep(4000);
        // Đóng tab sau khi gửi API
        console.log("Sent token request success : ", currentUrl);
        chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
            console.log("Request to close tab sent to background script.");
        });
        return true;
    }
    await sleep(2000);

    chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
        console.log("Request to close tab sent to background script.");
    });
    return true;
}

// Hàm gửi API khi tất cả task hoàn tất
async function sendCompletionApi() {
    const apiUrl = CONFIG[ENVIRONMENT].SEND_MESSAGE_BET_API; // Thay bằng URL API thực tế
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'all_tasks_completed'
            })
        });
        if (!response.ok) {
            const text = await response.text();
            console.error(`Failed to send completion API: ${response.status}, Response: ${text}`);
            return false;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`Completion API returned non-JSON response: ${text}`);
            return false;
        }
        const result = await response.json();
        console.log("Completion API response:", result);
        return true;
    } catch (error) {
        console.error("Error sending completion API:", error);
        return false;
    }
}


async function loginExecute() {
    console.log("Executing loginExecute function");
    const currentUrl = window.location.href;

    // Yêu cầu dữ liệu từ background.js
    const data = await new Promise((resolve) => {
        chrome.runtime.sendMessage({action: "getData"}, (response) => {
            console.log("Received data from background.js:", response);
            resolve(response.data || []);
        });
    });

    if (!Array.isArray(data) || !data.length) {
        console.error("No valid vendor data, exiting");
        chrome.runtime.sendMessage({action: "closeTab"}, (response) => {
            console.log("Request to close tab sent to background script.");
        });
        return true;
    }

    for (let i = 0; i < data.length; i++) {
        const curr_obj = data[i];
        if (currentUrl.includes(curr_obj.domain)) {
            const obj = {
                domain: curr_obj.domain,
                username: curr_obj.username,
                password: curr_obj.password,
                name_site: curr_obj.name_site,
                note: curr_obj.note,
                name_check: curr_obj.name_check,
            };
            const result = await autoLogin(obj);
            if (!result) {
                console.log("Login failed, reloading page");
                location.reload(); // Reload sẽ không gọi lại getAllData
            }
            break;
        }
    }
}

// loginExecute();

// console.log("Trying to run autoLogin immediately");
// autoLogin();

window.addEventListener("load", async () => {
    console.log("Page loaded, starting autoLogin");
    await loginExecute();
});
