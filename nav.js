/**
 * Nav + hero greeting when session changes. Requires core.js.
 * Uses .nav-cluster--guest | --buyer | --agent (Buyer = logged-in non-agent).
 */
;(function () {
  function setHidden(els, hidden) {
    ;(els || []).forEach(function (el) {
      if (el) el.hidden = hidden
    })
  }

  function isAgentUser(user) {
    return Boolean(user && (user.role === 'Agent' || user.role === 'Admin'))
  }

  function updateHeroGreeting() {
    var el = document.getElementById('heroGreeting')
    if (!el) return
    var api = window.HomeFinder || window.FindBW
    var user = api && api.getUser()
    if (api && api.isLoggedIn() && user && user.fullName) {
      el.textContent = 'Dumela, ' + user.fullName + ' — how are you?'
      el.hidden = false
    } else {
      el.textContent = ''
      el.hidden = true
    }
  }

  function refresh() {
    var api = window.HomeFinder || window.FindBW
    var loggedIn = api && api.isLoggedIn()
    var user = api && api.getUser()

    var guest = document.querySelectorAll('.nav-cluster--guest')
    var buyer = document.querySelectorAll('.nav-cluster--buyer')
    var agent = document.querySelectorAll('.nav-cluster--agent')

    if (guest.length || buyer.length || agent.length) {
      var showGuest = !loggedIn
      var showBuyer = loggedIn && !isAgentUser(user)
      var showAgent = loggedIn && isAgentUser(user)
      setHidden(Array.prototype.slice.call(guest), !showGuest)
      setHidden(Array.prototype.slice.call(buyer), !showBuyer)
      setHidden(Array.prototype.slice.call(agent), !showAgent)
    } else {
      setHidden(document.querySelectorAll('.nav-signin'), loggedIn)
      setHidden(document.querySelectorAll('.nav-register'), loggedIn)
      setHidden(document.querySelectorAll('.nav-signout'), !loggedIn)
      setHidden(document.querySelectorAll('.nav-fav'), !loggedIn)
      setHidden(document.querySelectorAll('.nav-payments'), !loggedIn || !isAgentUser(user))
    }

    updateHeroGreeting()
  }

  function bindSignOut() {
    document.querySelectorAll('.nav-signout').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var x = window.HomeFinder || window.FindBW
        if (x) x.clearSession()
        window.location.href = 'index.html'
      })
    })
  }

  document.addEventListener('DOMContentLoaded', function () {
    refresh()
    bindSignOut()
  })
  window.addEventListener('homefinder-auth-change', refresh)
  window.addEventListener('findbw-auth-change', refresh)
})()
