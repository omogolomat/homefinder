/**
 * Legacy standalone sign-in (if used). Prefer login.html + login.js.
 */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('signin-form')
  var err = document.getElementById('form-err')
  var submitBtn = form && form.querySelector('button[type="submit"]')
  if (!form || !window.FindBW) return

  function A() {
    return window.HomeFinder || window.FindBW
  }

  function useSupabase() {
    return A() && typeof A().hasSupabase === 'function' && A().hasSupabase()
  }

  function safeNext(raw) {
    if (!raw || typeof raw !== 'string') return 'index.html'
    try {
      var d = decodeURIComponent(raw)
      if (d.indexOf('//') === 0 || d.indexOf('javascript:') === 0) return 'index.html'
      return d
    } catch {
      return raw.indexOf('//') === 0 ? 'index.html' : raw
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    err.hidden = true
    var email = document.getElementById('email').value.trim()
    var password = document.getElementById('password').value

    function busy(on) {
      if (submitBtn) {
        submitBtn.disabled = on
        submitBtn.setAttribute('aria-busy', on ? 'true' : 'false')
      }
    }
    busy(true)

    if (useSupabase()) {
      A()
        .auth.login(email, password)
        .then(function () {
          busy(false)
          var raw = new URLSearchParams(window.location.search).get('next') || 'index.html'
          window.location.href = safeNext(raw)
        })
        .catch(function (ex) {
          busy(false)
          err.textContent = (ex && ex.message) || 'Sign in failed.'
          err.hidden = false
        })
      return
    }

    window.FindBW
      .fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password }),
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
        var raw = new URLSearchParams(window.location.search).get('next') || 'index.html'
        window.location.href = safeNext(raw)
      })
      .catch(function (ex) {
        busy(false)
        err.textContent = ex.message || 'Sign in failed.'
        err.hidden = false
      })
  })
})
