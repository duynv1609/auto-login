console.log("Content script loaded");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hàm mô phỏng nhập dữ liệu
function simulateInput(element, value) {
    if (element) {
        element.focus();
        console.log("Focused on input:", element.id || element.placeholder, "with value:", value);
        element.value = value;
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
        console.log("Simulated input for:", element.id || element.placeholder, "with value:", value);
        element.blur();
    } else {
        console.log("Element not found for simulation");
    }
}

// Hàm giải mã CAPTCHA
async function solveCaptcha(imageElement) {
    try {
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({ tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' });
        const { data: { text } } = await worker.recognize(imageElement);
        await worker.terminate();
        console.log("CAPTCHA text:", text);
        return text.trim();
    } catch (error) {
        console.error("CAPTCHA solving failed:", error);
        return null;
    }
}

// Trong content.js
// Trong content.js
// Trong content.js
async function autoLogin() {
    const currentUrl = window.location.href;
    console.log("Content script running on:", currentUrl);

    if (currentUrl.includes("https://789be89.com/Deposit")) {
        console.log("Processing 789be89.com deposit page");

        await sleep(4000);
        const closeButton = document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
        if (closeButton) {
            closeButton.click();
            console.log("Clicked close button with class btn btn-link");
        }

        await sleep(2000);
        const spanButton = document.querySelector('span[ng-click="$ctrl.ok()"][translate="Common_Closed"].ng-scope');
        if (spanButton) {
            spanButton.click();
            console.log("Clicked span with class ng-scope");
        }

        await sleep(3000);
        let loginButtonToOpenForm = null;
        let attempts = 0;
        while (!loginButtonToOpenForm && attempts < 5) {
            await sleep(1000);
            loginButtonToOpenForm = document.querySelector('button[ng-click="$ctrl.openLoginModal()"][translate="Shared_Login"].ng-scope');
            attempts++;
            console.log(`Attempt ${attempts}: Login button ${loginButtonToOpenForm ? 'found' : 'not found'}`);
        }
        if (loginButtonToOpenForm) {
            loginButtonToOpenForm.click();
            console.log("Clicked login button with class ng-scope");
        }

        await sleep(3000);
        console.log("Waited 3 seconds before filling inputs");

        let accountInput = null;
        let passwordInput = null;
        attempts = 0;
        while ((!accountInput || !passwordInput) && attempts < 5) {
            await sleep(1000);
            accountInput = document.querySelector('input[ng-model="$ctrl.user.account.value"][placeholder="Tài khoản"]');
            passwordInput = document.querySelector('input[ng-model="$ctrl.user.password.value"][placeholder="Mật khẩu"]');
            attempts++;
            console.log(`Attempt ${attempts}: Account input ${accountInput ? 'found' : 'not found'}, Password input ${passwordInput ? 'found' : 'not found'}`);
        }
        if (accountInput) simulateInput(accountInput, "thiennhan798");
        if (passwordInput) simulateInput(passwordInput, "YeP3eCnXKGSZ"); // Thay 'xyz' bằng mật khẩu thực tế

        // Xử lý CAPTCHA với lặp lại khi có lỗi
        let maxRetries = 3;
        for (let retry = 0; retry < maxRetries; retry++) {
            await sleep(1000);
            console.log(`CAPTCHA attempt ${retry + 1}: Waited 10 seconds before processing CAPTCHA`);

            let captchaInput = null;
            attempts = 0;
            while (!captchaInput && attempts < 15) {
                await sleep(1000);
                captchaInput = document.querySelector('input[ng-model="$ctrl.code"][placeholder="Mã xác minh"]');
                attempts++;
                console.log(`Attempt ${attempts}: CAPTCHA input ${captchaInput ? 'found' : 'not found'}`);
            }

            if (captchaInput) {
                let captchaImage = null;
                attempts = 0;
                while (!captchaImage && attempts < 15) {
                    await sleep(1000);
                    captchaImage = document.querySelector('img[ng-class="$ctrl.styles.captcha"][ng-click="$ctrl.refreshCaptcha()"]');
                    attempts++;
                    console.log(`Attempt ${attempts}: CAPTCHA image ${captchaImage ? 'found' : 'not found'}`);
                }

                if (captchaImage) {
                    captchaImage.click(); // Nhấp vào ảnh CAPTCHA để làm mới
                    console.log("Clicked CAPTCHA image to refresh");

                    await sleep(2000); // Chờ ảnh mới tải
                    captchaImage = document.querySelector('img[ng-class="$ctrl.styles.captcha"][ng-click="$ctrl.refreshCaptcha()"]'); // Lấy lại ảnh
                    const base64Src = captchaImage ? (captchaImage.getAttribute('ng-src') || captchaImage.getAttribute('src')) : null;

                    if (base64Src && base64Src.startsWith('data:image/')) {
                        const captchaText = await solveCaptcha(base64Src);
                        if (captchaText) {
                            simulateInput(captchaInput, captchaText);
                            console.log("Filled CAPTCHA input with value:", captchaText);

                            // Nhấp vào nút ĐĂNG NHẬP
                            await sleep(2000);
                            console.log("Waited 2 seconds before clicking login span");

                            let loginSpan = null;
                            attempts = 0;
                            while (!loginSpan && attempts < 5) {
                                await sleep(1000);
                                loginSpan = document.querySelector('span[ng-if="!$ctrl.loginPending"][translate="Shared_Login"].ng-scope');
                                attempts++;
                                console.log(`Attempt ${attempts}: Login span ${loginSpan ? 'found' : 'not found'}`);
                            }
                            if (loginSpan) {
                                loginSpan.click();
                                console.log("Clicked login span with class ng-scope");

                                // Kiểm tra thông báo lỗi
                                await sleep(3000);
                                console.log("Checking for error message");

                                let errorDiv = null;
                                attempts = 0;
                                while (!errorDiv && attempts < 5) {
                                    await sleep(1000);
                                    errorDiv = document.querySelector('div[bind-html-compile="$ctrl.content"]');
                                    attempts++;
                                    console.log(`Attempt ${attempts}: Error div ${errorDiv ? 'found' : 'not found'}`);
                                }

                                if (errorDiv && errorDiv.textContent.includes("Lỗi mã xác minh hoặc lỗi đầu vào, vui lòng quay lại")) {
                                    console.log("Error detected: Lỗi mã xác minh hoặc lỗi đầu vào");

                                    // Nhấp nút xác nhận
                                    let confirmButton = null;
                                    attempts = 0;
                                    while (!confirmButton && attempts < 5) {
                                        await sleep(1000);
                                        confirmButton = document.querySelector('button.btn.btn-primary[ng-click="$ctrl.ok()"][translate="Common_Confirm"].ng-scope');
                                        attempts++;
                                        console.log(`Attempt ${attempts}: Confirm button ${confirmButton ? 'found' : 'not found'}`);
                                        if (confirmButton) {
                                            confirmButton.click();
                                            console.log("Clicked confirm button with class btn-primary");
                                            continue; // Thử lại CAPTCHA
                                        } else {
                                            console.log("Confirm button not found after 5 attempts");
                                            break;
                                        }
                                    }
                                } else {
                                    console.log("No error detected, login successful or no error message");
                                    break; // Thoát nếu không có lỗi
                                }
                            } else {
                                console.log("Login span not found after 5 attempts");
                                break;
                            }
                        } else {
                            console.log("Failed to solve CAPTCHA");
                            break;
                        }
                    } else {
                        console.log("Invalid or missing base64 src for CAPTCHA image");
                        break;
                    }
                } else {
                    console.log("CAPTCHA image not found after 15 attempts");
                    break;
                }
            } else {
                console.log("CAPTCHA input not found after 15 attempts");
                break;
            }
        }
    }
}

console.log("Trying to run autoLogin immediately");
autoLogin();

window.addEventListener("load", () => {
    console.log("Page loaded, starting autoLogin");
    autoLogin();
});