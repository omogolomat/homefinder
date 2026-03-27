/** HomeFinder — agent-profile.html */
window.addEventListener('scroll', function () {
  var nav = document.getElementById('navbar')
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20)
})

window.switchTab = function (name) {
  var tabs = ['about', 'listings', 'reviews', 'contact']
  document.querySelectorAll('.profile-tab').forEach(function (t, i) {
    t.classList.toggle('active', tabs[i] === name)
  })
  document.querySelectorAll('.tab-content').forEach(function (c) {
    c.classList.remove('active')
  })
  var panel = document.getElementById('tab-' + name)
  if (panel) panel.classList.add('active')
}

window.submitEnquiry = function (e) {
  e.preventDefault()
  var btn = e.target.querySelector('button[type="submit"]')
  if (btn) {
    btn.textContent = '✓ Message sent!'
    btn.style.background = 'linear-gradient(135deg,var(--green),var(--green-dark))'
  }
}
