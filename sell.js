/**
 * HomeFinder — sell.html (auth from JWT via HomeFinder core)
 */
;(function () {
  'use strict'

  function api() {
    return window.HomeFinder || window.FindBW
  }

  function initialsFrom(name) {
    if (!name) return '?'
    var p = String(name).trim().split(/\s+/)
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase()
    return (p[0][0] + p[p.length - 1][0]).toUpperCase()
  }

  function getSessionUser() {
    var A = api()
    if (!A || !A.isLoggedIn()) return null
    var u = A.getUser()
    if (!u) return null
    var name = u.fullName || u.email || 'User'
    var role = u.role === 'Agent' || u.role === 'Admin' ? 'agent' : 'buyer'
    return { name: name, initials: initialsFrom(name), role: role }
  }

  function authState() {
    var u = getSessionUser()
    if (!u) return { user: null, isLoggedIn: false, isAgent: false, isBuyer: false }
    return {
      user: u,
      isLoggedIn: true,
      isAgent: u.role === 'agent',
      isBuyer: u.role === 'buyer',
    }
  }

  window.addEventListener('scroll', function () {
    var nav = document.getElementById('navbar')
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20)
  })

  window.renderNav = function () {
    var s = authState()
    var nav = document.getElementById('navActions')
    var mob = document.getElementById('mobileNavActions')
    if (!nav) return
    var u = s.user
    if (s.isLoggedIn && u) {
      var roleClass = s.isAgent ? 'role-agent' : 'role-buyer'
      var roleLabel = s.isAgent ? 'Agent' : 'Buyer'
      var dashLink = s.isAgent ? 'dashboard.html' : 'search.html'
      nav.innerHTML =
        '<a href="' +
        dashLink +
        '" class="nav-user-pill">' +
        '<div class="nav-user-avatar">' +
        u.initials +
        '</div>' +
        '<span class="nav-user-name">' +
        u.name +
        '</span>' +
        '<span class="nav-user-role ' +
        roleClass +
        '">' +
        roleLabel +
        '</span></a>'
      if (mob) {
        mob.innerHTML =
          '<a href="' +
          dashLink +
          '" class="btn-primary" style="text-align:center;justify-content:center;padding:14px">' +
          (s.isAgent ? 'Dashboard' : 'My Account') +
          '</a>'
      }
    } else {
      nav.innerHTML =
        '<a href="login.html" class="btn-ghost">Sign in</a>' +
        '<a href="login.html?tab=register" class="btn-primary">List Property</a>'
      if (mob) {
        mob.innerHTML =
          '<a href="login.html" class="btn-ghost" style="text-align:center">Sign in</a>' +
          '<a href="login.html?tab=register" class="btn-primary" style="text-align:center;justify-content:center;padding:14px">List Property</a>'
      }
    }
  }

  window.switchPanel = function (panel) {
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.remove('active')
    })
    var pc = document.getElementById('panelCustomer')
    var pa = document.getElementById('panelAgent')
    var tc = document.getElementById('tabCustomer')
    var ta = document.getElementById('tabAgent')
    if (pc) pc.classList.toggle('active', panel === 'customer')
    if (pa) pa.classList.toggle('active', panel === 'agent')
    if (tc) tc.classList.toggle('active', panel === 'customer')
    if (ta) ta.classList.toggle('active', panel === 'agent')
    if (panel === 'agent') window.renderAgentPanel()
  }

  window.renderAgentPanel = function () {
    var s = authState()
    var gate = document.getElementById('authGate')
    var form = document.getElementById('listingForm')
    var buyerNote = document.getElementById('buyerNotice')
    if (!gate || !form) return
    if (!s.isLoggedIn) {
      gate.style.display = 'block'
      form.style.display = 'none'
      if (buyerNote) buyerNote.style.display = 'none'
    } else if (s.isBuyer) {
      gate.style.display = 'none'
      form.style.display = 'none'
      if (buyerNote) buyerNote.style.display = 'block'
    } else if (s.isAgent) {
      gate.style.display = 'none'
      form.style.display = 'block'
      if (buyerNote) buyerNote.style.display = 'none'
      var nameEl = document.getElementById('formAgentName')
      if (nameEl && s.user) nameEl.textContent = 'Posting as ' + s.user.name
    }
  }

  window.handleListingClick = function (e) {
    var s = authState()
    if (!s.isLoggedIn) {
      e.preventDefault()
      window.showAuthModal()
      return
    }
    if (s.isBuyer) {
      e.preventDefault()
      window.switchPanel('agent')
      return
    }
  }

  var currentStep = 1
  window.goToStep = function (n) {
    var cur = document.getElementById('step' + currentStep)
    var nxt = document.getElementById('step' + n)
    if (cur) cur.classList.remove('active')
    if (nxt) nxt.classList.add('active')
    window.updateProgress(currentStep, n)
    currentStep = n
    var lf = document.getElementById('listingForm')
    if (lf) lf.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  window.updateProgress = function (from, to) {
    for (var i = 1; i <= 4; i++) {
      var dot = document.getElementById('dot' + i)
      var lbl = document.getElementById('lbl' + i)
      if (!dot || !lbl) continue
      if (i < to) {
        dot.className = 'ps-dot done'
        dot.innerHTML = '✓'
        lbl.className = 'ps-label done'
      } else if (i === to) {
        dot.className = 'ps-dot active'
        dot.textContent = String(i)
        lbl.className = 'ps-label active'
      } else {
        dot.className = 'ps-dot pending'
        dot.textContent = String(i)
        lbl.className = 'ps-label pending'
      }
    }
  }

  window.submitListing = function () {
    var s4 = document.getElementById('step4')
    var fp = document.getElementById('formProgress')
    var ok = document.getElementById('submitSuccess')
    if (s4) s4.style.display = 'none'
    if (fp) fp.style.display = 'none'
    if (ok) ok.classList.add('show')
  }

  window.handleFileSelect = function (input) {
    var previews = document.getElementById('photoPreviews')
    if (!previews || !input.files) return
    Array.prototype.slice.call(input.files, 0, 10).forEach(function (f, i) {
      var div = document.createElement('div')
      div.className = 'photo-preview'
      var img = document.createElement('div')
      img.className = 'photo-preview-img'
      img.style.background = 'linear-gradient(' + (120 + i * 25) + 'deg, var(--blue-mid), var(--green))'
      var rm = document.createElement('div')
      rm.className = 'photo-remove'
      rm.textContent = '✕'
      rm.onclick = function () {
        div.remove()
      }
      div.appendChild(img)
      div.appendChild(rm)
      previews.appendChild(div)
    })
  }

  window.handleDrop = function (e) {
    e.preventDefault()
    var uz = document.getElementById('uploadZone')
    if (uz) uz.classList.remove('dragging')
    var dt = e.dataTransfer
    if (dt && dt.files.length) window.handleFileSelect({ files: dt.files })
  }

  window.selectPlan = function (el) {
    document.querySelectorAll('.pricing-opt').forEach(function (o) {
      o.classList.remove('selected')
    })
    el.classList.add('selected')
  }

  window.toggleFaq = function (el) {
    var item = el.parentElement
    if (item) item.classList.toggle('open')
  }

  window.showAuthModal = function () {
    var o = document.getElementById('authOverlay')
    if (o) o.classList.add('show')
  }

  window.closeModal = function (e) {
    if (e.target === document.getElementById('authOverlay')) {
      document.getElementById('authOverlay').classList.remove('show')
    }
  }

  var selectedModalRole = 'buyer'
  window.selectModalRole = function (role) {
    selectedModalRole = role
    var b = document.getElementById('modalRoleBuyer')
    var a = document.getElementById('modalRoleAgent')
    if (b) b.classList.toggle('selected', role === 'buyer')
    if (a) a.classList.toggle('selected', role === 'agent')
    var btn = document.getElementById('modalBtn')
    if (btn) {
      btn.href = 'login.html?tab=register&role=' + role
      btn.textContent = role === 'agent' ? 'Register as Agent →' : 'Create Buyer Account →'
    }
  }

  window.submitSellerEnquiry = function (e) {
    e.preventDefault()
    var btn = e.target.querySelector('button[type="submit"]')
    if (btn) {
      btn.textContent = '✓ Request sent! Agents will contact you shortly.'
      btn.style.background = 'linear-gradient(135deg,var(--green),var(--green-dark))'
      btn.disabled = true
    }
  }

  window.scrollToSection = function (id) {
    setTimeout(function () {
      var el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  document.addEventListener('DOMContentLoaded', function () {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.style.animationPlayState = 'running'
        })
      },
      { threshold: 0.1 },
    )
    document.querySelectorAll('.fade-up').forEach(function (el) {
      el.style.animationPlayState = 'paused'
      obs.observe(el)
    })

    var params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'agent') window.switchPanel('agent')

    window.renderNav()
    window.renderAgentPanel()

    var s = authState()
    if (s.isLoggedIn && s.isAgent) {
      var badge = document.getElementById('listBadge')
      if (badge) {
        badge.textContent = 'List Now'
        badge.className = 'path-badge badge-recommended'
      }
    }

    window.addEventListener('homefinder-auth-change', function () {
      window.renderNav()
      window.renderAgentPanel()
    })
    window.addEventListener('findbw-auth-change', function () {
      window.renderNav()
      window.renderAgentPanel()
    })
  })
})()
