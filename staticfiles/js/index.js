document.addEventListener('DOMContentLoaded', function () {
  // --- Panels ---
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const resetCodeContainer = document.getElementById('reset-code-container');
  const setPasswordContainer = document.getElementById('set-password-container');

  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const showForgot = document.getElementById('show-forgot');
  const backToLogin = document.getElementById('back-to-login');

  // --- Panel helpers ---
  function showPanel(panelId) {
    [loginForm, signupForm, forgotPasswordForm, resetCodeContainer, setPasswordContainer].forEach(
      el => { if (el) el.style.display = 'none'; }
    );
    if (panelId) {
      const el = document.getElementById(panelId);
      if (el) el.style.display = 'block';
    }
  }

  // --- Check for URL parameters to show specific form ---
  function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const showParam = urlParams.get('show');
    
    if (showParam === 'forgot-password') {
      showPanel('forgot-password-form');
      // Clear the URL parameter after showing the form
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else {
      // Default to login form
      showPanel('login-form');
    }
  }

  // Initialize the appropriate form based on URL parameters
  checkUrlParameters();

  // --- Toggle forms ---
  showSignup.addEventListener('click', function (e) {
    e.preventDefault();
    showPanel('signup-form');
  });

  showLogin.addEventListener('click', function (e) {
    e.preventDefault();
    showPanel('login-form');
  });

  showForgot.addEventListener('click', function (e) {
    e.preventDefault();
    showPanel('forgot-password-form');
  });

  backToLogin.addEventListener('click', function (e) {
    e.preventDefault();
    showPanel('login-form');
  });

  // --- Login form ---
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch(window.location.origin +'/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: username,
        password: password
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.key) {
        localStorage.setItem('authToken', data.key);
        fetch(window.location.origin +'/api/profile/', {
          headers: { 'Authorization': 'Token ' + data.key }
        })
        .then(res => res.json())
        .then(profile => {
          if (profile.is_staff || profile.is_superuser) {
            window.location.href = "admin_dashboard.html";
          } else {
            window.location.href = "home.html";
          }
        });
      } else if (data.non_field_errors) {
        showError('Login failed: ' + data.non_field_errors.join(' '));
      } else {
        showError('Login failed: ' + JSON.stringify(data));
      }
    })
    .catch(err => {
      showError('Network error: Could not reach the server. Please try again later.');
    });
  });

  // --- Signup form ---
  const signupFormEl = document.querySelector('#signup-form form');
  if (signupFormEl) {
    signupFormEl.addEventListener('submit', function(e) {
      e.preventDefault();
      const errorDiv = document.getElementById('signup-error');
      errorDiv.style.display = "none";
      errorDiv.innerText = "";

      const phone = document.getElementById('phone').value.trim();
      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const password2 = document.getElementById('signup-password2').value;

      if (!username || !email || !password || !password2) {
        errorDiv.innerText = "Please fill in all required fields.";
        errorDiv.style.display = "block";
        return;
      }
      if (password !== password2) {
        errorDiv.innerText = "Passwords do not match.";
        errorDiv.style.display = "block";
        return;
      }

      fetch(window.location.origin +'/auth/registration/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: email,
          password1: password,
          password2: password2
        })
      })
      .then(async res => {
        const data = await res.json();
        if (res.ok || data.key) {
          signupFormEl.reset();
          showPanel('login-form');
          showSuccess('Account created! You can now log in.');
        } else if (data.username && Array.isArray(data.username)) {
          errorDiv.innerText = data.username[0];
          errorDiv.style.display = "block";
        } else if (data.email && Array.isArray(data.email)) {
          errorDiv.innerText = data.email[0];
          errorDiv.style.display = "block";
        } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorDiv.innerText = data.non_field_errors[0];
          errorDiv.style.display = "block";
        } else {
          errorDiv.innerText = "Registration failed: " + JSON.stringify(data);
          errorDiv.style.display = "block";
        }
      })
      .catch(err => {
        errorDiv.innerText = "Network error: " + err;
        errorDiv.style.display = "block";
      });
    });
  }

  // --- Forgot password: send reset code (your existing forgot password form) ---
  forgotPasswordForm.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('reset-contact').value;
    const resetCodeEmail = document.getElementById('reset-code-email');
    resetCodeEmail.value = email; // save for next step

    const msgDiv = document.getElementById('reset-code-message');
    msgDiv.innerText = ""; // clear
    try {
      const response = await fetch(window.location.origin +'/api/password_reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        showPanel('reset-code-container');
        msgDiv.innerText = "If this email exists, a reset code has been sent. Didn't get it? Click to resend.";
      } else {
        msgDiv.innerText = data.detail || "Error sending reset code. Please try again.";
      }
    } catch (err) {
      msgDiv.innerText = "Network error.";
    }
  });

  // --- Resend reset code ---
  document.getElementById('resend-code-link').onclick = async function (e) {
    e.preventDefault();
    const email = document.getElementById('reset-code-email').value;
    const msgDiv = document.getElementById('reset-code-message');
    msgDiv.innerText = "";
    if (!email) {
      msgDiv.innerText = "No email found. Please start over.";
      showPanel('forgot-password-form');
      return;
    }
    try {
      const resp = await fetch(window.location.origin +"/api/password_reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (resp.ok) {
        msgDiv.innerText = "A new reset code has been sent.";
      } else {
        msgDiv.innerText = "Error resending code. Please try again.";
      }
    } catch (err) {
      msgDiv.innerText = "Network error.";
    }
  };

  // --- Enter code form: validate code ---
  document.getElementById('reset-code-form').onsubmit = async function (e) {
    e.preventDefault();
    const email = document.getElementById('reset-code-email').value;
    const token = document.getElementById('reset-code-input').value;
    const setPasswordEmail = document.getElementById('set-password-email');
    const setPasswordToken = document.getElementById('set-password-token');
    const msgDiv = document.getElementById('reset-code-message');
    try {
      const resp = await fetch(window.location.origin +"/api/password_reset/validate_token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token })
      });
      if (resp.ok) {
        setPasswordEmail.value = email;
        setPasswordToken.value = token;
        showPanel("set-password-container");
        document.getElementById("set-password-message").innerText = "";
      } else {
        msgDiv.innerText = "Invalid code, please check and try again.";
      }
    } catch (err) {
      msgDiv.innerText = "Network error.";
    }
  };

  // --- Set new password form ---
  document.getElementById('set-password-form').onsubmit = async function (e) {
    e.preventDefault();
    const email = document.getElementById('set-password-email').value;
    const token = document.getElementById('set-password-token').value;
    const password = document.getElementById('set-password-input').value;
    const password2 = document.getElementById('set-password-confirm-input').value;
    const msgDiv = document.getElementById('set-password-message');
    msgDiv.innerText = "";

    if (password !== password2) {
      msgDiv.innerText = "Passwords do not match.";
      return;
    }
    try {
      const resp = await fetch(window.location.origin +"/api/password_reset/confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password })
      });
      if (resp.ok) {
        msgDiv.innerText = "Password reset successful! You can now log in.";
        setTimeout(() => showPanel("login-form"), 1500);
      } else {
        msgDiv.innerText = "Error resetting password. Please check your code and try again.";
      }
    } catch (err) {
      msgDiv.innerText = "Network error.";
    }
  };



  // --- Real-time validation for signup fields ---
  const fields = [
    { id: 'phone', error: 'phone-error', label: 'Phone number' },
    { id: 'signup-username', error: 'username-error', label: 'Name' },
    { id: 'signup-email', error: 'email-error', label: 'Email' },
    { id: 'signup-password', error: 'password-error', label: 'Password' },
    { id: 'signup-password2', error: 'password2-error', label: 'Confirm password' }
  ];

  function isGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
  }

  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const errorDiv = document.getElementById(f.error);
    input.addEventListener('input', function() {
      input.style.border = "";
      errorDiv.textContent = "";

      if (f.id === 'signup-email' && input.value.trim() !== "") {
        if (!isGmail(input.value.trim())) {
          input.style.border = "2px solid red";
          errorDiv.textContent = "Please use a valid Gmail address.";
        }
      }

      if (f.id === 'signup-password2') {
        const pw = document.getElementById('signup-password').value;
        if (input.value !== pw) {
          input.style.border = "2px solid red";
          errorDiv.textContent = "Passwords do not match.";
        }
      }
    });
  });

  // --- Extra validation on submit for signup (optional) ---
  document.getElementById('signup-form-main')?.addEventListener('submit', function(e) {
    e.preventDefault();
    let hasError = false;

    fields.forEach(f => {
      const input = document.getElementById(f.id);
      const errorDiv = document.getElementById(f.error);
      input.style.border = "";
      errorDiv.textContent = "";

      if (input.value.trim() === "") {
        input.style.border = "2px solid red";
        errorDiv.textContent = `This field is required.`;
        hasError = true;
      }
    });

    const emailInput = document.getElementById('signup-email');
    const emailErr = document.getElementById('email-error');
    if (emailInput.value.trim() !== "" && !isGmail(emailInput.value.trim())) {
      emailInput.style.border = "2px solid red";
      emailErr.textContent = "Please use a valid Gmail address.";
      hasError = true;
    }

    const pw = document.getElementById('signup-password').value;
    const pw2 = document.getElementById('signup-password2').value;
    const pw2Err = document.getElementById('password2-error');
    const pw2Input = document.getElementById('signup-password2');
    if (pw && pw2 && pw !== pw2) {
      pw2Input.style.border = "2px solid red";
      pw2Err.textContent = "Passwords do not match.";
      hasError = true;
    }

    if (hasError) return;

    showInfo("Ready for real registration AJAX call!");
  });

  // --- Show login by default ---
  showPanel("login-form");
});