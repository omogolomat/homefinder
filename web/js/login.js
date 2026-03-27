/**
 * HomeFinder — login.html (sign in + register)
 */
;(function () {
  'use strict'

  function api() {
    return window.HomeFinder || window.FindBW
  }

  function useSupabase() {
    var A = api()
    return A && typeof A.hasSupabase === 'function' && A.hasSupabase()
  }

  function switchAuthTab(tab) {
    var login = tab === 'login'
    var loginTab = document.getElementById('loginTab')
    var registerTab = document.getElementById('registerTab')
    var loginForm = document.getElementById('loginForm')
    var registerForm = document.getElementById('registerForm')
    if (loginTab) loginTab.classList.toggle('active', login)
    if (registerTab) registerTab.classList.toggle('active', !login)
    if (loginForm) loginForm.style.display = login ? 'block' : 'none'
    if (registerForm) registerForm.style.display = login ? 'none' : 'block'
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', login ? 'login.html' : 'login.html?tab=register')
    }
  }
  window.switchAuthTab = switchAuthTab

  function togglePwd(id, btn) {
    var inp = document.getElementById(id)
    if (!inp || !btn) return
    inp.type = inp.type === 'password' ? 'text' : 'password'
    btn.textContent = inp.type === 'password' ? 'Show' : 'Hide'
  }
  window.togglePwd = togglePwd

  function selectRole(el) {
    document.querySelectorAll('.role-btn').forEach(function (b) {
      b.classList.remove('active')
    })
    el.classList.add('active')
  }
  window.selectRole = selectRole

  function checkStrength(inp) {
    var v = inp.value
    var s = 0
    if (v.length >= 8) s += 25
    if (/[A-Z]/.test(v)) s += 25
    if (/[0-9]/.test(v)) s += 25
    if (/[^A-Za-z0-9]/.test(v)) s += 25
    var bar = document.getElementById('strengthFill')
    if (!bar) return
    bar.style.width = s + '%'
    bar.style.background = s < 50 ? '#E24B4A' : s < 75 ? 'var(--orange)' : 'var(--green)'
  }
  window.checkStrength = checkStrength

  function safeDecodeNext(next) {
    if (!next || typeof next !== 'string') return null
    try {
      return decodeURIComponent(next)
    } catch {
      return null
    }
  }

  function isSafeRelativeUrl(href) {
    if (!href || typeof href !== 'string') return false
    if (href.indexOf('//') === 0) return false
    if (href.indexOf(':') >= 0 && !/^[\w-]+\.html/i.test(href.split(':')[0])) return false
    return /^[\w./?#&=%-]+$/i.test(href) && href.indexOf('javascript:') !== 0
  }

  function postLoginRedirect(role) {
    if (role === 'Agent' || role === 'Admin') window.location.href = 'dashboard.html'
    else {
      var ref = document.referrer
      if (ref && ref.indexOf('login.html') < 0) window.location.href = ref
      else window.location.href = 'search.html'
    }
  }
  window.postLoginRedirect = postLoginRedirect

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'register' || window.location.hash === '#register' || params.get('register')) {
      switchAuthTab('register')
    }
    if (params.get('role') === 'agent') {
      switchAuthTab('register')
      setTimeout(function () {
        var btns = document.querySelectorAll('.role-btn')
        if (btns.length > 1) {
          btns.forEach(function (b) {
            b.classList.remove('active')
          })
          btns[1].classList.add('active')
        }
      }, 50)
    }

    var loginForm = document.getElementById('hf-login-form')
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault()
        var err = document.getElementById('hf-login-err')
        var submitBtn = loginForm.querySelector('button[type="submit"]')
        if (err) {
          err.textContent = ''
          err.style.display = 'none'
        }
        var email = (document.getElementById('loginEmail') || {}).value
        var password = (document.getElementById('loginPwd') || {}).value
        if (!email || !password) return
        var A = api()
        if (!A) return

        var busy = function (on) {
          if (submitBtn) {
            submitBtn.disabled = on
            submitBtn.setAttribute('aria-busy', on ? 'true' : 'false')
          }
        }
        busy(true)

        function finishLogin(role) {
          busy(false)
          var next = params.get('next')
          var decoded = safeDecodeNext(next)
          if (decoded && isSafeRelativeUrl(decoded)) {
            window.location.href = decoded
          } else if (next && isSafeRelativeUrl(next)) {
            window.location.href = next
          } else {
            postLoginRedirect(role)
          }
        }

        if (useSupabase()) {
          A.auth
            .login(email.trim(), password)
            .then(function () {
              var role = A.auth.getRole()
              finishLogin(role)
            })
            .catch(function (ex) {
              busy(false)
              if (err) {
                err.textContent = ex.message || 'Sign in failed.'
                err.style.display = 'block'
              }
            })
          return
        }

        A.fetchJson('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password: password }),
          token: false,
        })
          .then(function (res) {
            A.setSession(res.accessToken, {
              fullName: res.fullName,
              email: res.email,
              role: res.role,
              userId: res.userId,
            })
            busy(false)
            var next = params.get('next')
            var decoded = safeDecodeNext(next)
            if (decoded && isSafeRelativeUrl(decoded)) window.location.href = decoded
            else if (next && isSafeRelativeUrl(next)) window.location.href = next
            else postLoginRedirect(res.role)
          })
          .catch(function (ex) {
            busy(false)
            if (err) {
              err.textContent = ex.message || 'Sign in failed.'
              err.style.display = 'block'
            }
          })
      })
    }

    var regForm = document.getElementById('hf-register-form')
    if (regForm) {
      regForm.addEventListener('submit', function (e) {
        e.preventDefault()
        var err = document.getElementById('hf-register-err')
        var submitBtn = regForm.querySelector('button[type="submit"]')
        if (err) {
          err.textContent = ''
          err.style.display = 'none'
        }
        var fn = (document.getElementById('regFirst') || {}).value || ''
        var ln = (document.getElementById('regLast') || {}).value || ''
        var fullName = (fn + ' ' + ln).trim()
        var email = (document.getElementById('regEmail') || {}).value || ''
        var phone = (document.getElementById('regPhone') || {}).value || ''
        var password = (document.getElementById('regPwd') || {}).value || ''
        var agentBtn = document.querySelectorAll('.role-btn')[1]
        var wantsAgent = agentBtn && agentBtn.classList.contains('active')
        if (wantsAgent) {
          if (err) {
            err.textContent =
              'Agent accounts are created by HomeFinder after verification. Please email agents@homefinder.co.bw or use Buyer / Tenant for now.'
            err.style.display = 'block'
          }
          return
        }
        var A = api()
        if (!A) return

        var busy = function (on) {
          if (submitBtn) {
            submitBtn.disabled = on
            submitBtn.setAttribute('aria-busy', on ? 'true' : 'false')
          }
        }
        busy(true)

        if (useSupabase()) {
          A.auth
            .register(email.trim(), password, {
              fullName: fullName,
              phone: phone.trim(),
            })
            .then(function (data) {
              busy(false)
              if (data && data.session) {
                window.location.href = 'search.html'
              } else {
                if (err) {
                  err.textContent =
                    'Check your email to confirm your account, then you can sign in.'
                  err.style.display = 'block'
                }
              }
            })
            .catch(function (ex) {
              busy(false)
              if (err) {
                err.textContent = ex.message || 'Registration failed.'
                err.style.display = 'block'
              }
            })
          return
        }

        A.fetchJson('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            fullName: fullName,
            email: email.trim(),
            phoneNumber: phone.trim(),
            password: password,
            role: 'Buyer',
            whatsAppOptIn: true,
          }),
          token: false,
        })
          .then(function (res) {
            A.setSession(res.accessToken, {
              fullName: res.fullName,
              email: res.email,
              role: res.role,
              userId: res.userId,
            })
            busy(false)
            window.location.href = 'search.html'
          })
          .catch(function (ex) {
            busy(false)
            if (err) {
              err.textContent = ex.message || 'Registration failed.'
              err.style.display = 'block'
            }
          })
      })
    }
  })
})()
