document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('register-form')
  var err = document.getElementById('form-err')
  var submitBtn = form && form.querySelector('button[type="submit"]')
  if (!form || !window.FindBW) return

  function useSupabase() {
    var A = window.HomeFinder || window.FindBW
    return A && typeof A.hasSupabase === 'function' && A.hasSupabase()
  }

  function busy(on) {
    if (submitBtn) {
      submitBtn.disabled = on
      submitBtn.setAttribute('aria-busy', on ? 'true' : 'false')
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    err.hidden = true
    var A = window.HomeFinder || window.FindBW
    busy(true)

    if (useSupabase()) {
      A.auth
        .register(document.getElementById('email').value.trim(), document.getElementById('password').value, {
          fullName: document.getElementById('fullName').value.trim(),
          phone: document.getElementById('phone').value.trim(),
        })
        .then(function (data) {
          busy(false)
          if (data && data.session) window.location.href = 'index.html'
          else {
            err.textContent = 'Check your email to confirm your account, then sign in.'
            err.hidden = false
          }
        })
        .catch(function (ex) {
          busy(false)
          err.textContent = ex.message || 'Registration failed.'
          err.hidden = false
        })
      return
    }

    var body = {
      fullName: document.getElementById('fullName').value.trim(),
      phoneNumber: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      role: 'Buyer',
      whatsAppOptIn: document.getElementById('wa').checked,
    }

    window.FindBW
      .fetchJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
        token: false,
      })
      .then(function (res) {
        window.FindBW.setSession(res.accessToken, {
          fullName: res.fullName,
          email: res.email,
          role: res.role,
          userId: res.userId,
        })
        busy(false)
        window.location.href = 'index.html'
      })
      .catch(function (ex) {
        busy(false)
        err.textContent = ex.message || 'Registration failed.'
        err.hidden = false
      })
  })
})
