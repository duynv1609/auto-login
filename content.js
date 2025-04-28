console.log("Content script loaded");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hàm mô phỏng nhập dữ liệu
function simulateInput(element, value) {
    if (element) {
        element.focus();
        console.log("Focused on input:", element.id);
        element.value = value;
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
        console.log("Simulated input for:", element.id, "with value:", value);
        element.blur();
    } else {
        console.log("Element not found for simulation");
    }
}

async function autoLogin() {
    const currentUrl = window.location.href;
    console.log("Content script running on:", currentUrl);

    // Trang 1: https://www.jun8.kim/vi-vn/login
    if (currentUrl === "https://www.jun8.kim/vi-vn/login") {
        console.log("Processing jun8.kim login page");

        // Chờ trang tải (10 giây để vượt Cloudflare nếu có)
        await sleep(10000);
        console.log("Waited 10 seconds for page load");

        // Nhấn nút đóng modal
        const closeButton = document.querySelector(".standard-modal-close");
        const closeButton2 = document.querySelector(".image-announcement-close");
        if (closeButton) {
            closeButton.click();
            console.log("Closed modal with standard-modal-close");
        } else {
            console.log("No modal close button found for .standard-modal-close");
        }
        if (closeButton2) {
            closeButton2.click();
            console.log("Closed modal with image-announcement-close");
        } else {
            console.log("No modal close button found for .image-announcement-close");
        }

        // Thử điền thông tin đăng nhập (tối đa 5 lần)
        let loginInput = null;
        let passwordInput = null;
        let attempts = 0;
        while ((!loginInput || !passwordInput) && attempts < 5) {
            await sleep(1000);
            loginInput = document.querySelector('#login.form-control-login[type="text"]');
            passwordInput = document.querySelector('#password.form-control-login[type="password"]');
            attempts++;
            console.log(`Attempt ${attempts}: Inputs ${loginInput && passwordInput ? 'found' : 'not found'}`);
        }
        simulateInput(loginInput, "thiennhan798");
        simulateInput(passwordInput, "YeP3eCnXKGSZ");

        // Chờ và nhấn nút đăng nhập (tối đa 5 lần)
        let loginButton = null;
        attempts = 0;
        while (!loginButton && attempts < 5) {
            await sleep(1000);
            loginButton = document.querySelector('button[aria-label="login"].user-login-btn.header-btn');
            attempts++;
            console.log(`Attempt ${attempts}: Login button ${loginButton ? 'found' : 'not found'}`);
        }
        if (loginButton) {
            loginButton.click();
            console.log("Clicked login button");
        } else {
            console.log("Login button not found after 5 attempts");
        }

        // Sleep 30 giây
        await sleep(30000);
        console.log("Waited 30 seconds after login attempt");
    }

    // Trang 2: https://789be89.com/Deposit
    if (currentUrl === "https://789be89.com/Deposit") {
        await sleep(4000);
        console.log("Processing 789be89.com - no logic yet");
        const closeButton = document.querySelector('button.btn.btn-link[ng-click="$ctrl.ok()"]');
        if (closeButton) {
            closeButton.click();
        }
        await sleep(2000);
        const spanButton = document.querySelector('span[ng-click="$ctrl.ok()"][translate="Common_Closed"].ng-scope');
        if (spanButton) {
            spanButton.click();
        }
        await sleep(3000);
        console.log("Waited 3 seconds before clicking login button");

        let loginButton = null;
        let attempts = 0;
        while (!loginButton && attempts < 5) {
            await sleep(1000);
            loginButton = document.querySelector('button[ng-click="$ctrl.openLoginModal()"][translate="Shared_Login"].ng-scope');
            attempts++;
            console.log(`Attempt ${attempts}: Login button ${loginButton ? 'found' : 'not found'}`);
        }
        if (loginButton) {
            loginButton.click();
            console.log("Clicked login button with class ng-scope");
        } else {
            console.log("Login button not found after 5 attempts");
        }
        await sleep(3000);

        await sleep(3000);
        console.log("Waited 3 seconds before filling inputs");
        
        let accountInput = null;
        let passwordInput = null;
        
        while ((!accountInput || !passwordInput) && attempts < 5) {
          await sleep(1000);
          accountInput = document.querySelector('input[ng-model="$ctrl.user.account.value"][placeholder="Tài khoản"]');
          passwordInput = document.querySelector('input[ng-model="$ctrl.user.password.value"][placeholder="Mật khẩu"]');
          attempts++;
          console.log(`Attempt ${attempts}: Account input ${accountInput ? 'found' : 'not found'}, Password input ${passwordInput ? 'found' : 'not found'}`);
        }
        
        if (accountInput) {
          simulateInput(accountInput, "abc");
          console.log("Filled account input with value: abc");
        } else {
          console.log("Account input not found after 5 attempts");
        }
        
        if (passwordInput) {
          simulateInput(passwordInput, "xyz"); // Thay 'xyz' bằng mật khẩu thực tế
          console.log("Filled password input with value: xyz");
        } else {
          console.log("Password input not found after 5 attempts");
        }
    }
}

// Thử chạy ngay lập tức và khi trang tải xong
console.log("Trying to run autoLogin immediately");
autoLogin();

window.addEventListener("load", () => {
    console.log("Page loaded, starting autoLogin");
    autoLogin();
});