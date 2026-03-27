document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('pay-form')
  var err = document.getElementById('form-err')
  var ok = document.getElementById('form-ok')
  var gateSignin = document.getElementById('payments-gate-signin')
  var gateBuyer = document.getElementById('payments-gate-buyer')
  var formRoot = document.getElementById('payments-form-root')
  if (!form || !window.FindBW) return

  function A() {
    return window.HomeFinder || window.FindBW
  }

  function isAgent() {
    var u = A().getUser()
    return Boolean(u && (u.role === 'Agent' || u.role === 'Admin'))
  }

  function showGate() {
    if (!A().isLoggedIn()) {
      if (gateSignin) gateSignin.hidden = false
      if (gateBuyer) gateBuyer.hidden = true
      if (formRoot) formRoot.hidden = true
      if (err) err.hidden = true
      return
    }
    if (!isAgent()) {
      if (gateSignin) gateSignin.hidden = true
      if (gateBuyer) gateBuyer.hidden = false
      if (formRoot) formRoot.hidden = true
      if (err) err.hidden = true
      return
    }
    if (gateSignin) gateSignin.hidden = true
    if (gateBuyer) gateBuyer.hidden = true
    if (formRoot) formRoot.hidden = false
  }

  showGate()
  window.addEventListener('findbw-auth-change', showGate)
  window.addEventListener('homefinder-auth-change', showGate)

  if (!A().isLoggedIn() || !isAgent()) return

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    err.hidden = true
    ok.hidden = true
    var amount = Number(document.getElementById('amount').value)
    var provider = document.getElementById('provider').value
    var submitBtn = form.querySelector('button[type="submit"]')
    function busy(on) {
      if (submitBtn) {
        submitBtn.disabled = on
        submitBtn.setAttribute('aria-busy', on ? 'true' : 'false')
      }
    }
    busy(true)

    A()
      .fetchJson('/api/payments/intent', {
        method: 'POST',
        body: JSON.stringify({
          amountBwp: amount,
          provider: provider,
          purpose: 'Agent advertising / subscription',
        }),
      })
      .then(function (res) {
        busy(false)
        ok.textContent =
          (res && res.message ? res.message + ' ' : '') +
          'Reference: ' +
          (res && res.transactionId ? res.transactionId : '')
        ok.hidden = false
      })
      .catch(function (ex) {
        busy(false)
        var msg = (ex && ex.message) || 'Request failed.'
        if (
          A().hasSupabase &&
          A().hasSupabase() &&
          /HTML instead of JSON|Failed to fetch|NetworkError|load failed/i.test(msg)
        ) {
          msg =
            'Payment intents are not implemented in Supabase-only mode. Set meta homefinder-api-base to your payment API, or add an Edge Function.'
        }
        err.textContent = msg
        err.hidden = false
      })
  })
})
