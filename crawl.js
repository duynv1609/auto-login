const ENVIRONMENT = "production"; // Thay thành "production" khi deploy

const CONFIG = {
  // local: {
  //   API_BASE_URL: "https://bantkg.test",
  //   LIST_VENDOR_API: "https://bantkg.test/api/list-vendor",
  //   SEND_MESSAGE_BET_API: "https://bantkg.test/api/send-message-bet",
  //   SENT_TOKEN_BET_API: "https://bantkg.test/api/token-bet-telegram",
  //   UPDATE_TYPE_VENDOR: "https://bantkg.test/api/update-type-vendor",
  // },
  local: {
      API_BASE_URL: "192.168.1.206:8000",
      LIST_VENDOR_API: "192.168.1.206:8000/api/list-vendor",
      SEND_MESSAGE_BET_API: "192.168.1.206:8000/api/send-message-bet",
      SENT_TOKEN_BET_API: "192.168.1.206:8000/api/token-bet-telegram",
      UPDATE_TYPE_VENDOR: "192.168.1.206:8000/api/update-type-vendor",
  },
  production: {
    API_BASE_URL: "https://quanlysim.vn",
    LIST_VENDOR_API: "https://quanlysim.vn/api/list-vendor",
    SEND_MESSAGE_BET_API: "https://quanlysim.vn/api/send-message-bet",
    UPDATE_TYPE_VENDOR: "https://quanlysim.vn/api/update-type-vendor",
    SENT_TOKEN_BET_API: "https://quanlysim.vn/api/token-bet-telegram",
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAuthToken() {
  const patCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("_pat="));
  if (!patCookie) {
    const newAuthToken = localStorage.getItem("token") || "";
    return newAuthToken.replace(/"/g, "");
  }
  return patCookie.split("=")[1];
}

// Hàm mô phỏng nhập dữ liệu
function simulateInput(element, value) {
  if (element) {
    element.focus();
    console.log(
      "Focused on input:",
      element.id || element.placeholder,
      "with value:",
      value
    );
    element.value = value;
    const inputEvent = new Event("input", { bubbles: true });
    element.dispatchEvent(inputEvent);
    console.log(
      "Simulated input for:",
      element.id || element.placeholder,
      "with value:",
      value
    );
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
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Src,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.log(
        "Google Vision API request failed:",
        response.status,
        response.statusText
      );
      chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
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
      const captchaText =
        data.responses[0].textAnnotations[0].description.trim();
      console.log("CAPTCHA text:", captchaText);
      return captchaText.trim();
    } else {
      chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
        console.log("Request to close tab sent to background script.");
      });
      return false; // Thoát hàm nếu đã gửi token
    }
  } catch(error) 
  {  
    chrome.runtime.sendMessage({ action: "closeTab" }, (response) => 
    {
      console.log("Request to close tab sent to background script.");
    });
    return false; // Thoát hàm nếu đã gửi token
  }
}

// Hàm gửi authToken tới API
function getTekcorePositionJUN88CMD(nameCheck) 
{  
  console.log("did in this getTEKCORE function rồi nha:"+nameCheck);
  
  let position = -1;

  try
{
  const bankContainers = document.querySelectorAll('.standard-bank-container');
bankContainers.forEach((container, index) => {
  if (container.textContent.includes(nameCheck)) {
    position = index + 1;
    console.log(`Found "Thẻ cào TEKCORE" in standard-bank-container at position: ${position}`);
  }
});

if (position === -1) {
  console.log('No standard-bank-container with "Thẻ cào TEKCORE" found');
}
  // const container = document.querySelector(
  //   "div.standard-form-field.standard-deposit-select-option-full.undefined"
  // );
  // if (!container) {
  //   console.log("Container not found");
  //   return { bankList: [], position: -1 };
  // }
  // console.log(container);
  // const bankContainers = container.querySelectorAll(
  //   "div.standard-bank-container.container-show-with-bank-image-and-text"
  // );
  // const paymentOptions = [];
  // document.querySelectorAll(".standard-radio-content-label").forEach((el) => {
  //   paymentOptions.push(el.innerText.trim());
  // });
  // await sleep(2000);
  // let position = -1;
  // Array.from(bankContainers).forEach((bank, index) => {
  //   const label = bank.querySelector("span.standard-radio-content-label");
  //   const labelText = label ? label.textContent.trim() : "";
  //   console.log(labelText, "CAC");
    
  //   if (labelText === nameCheck) 
  //   {
  //     position = index + 1;
  //   }
  // });
  
  // await sleep(2000);
}
catch (error) {
  console.log("Error in getTekcorePositionJUN88CMD:", error);
}
  return position;
}

async function autoLogin(obj) {
  const currentUrl = obj.domain;
  const nameSite = obj.name_site;
  const userName = obj.username;
  const passWord = obj.password;
  const siteNote = obj.note;
  const nameCheck = obj.name_check;

  console.log("Processing deposit page " + nameSite);
  
  await sleep(2000);

  let close_second_button = null;

  try {
    close_second_button = document.querySelector(
      'button.btn.btn-link[ng-click="$ctrl.ok()"]'
    );
  } catch (error) {
    console.log("Error finding button:", error);
  }

  if (close_second_button != null) {
    console.log("Button found, clicking it now!");
    close_second_button.click();
  }

  let closeButton = null;
  try {
    closeButton =
      document.querySelector("div.close") ||
      document.querySelector("i.mps-close") ||
      document.querySelector("div.standard-modal-close") ||
      document.querySelector("div.tcg_modal_close") ||
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

  const spanButton = document.querySelector(
    'span[ng-click="$ctrl.ok()"][translate="Common_Closed"].ng-scope'
  );
  if (spanButton) {
    spanButton.click();
    console.log("Clicked span with class ng-scope");
  }

  //======================START JUN88 CMD=============================
  if (nameSite === "CMD") {
    let btnNapTien = document.querySelector("a.deposit-btn.css-xgccq");
    if (btnNapTien == null) {
      let closeButtonCMD = null;
      try {
        closeButtonCMD =
          document.querySelector("div.close") ||
          document.querySelector("i.mps-close") ||
          document.querySelector("div.standard-modal-close") ||
          document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
        if (closeButtonCMD) {
          closeButtonCMD.click();
          console.log(
            "Clicked close button (div.close, i.mps-close, or btn-link)"
          );
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
        modalLoginFormBtnCMD =
          document.querySelector("div.header-btn.login") ||
          document.querySelector("button.btnLogin");
        attemptsModalCMD++;
        console.log(
          `Attempt ${attemptsModalCMD}: Login button ${
            modalLoginFormBtnCMD ? "found" : "not found"
          }`
        );
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
        accountInputCMD = document.querySelector("input#login");
        passwordInputCMD = document.querySelector("input#password");
        attemptsInputCMD++;
        console.log(attemptsInputCMD);
        console.log(
          `Attempt ${attemptsInputCMD}: Account input ${
            accountInputCMD ? "found" : "not found"
          }, Password input ${passwordInputCMD ? "found" : "not found"}`
        );
        if (attemptsInputCMD > 3) {
          await sleep(15000);
          console.log("Attempts reached 3, reloading the page to recheck.");
          location.reload();
          return; // Exit the function to prevent further execution after reload
        }
      }
      console.log(attemptsInputCMD);
      if (accountInputCMD) simulateInput(accountInputCMD, userName);
      if (passwordInputCMD) simulateInput(passwordInputCMD, passWord); // Thay 'xyz' bằng mật khẩu thực tế
      console.log("CLMM CMD");
      await sleep(2000);
      passwordInputCMD.focus();

      // Nhấp vào nút ĐĂNG NHẬP
      console.log("Waited 2 seconds before clicking login span");

      let loginSpan = null;
      let attemptsLoginBtn = 0;
      while (!loginSpan && attemptsLoginBtn < 5) {
        await sleep(100);
        loginSpan = document.querySelector("button.header-btn");
        attemptsLoginBtn++;
        console.log(
          `Attempt ${attemptsLoginBtn}: Login span ${
            loginSpan ? "found" : "not found"
          }`
        );
      }
      console.log("Clicked login so lan", attemptsLoginBtn);
      if (attemptsLoginBtn === 4) {
        console.log("Clicked login so lan", attemptsLoginBtn);
        chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
          console.log("Request to close tab sent to background script.");
        });
        return true;
      }
      console.log("Clicked login loginSpan");
      if (loginSpan) {
        await sleep(5000);



        const clickEvent = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        });

        loginSpan.dispatchEvent(clickEvent);

        await sleep(5000);
        // console.log("Clicked login loginSpan");
        // return;
      }
    }
    //======Ở TRÊN LÀ HÀNH ĐỘNG LOGIN========

    await sleep(3000);
    if (btnNapTien != null) {
      btnNapTien.click();
      console.log("Clicked button deposit");
      await sleep(5000);
    } else {
      console.log("Button deposit not found");

      location.reload();
      // chrome.runtime.sendMessage({ action: "refreshPage" });
      // Đóng tab sau khi gửi API
      // await sleep(4000);
      // console.log("Sent token request success : ", currentUrl);
      // chrome.runtime.sendMessage(
      //   { action: "closeTab", status: 1 },
      //   (response) => {
      //     console.log("Request to close tab sent to background script.");
      //   }
      // );
      // return true; // Thoát hàm nếu đã gửi token
    }

    const count_img_div = 0;

    const imageCMDTheCao = document.querySelectorAll('.bank-option-icon');

    imageCMDTheCao.forEach((img) => 
      {
        if (img.src.includes("mobilecard.svg")) {
          img.click();
          console.log("Clicked image CMD roi nha");
          console.log("OK NHA");
          // Gọi trong autoLogin, ví dụ sau clickMobileCardImage
          console.log(nameCheck);
        }
      });
    
    while (imageCMDTheCao == null && count_img_div < 4) {
      
      count_img_div += 1;

    imageCMDTheCao = document.querySelectorAll('.bank-option-icon');

    imageCMDTheCao.forEach((img) => 
      {
        if (img.src.includes("mobilecard.svg")) {
          img.click();
          console.log("Clicked image CMD roi nha");
          console.log("OK NHA");
          // Gọi trong autoLogin, ví dụ sau clickMobileCardImage
          console.log(nameCheck);
        }
      });    }

    if (imageCMDTheCao) {
    try
    {
      imageCMDTheCao.click();
    }
    catch (error) {
      console.log("Error clicking image:", error);
    }
      console.log("Clicked image CMD roi nha");
      console.log("OK NHA");
      // Gọi trong autoLogin, ví dụ sau clickMobileCardImage
      //console.log(nameCheck);
      await sleep(3000);

      const position = getTekcorePositionJUN88CMD(nameCheck);
      console.log("VI TRI CMD NHA DCMM: ", position);
      await sleep(3000);
      var dataHtml = document.documentElement.outerHTML;
      const parser = new DOMParser();
      const doc=parser.parseFromString(dataHtml, "text/html");
      const targetBlock = doc.querySelector('div.standard-form-field.standard-deposit-select-option-full');
     console.log(targetBlock?.outerHTML);
      if (position === -1) 
      {
        console.log("Thẻ Cào TEKCORE not found in list");
      }
      
      const apiSuccess = await sendAuthTokenToApi(currentUrl, position);
      if (apiSuccess) 
      {
        console.log("Successfully sent auth token to API");
        // Đóng tab sau khi gửi API
        console.log("Sent token request success : ", currentUrl);        

        chrome.runtime.sendMessage(
          { action: "closeTab", status: 1 },
          (response) => {
            console.log("Request to close tab sent to background script.");            
          }
        );
        return true; // Thoát hàm nếu đã gửi token        
      } 
      else 
      {
        console.log("Failed to send auth token to API");
        chrome.runtime.sendMessage(
          { action: "closeTab", status: 1 },
          (response) => {
            console.log("Request to close tab sent to background script.");
          }
        );
        return false;
      }
    } else {
      console.log("Image Div not found");

      location.reload();
    }

    await sleep(4000);
  }
  //======================END JUN88 CMD=============================

  //======================START HI88=============================
  console.log("nameSite:", nameSite);
  if (nameSite === "HI88") {
    console.log("Clicked login button with class ng-scope");
    await sleep(5000000);
    // https://www.qq8827.com/m/index.html
  }
  //======================END HI88=============================

  //======================START R88=============================
  if (nameSite === "R88") {
    let modalLoginFormBtnR88 = null;
    let attemptsModalR88 = 0;
    while (!modalLoginFormBtnR88 && attemptsModalR88 < 3) {
      await sleep(5000);
      modalLoginFormBtnR88 = document.querySelector("div .submit_btn");
      attemptsModalR88++;
      console.log(
        `Attempt ${attemptsModalR88}: Login button ${
          modalLoginFormBtnR88 ? "found" : "not found"
        }`
      );
    }
    if (modalLoginFormBtnR88) {
      await sleep(3000);
      modalLoginFormBtnR88.click();
      console.log("Clicked login button with class ng-scope");
    }
    console.log("Waited 3 seconds before filling inputs");

    let accountInputR88 = null;
    let passwordInputR88 = null;
    var attemptsInputR88 = 0;
    while ((!accountInputR88 || !passwordInputR88) && attemptsInputR88 < 5) {
      await sleep(1000);
      accountInputR88 = document.querySelector("input.username_input");
      passwordInputR88 = document.querySelector("input.password_input");
      attemptsInputR88++;
      console.log(attemptsInputR88);
      console.log(
        `Attempt ${attemptsInputR88}: Account input ${
          accountInputR88 ? "found" : "not found"
        }, Password input ${passwordInputR88 ? "found" : "not found"}`
      );
      if (attemptsInputR88 > 3) {
        await sleep(15000);
        console.log("Attempts reached 3, reloading the page to recheck.");
        location.reload();
        return; // Exit the function to prevent further execution after reload
      }
    }
    console.log("DMM CUT");
    console.log(attemptsInputR88);
    if (accountInputR88) simulateInput(accountInputR88, userName);
    if (passwordInputR88) simulateInput(passwordInputR88, passWord); // Thay 'xyz' bằng mật khẩu thực tế
    console.log("CLMM");
    await sleep(2000);
    passwordInputR88.focus();

    if (accountInputR88 != null && passwordInputR88 != null) {
      console.log("account input is:" + accountInputR88);
      console.log("In this solve captcha");
      let captchaInput = null;
      attempts = 0;
      while (!captchaInput && attempts < 3) {
        await sleep(1000);
        captchaInput = document.querySelector(".captcha_input");
        attempts++;
        console.log(
          `Attempt ${attempts}: CAPTCHA input ${
            captchaInput ? "found" : "not found"
          }`
        );
        await sleep(2000);
      }
      console.log("Captcha input found:", captchaInput);
      if (captchaInput) {
        let captchaImage = null;
        await sleep(2000);
        captchaInput.dispatchEvent(new Event("mousedown", { bubbles: true }));
        captchaInput.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
        captchaInput.focus();
        await sleep(2000);
        console.log("Clicked CAPTCHA image to refresh");
        captchaImage = document.querySelector("div.captcha_box > img");
        const base64Src = captchaImage.getAttribute("src");
        console.log(base64Src, captchaImage);
        await sleep(2000);
        if (!base64Src) {
          location.reload();
        }
        await sleep(2000);
        if (base64Src && base64Src.startsWith("data:image/")) {
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
            while (!loginSpan && attemptsLoginSpan < 3) {
              await sleep(100);
              loginSpan = document.querySelector("button.submit_btn");
              attemptsLoginSpan++;
              console.log(
                `Attempt ${attemptsLoginSpan}: Login span ${
                  loginSpan ? "found" : "not found"
                }`
              );
            }

            if (loginSpan) {
              console.log("STEP 2");
              localStorage.setItem(siteNote, true);
              loginSpan.click();
              console.log("Clicked login btn r88");
              await sleep(3000);
              let closeButton = null;
              try {
                closeButton = document.querySelector("div.tcg_modal_close");
                if (closeButton) {
                  closeButton.click();
                  console.log(
                    "Clicked close button (div.close, i.mps-close, or btn-link)"
                  );
                } else {
                  console.log("Close button not found");
                }
              } catch (error) {
                console.log("Error finding close button:", error);
              }
              await sleep(2000);
              let depositBtnClick = document.querySelector("div.deposit-btn");
              if (depositBtnClick !== null) {
                depositBtnClick.click();
                console.log("Clicked deposit button");
              }
              await sleep(2000);
              // Tìm tất cả các div có class bankname
              const bankDivs = document.querySelectorAll("div.bankname");

              bankDivs.forEach((divCon) => {
                const firstChildDiv = divCon.querySelector("div");
                if (
                  firstChildDiv &&
                  firstChildDiv.textContent.trim() === "Thẻ cào điện thoại"
                ) {
                  divCon.click();
                  console.log('Đã click vào div chứa "Thẻ cào điện thoại"');
                }
              });
              await sleep(2000);
              const ul = document.querySelector("ul#depositAllVendor");
              let positionTEKCORE = -1;

              if (ul) {
                const liList = ul.querySelectorAll("li");
                for (let i = 0; i < liList.length; i++) {
                  const li = liList[i];
                  const channelDiv = li.querySelector("div.channel-wrap");
                  if (
                    channelDiv &&
                    channelDiv.getAttribute("value") === nameCheck
                  ) {
                    channelDiv.click();
                    positionTEKCORE = i + 1; // vị trí bắt đầu từ 1
                    console.log(
                      "Clicked channel-wrap with value TEKCOREPAY, position:",
                      positionTEKCORE
                    );
                    break; // chỉ click 1 lần, nếu muốn click hết thì bỏ break
                  }
                }
                if (positionTEKCORE === -1) {
                  console.log("Không tìm thấy TEKCOREPAY trong danh sách");
                }
              } else {
                console.log("ul#depositAllVendor not found");
              }
              console.log("VI TRI CMD: ", positionTEKCORE);
              const apiSuccess = await sendAuthTokenToApi(
                currentUrl,
                positionTEKCORE
              );
              if (apiSuccess) {
                console.log("Successfully sent auth token to API");
                // Đóng tab sau khi gửi API
                console.log("Sent token request success : ", currentUrl);
                chrome.runtime.sendMessage(
                  { action: "closeTab", status: 1 },
                  (response) => {
                    console.log(
                      "Request to close tab sent to background script."
                    );
                  }
                );
                return true; // Thoát hàm nếu đã gửi token
              } else {
                console.log("Failed to send auth token to API");
                chrome.runtime.sendMessage(
                  { action: "closeTab", status: 1 },
                  (response) => {
                    console.log(
                      "Request to close tab sent to background script."
                    );
                  }
                );
                return false;
              }
            }
          } else {
            console.log("Failed to solve CAPTCHA R88");
            location.reload();
          }
        } else {
          console.log("Invalid or missing base64 src for CAPTCHA image R88");
          location.reload();
        }
      } else {
        console.log("CAPTCHA input not found after 15 attempts R88");
        location.reload();
      }
    }
  }
  //======================END R88=============================

  //console.log("TRANG NÀY ĐÉO PHẢI CỦA JUN CMD RỒI");

  if (nameSite === "78WIN" || nameSite === "JUN88") {
    let closeButton = null;
    try {
      closeButton =
        document.querySelector("div.close") ||
        document.querySelector("i.mps-close") ||
        document.querySelector("div.standard-modal-close") ||
        document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
      if (closeButton) {
        closeButton.click();
        console.log(
          "Clicked close button (div.close, i.mps-close, or btn-link)"
        );
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
      await sleep(1000);
      modalLoginFormBtn =
        document.querySelector("div.header-btn.login") ||
        document.querySelector("button.btnLogin") ||
        document.querySelector("a.btn-big.login");
      attemptsModal++;
      console.log(
        `Attempt ${attemptsModal}: Login button ${
          modalLoginFormBtn ? "found" : "not found"
        }`
      );
    }
    if (modalLoginFormBtn) {
      await sleep(1000);
      modalLoginFormBtn.click();
      console.log("Clicked login button with class ng-scope");
    }

    await sleep(3000);
    var authToken = getAuthToken();
    console.log("Waited 3 seconds before filling inputs");
    console.log("Auth token found:", authToken);
    if (authToken == null || authToken == "") {
      let accountInput = null;
      let passwordInput = null;
      var attemptsInput = 0;
      while ((!accountInput || !passwordInput) && attemptsInput < 5) {
        await sleep(500);
        accountInput = document.querySelector("input#login");
        passwordInput = document.querySelector("input#password");
        attemptsInput++;
        console.log(attemptsInput);
        console.log(
          `Attempt ${attemptsInput}: Account input ${
            accountInput ? "found" : "not found"
          }, Password input ${passwordInput ? "found" : "not found"}`
        );
        if (attemptsInput > 3) {
          console.log("Attempts reached 3, reloading the page to recheck.");
          location.reload();
        }
      }

      console.log(attemptsInput);
      if (accountInput) simulateInput(accountInput, userName);
      if (passwordInput) simulateInput(passwordInput, passWord); // Thay 'xyz' bằng mật khẩu thực tế
      console.log("CLMMM");
      await sleep(4000);

      // Nhấp vào nút ĐĂNG NHẬP
      // await sleep(2000);
      console.log("Waited 2 seconds before clicking login span");
      if (accountInput && passwordInput) {
        console.log("Login already");
        let loginSpan = null;
        let attemptsLoginBtn = 0;
        while (!loginSpan && attemptsLoginBtn < 5) {
          await sleep(1000);
          loginSpan =
            document.querySelector("button.nrc-button") ||
            document.querySelector("button.header-btn");
          attemptsLoginBtn++;
          console.log(
            `Attempt ${attemptsLoginBtn}: Login span ${
              loginSpan ? "found" : "not found"
            }`
          );
        }
        if (attemptsLoginBtn === 4) {
          chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
            console.log("Request to close tab sent to background script.");
          });
          return true;
        }
        console.log("Clicked login loginSpan");

        if (loginSpan) {
          await sleep(1000);

          loginSpan.click();

          loginSpan =
            document.querySelector("button.nrc-button") ||
            document.querySelector("button.header-btn");

          attemptsLoginBtn = 0;

          while (loginSpan != null && attemptsLoginBtn < 20) {
            
            loginSpan.click();

            attemptsLoginBtn++;

            loginSpan =
              document.querySelector("button.nrc-button") ||
              document.querySelector("button.header-btn");

            await sleep(1500);
          }
          console.log("Clicked login loginSpan");
        }
      }
    }
    await sleep(3000);
    console.log("Did login jun88k2");

    let navItems = "";
    if (nameSite == "78WIN") {
      navItems = document.querySelectorAll("ul.logined-nav li");
    } else {
      navItems = document.querySelectorAll("li > a");
    }
    await sleep(3000);
    console.log(navItems, "MENU");
    navItems.forEach((link) => {
      if (link.textContent.trim() === "Nạp tiền") {
        link.click();
      }
    });

    await sleep(1000);

    const depositItems = document.querySelectorAll(".deposit-list-item");

    if (depositItems == null) {
      console.log("Deposit items not found");
      return false;
    }

    await sleep(3000);

    console.log("Deposit item found");
    depositItems.forEach((item) => {
      const heading = item.querySelector("h3");
      if (heading && heading.textContent.trim().toUpperCase() === "THẺ CÀO") {
        console.log("Item found:" + item.textContent.trim());
        item.click();
      }
    });

    await sleep(5000);

    const listItems = document.querySelectorAll("ul > li.mc-collection-option");

    let position_ctek = -1;

    listItems.forEach((item, index) => {
      const nameDiv = item.querySelector(".mc-collection-name");

      if (nameDiv && nameDiv.textContent.trim().includes(nameCheck)) {
        position_ctek = index + 1; // Index starts from 0
      }
    });
    console.log(position_ctek, "TÌM ĐƯỢC VỊ TRÍ RỒI NHA DCMM");

    await sleep(1000);

    if (position_ctek === -1) {
      console.log("Thẻ Cào TEKCORE not found in list");
    }
    console.log("VI TRI CMD: ", position_ctek);
    const apiSuccess = await sendAuthTokenToApi(currentUrl, position_ctek);
    if (apiSuccess) {
      console.log("Successfully sent auth token to API");

      console.log("Sent token request success : ", currentUrl);
      chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
        console.log("Request to close tab sent to background script.");
      });
      return true; // Thoát hàm nếu đã gửi token
    } else {
      console.log("Failed to send auth token to API");
      chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
        console.log("Request to close tab sent to background script.");
      });
      return false;
    }
  } else if (nameSite.includes("qq8876")) {
    let loginButtonQ88 = null;
    let attempts = 0;
    while (!loginButtonQ88 && attempts < 3) {
      await sleep(500);
      loginButtonQ88 = document.querySelector(".register-btn");
      attempts++;
      console.log(
        `Attempt ${attempts}: Login button ${
          loginButtonQ88 ? "found" : "not found"
        }`
      );
    }
    if (loginButtonQ88) {
      loginButtonQ88.click();
      console.log("Clicked login button q88");
      await sleep(1000);
    }

    let accountInput = null;
    let passwordInput = null;

    attempts = 0;
    while ((!accountInput || !passwordInput) && attempts < 5) {
      await sleep(1000);
      accountInput = document.querySelector('input[name="username"]');

      passwordInput = document.querySelector('input[name="password"]');
      attempts++;
      console.log(
        `Attempt ${attempts}: Account input ${
          accountInput ? "found" : "not found"
        }, Password input ${passwordInput ? "found" : "not found"}`
      );
    }
    if (accountInput) simulateInput(accountInput, userName);
    if (passwordInput) simulateInput(passwordInput, passWord);

    await sleep(1000);

    if (accountInput != null && passwordInput != null) {
      console.log("account input is:" + accountInput);
      console.log("In this solve captcha");
      let captchaInput = null;
      attempts = 0;
      while (!captchaInput && attempts < 3) {
        await sleep(1000);
        captchaInput = document.querySelector('input[name="captcha"]');
        attempts++;
        console.log(
          `Attempt ${attempts}: CAPTCHA input ${
            captchaInput ? "found" : "not found"
          }`
        );
        await sleep(2000);
      }
      console.log("Captcha input found:", captchaInput);
      if (captchaInput) {
        let captchaImage = null;
        captchaInput.dispatchEvent(new Event("mousedown", { bubbles: true }));
        captchaInput.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
        captchaInput.focus();
        await sleep(2000);
        console.log("Clicked CAPTCHA image to refresh");
        const captchaDiv = document.querySelector(".captcha_box");
        captchaImage = captchaDiv.querySelector("img");
        if (captchaImage) {
          console.log("Captcha image found");
        }
        const base64Src = captchaImage
          ? captchaImage.getAttribute("ng-src") ||
            captchaImage.getAttribute("src")
          : null;
        console.log(base64Src, captchaImage);
        await sleep(2000);
        if (!base64Src) {
          location.reload();
        }
        await sleep(2000);
        if (base64Src && base64Src.startsWith("data:image/")) {
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
            while (!loginSpan && attemptsLoginSpan < 3) {
              await sleep(100);

              loginSpan = Array.from(
                document.querySelectorAll("button.submit_btn")
              ).find((btn) => btn.textContent.trim() === "Đăng nhập");
              attemptsLoginSpan++;
              console.log(
                `Attempt ${attemptsLoginSpan}: Login span ${
                  loginSpan ? "found" : "not found"
                }`
              );
            }

            if (loginSpan) {
              console.log("Login button is found");
              console.log("STEP 2");
              localStorage.setItem(siteNote, true);
              loginSpan.click();

              console.log("Clicked login span in q88");

              // Kiểm tra thông báo lỗi
              await sleep(2000);
              console.log("Checking for error message");
              console.log("STEP 3");
              await sleep(2000);
              let errorDiv = null;
              let attemptsDivFoundModalErr = 0;
              while (!errorDiv && attemptsDivFoundModalErr < 3) {
                await sleep(1000);
                errorDiv = document.querySelector(".pp_model_dbhtml");
                // if (accountInput) simulateInput(accountInput, "pinkman00789");
                // if (passwordInput) simulateInput(passwordInput, "Qj6g7FVYGEW"); // Thay 'xyz' bằng mật khẩu thực tế
                attemptsDivFoundModalErr++;
                console.log(
                  `Attempt ${attemptsDivFoundModalErr}: Error div ${
                    errorDiv ? "found" : "not found"
                  }`
                );
                console.log("STEP 5");
              }

              if (errorDiv) {
                console.log(errorDiv.textContent.trim());
                var textErr = errorDiv.textContent.trim();
                if (
                  textErr.includes("vô hiệu hóa") ||
                  textErr.includes("bị khóa")
                ) {
                  chrome.runtime.sendMessage(
                    { action: "closeTab", status: 1 },
                    (response) => {
                      console.log(
                        "Request to close tab sent to background script."
                      );
                    }
                  );
                  return true;
                }
                location.reload();
              }
            }
          } else {
            console.log("Failed to solve CAPTCHA");
            location.reload();
          }
        } else {
          console.log("Invalid or missing base64 src for CAPTCHA image");
          location.reload();
        }
      } else {
        console.log("CAPTCHA input not found after 15 attempts");
        location.reload();
      }
    }

    await sleep(500);

    const deposit_button = Array.from(
      document.querySelectorAll("div.header-item.deposit")
    ).find((el) => el.textContent.trim() === "Nạp Tiền");

    if (deposit_button) {
      deposit_button.click();
    } else {
      return false;
    }
    await sleep(5000);
    const bankDivs = document.querySelectorAll("div.bankname");

    bankDivs.forEach((divCon) => {
      const firstChildDiv = divCon.querySelector("div");
      if (
        firstChildDiv &&
        firstChildDiv.textContent.trim() === "Thẻ cào điện thoại"
      ) {
        divCon.click();
        console.log('Đã click vào div chứa "Thẻ cào điện thoại"');
      }
    });
    await sleep(2000);
    const ul = document.querySelector("ul#depositAllVendor");
    let positionTEKCORE = -1;

    if (ul) {
      const liList = ul.querySelectorAll("li");
      for (let i = 0; i < liList.length; i++) {
        const li = liList[i];
        const channelDiv = li.querySelector("div.channel-wrap");
        if (channelDiv && channelDiv.getAttribute("value") === nameCheck) {
          channelDiv.click();
          positionTEKCORE = i + 1; // vị trí bắt đầu từ 1
          console.log(
            "Clicked channel-wrap with value TEKCOREPAY, position:",
            positionTEKCORE
          );
          break; // chỉ click 1 lần, nếu muốn click hết thì bỏ break
        }
      }
      if (positionTEKCORE === -1) {
        console.log("Không tìm thấy TEKCOREPAY trong danh sách");
      }
    } else {
      console.log("ul#depositAllVendor not found");
    }
    console.log("VI TRI CMD: ", positionTEKCORE);
    const apiSuccess = await sendAuthTokenToApi(currentUrl, positionTEKCORE);
    if (apiSuccess) {
      console.log("Successfully sent auth token to API");
      // Đóng tab sau khi gửi API
      console.log("Sent token request success : ", currentUrl);
      chrome.runtime.sendMessage(
        { action: "closeTab", status: 1 },
        (response) => {
          console.log("Request to close tab sent to background script.");
        }
      );
      return true; // Thoát hàm nếu đã gửi token
    } else {
      console.log("Failed to send auth token to API");
      chrome.runtime.sendMessage(
        { action: "closeTab", status: 1 },
        (response) => {
          console.log("Request to close tab sent to background script.");
        }
      );
      return false;
    }
  }
  //789BET || MB66
  else {
    let loginButtonToOpenForm789BET = null;
    let attempts = 0;
    while (!loginButtonToOpenForm789BET && attempts < 3) {
      await sleep(1000);
      loginButtonToOpenForm789BET = document.querySelector(
        'button[ng-click="$ctrl.openLoginModal()"]'
      );
      attempts++;
      console.log(
        `Attempt ${attempts}: Login button ${
          loginButtonToOpenForm789BET ? "found" : "not found"
        }`
      );
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
      accountInput = document.querySelector(
        'input[ng-model="$ctrl.user.account.value"]'
      );
      passwordInput = document.querySelector(
        'input[ng-model="$ctrl.user.password.value"]'
      );
      attempts++;
      console.log(
        `Attempt ${attempts}: Account input ${
          accountInput ? "found" : "not found"
        }, Password input ${passwordInput ? "found" : "not found"}`
      );
    }
    if (accountInput) simulateInput(accountInput, userName);
    if (passwordInput) simulateInput(passwordInput, passWord); // Thay 'xyz' bằng mật khẩu thực tế

    await sleep(1000);
    // alert("da dien xong thong tin tai khoan va mat khau tai trang:   " + currentUrl);

    if (accountInput != null && passwordInput != null) {
      console.log("account input is:" + accountInput);
      console.log("In this solve captcha");
      let captchaInput = null;
      attempts = 0;
      while (!captchaInput && attempts < 3) {
        await sleep(1000);
        captchaInput = document.querySelector(".ng-pristine");
        attempts++;
        console.log(
          `Attempt ${attempts}: CAPTCHA input ${
            captchaInput ? "found" : "not found"
          }`
        );
        await sleep(2000);
      }
      console.log("Captcha input found:", captchaInput);
      if (captchaInput) {
        let captchaImage = null;
        await sleep(2000);
        captchaInput.dispatchEvent(new Event("mousedown", { bubbles: true }));
        captchaInput.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
        captchaInput.focus();
        await sleep(2000);
        console.log("Clicked CAPTCHA image to refresh");
        captchaImage = document.querySelector(
          'img[ng-class="$ctrl.styles.captcha"][ng-click="$ctrl.refreshCaptcha()"]'
        );
        const base64Src = captchaImage
          ? captchaImage.getAttribute("ng-src") ||
            captchaImage.getAttribute("src")
          : null;
        console.log(base64Src, captchaImage);
        await sleep(2000);
        if (!base64Src) {
          location.reload();
        }
        await sleep(2000);
        if (base64Src && base64Src.startsWith("data:image/")) {
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
            while (!loginSpan && attemptsLoginSpan < 3) {
              await sleep(100);
              loginSpan = document.querySelector(
                'span[ng-if="!$ctrl.loginPending"][translate="Shared_Login"].ng-scope'
              );
              attemptsLoginSpan++;
              console.log(
                `Attempt ${attemptsLoginSpan}: Login span ${
                  loginSpan ? "found" : "not found"
                }`
              );
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
                errorDiv = document.querySelector(
                  'div[bind-html-compile="$ctrl.content"]'
                );
                // if (accountInput) simulateInput(accountInput, "pinkman00789");
                // if (passwordInput) simulateInput(passwordInput, "Qj6g7FVYGEW"); // Thay 'xyz' bằng mật khẩu thực tế
                attemptsDivFoundModalErr++;
                console.log(
                  `Attempt ${attemptsDivFoundModalErr}: Error div ${
                    errorDiv ? "found" : "not found"
                  }`
                );
                console.log("STEP 5");
              }

              if (errorDiv) {
                console.log(errorDiv.textContent.trim());
                var textErr = errorDiv.textContent.trim();
                if (
                  textErr ==
                  "Tài khoản này đang bị vô hiệu hóa, vui lòng liên hệ với bộ phận chăm sóc khách hàng"
                ) {
                  chrome.runtime.sendMessage(
                    { action: "closeTab", status: 1 },
                    (response) => {
                      console.log(
                        "Request to close tab sent to background script."
                      );
                    }
                  );
                  return true;
                }
                location.reload();
              }
            }
          } else {
            console.log("Failed to solve CAPTCHA");
            location.reload();
          }
        } else {
          console.log("Invalid or missing base64 src for CAPTCHA image");
          location.reload();
        }
      } else {
        console.log("CAPTCHA input not found after 15 attempts");
        location.reload();
      }
    }

    console.log("Url:" + currentUrl);

    if (
      siteNote == "SH232" ||
      siteNote == "HI8823" ||
      siteNote == "F8BET" ||
      siteNote == "NEW88"
    ) {
      const deposit_btn = document.querySelector('button[ui-sref="deposit"]');

      if (deposit_btn) {
        deposit_btn.click();
      } else {
        return false;
      }
    } else {
      var deposit_btn =
        document.querySelector('a[href="/Deposit"]') ||
        document.querySelector('button[href="/Deposit"]');
      var count_click = 0;
      while (deposit_btn == null && count_click < 5) {
        await sleep(1000);
        deposit_btn =
          document.querySelector('a[href="/Deposit"]') ||
          document.querySelector('button[href="/Deposit"]');
        count_click++;
        console.log(
          "Attempt " +
            count_click +
            ": Deposit button " +
            (deposit_btn ? "found" : "not found")
        );
      }
      if (deposit_btn == null) {
        chrome.runtime.sendMessage(
          { action: "closeTab", status: 1 },
          (response) => {
            console.log("Request to close tab sent to background script.");
          }
        );
        return false;
      }

      deposit_btn.click();
    }

    await sleep(3000);

    const listItems = document.querySelectorAll("ul li");

    console.log(listItems);
    console.log("CC");
    let scratchCardItem = null;

    listItems.forEach((item) => {
      // console.log(item.textContent.trim());
      if (item.textContent.trim() === "Thẻ Cào") {
        scratchCardItem = item;
        console.log("Found scratch card item:" + scratchCardItem.textContent);
        scratchCardItem.click();
      }
    });

    await sleep(3000);

    const liElements = document.querySelectorAll(
      'ul li[ng-repeat="payment in $ctrl.viewModel.paymentList track by $index"]'
    );

    count_click = 0;

    while (liElements.length == 0 && count_click < 5) {
      await sleep(1000);
      liElements = document.querySelectorAll(
        'ul li[ng-repeat="payment in $ctrl.viewModel.paymentList track by $index"]'
      );
      count_click++;
      console.log(
        "Attempt " +
          count_click +
          ": Deposit button " +
          (liElements.length > 0 ? "found" : "not found")
      );
    }
    let position_ctek = -1;
    liElements.forEach((liElement, index) => {
      const h3Element = liElement.querySelector("h3");
      if (h3Element && h3Element.textContent.trim().includes(nameCheck)) {
        position_ctek = index + 1;
      }
    });
    if (position_ctek === -1) {
      console.log("Thẻ Cào TEKCORE not found in list");
    }
    console.log("VI TRI CMD: ", position_ctek);
    const apiSuccess = await sendAuthTokenToApi(currentUrl, position_ctek);
    if (apiSuccess) {
      console.log("Successfully sent auth token to API");
      // Đóng tab sau khi gửi API
      console.log("Sent token request success : ", currentUrl);
      chrome.runtime.sendMessage(
        { action: "closeTab", status: 1 },
        (response) => {
          console.log("Request to close tab sent to background script.");
        }
      );
      return true; // Thoát hàm nếu đã gửi token
    } else {
      console.log("Failed to send auth token to API");
      chrome.runtime.sendMessage(
        { action: "closeTab", status: 1 },
        (response) => {
          console.log("Request to close tab sent to background script.");
        }
      );
      return false;
    }
  }
  console.log("DJT ME MAY TAO DANG O DAY:", newAuthToken);
  // Trong autoLogin, sau clickMobileCardImage
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
    chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
      console.log("Request to close tab sent to background script.");
    });
    return true;
  }
  await sleep(2000);

  chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
    console.log("Request to close tab sent to background script.");
  });
  return true;
}

async function sendAuthTokenToApi(betDomain, betPosition) {
  let apiUrlSentToken = CONFIG[ENVIRONMENT].SENT_TOKEN_BET_API;
  console.log(CONFIG[ENVIRONMENT].SENT_TOKEN_BET_API);
  console.log(betDomain);
  console.log(betPosition);
  console.log("DCMM TAO CHUẨN BỊ GỬI TOKEN NÈ");
  await sleep(3000);
  try {
    const response = await fetch(apiUrlSentToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        betDomain: betDomain,
        betPosition: betPosition,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.log(
        `Failed to send auth token to API: ${response.status}, Response: ${text}`
      );
      await sleep(5000);
      return false;
    }
    // Kiểm tra Content-Type để đảm bảo là JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log(`API returned non-JSON response: ${text}`);
      await sleep(5000);
      return false;
    }
    const result = await response.json();
    console.log("API response:", result);
    await sleep(5000);
    return true;
  } catch (error) {
    console.log("Error sending auth token to API:", error);
    await sleep(5000);
    return false;
  }
}

async function loginExecute() {
  console.log("Executing loginExecute function");
  const currentUrl = window.location.href;

  // Yêu cầu dữ liệu từ background.js
  const data = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getData" }, (response) => {
      console.log("Received data from background.js:", response);
      resolve(response.data || []);
    });
  });

  if (!Array.isArray(data) || !data.length) {
    console.log("No valid vendor data, exiting");
    chrome.runtime.sendMessage({ action: "closeTab" }, (response) => {
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
      console.log("Current object:", obj);
      const result = await autoLogin(obj);

      if (!result) {
        console.log("Login failed, reloading page");
        location.reload(); // Reload sẽ không gọi lại getAllData
      }
      break;
    }
  }
}

window.addEventListener("load", async () => {
  console.log("Page loaded, starting autoLogin");
  await loginExecute();
});
