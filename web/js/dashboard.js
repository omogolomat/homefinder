/**
 * HomeFinder — dashboard.html
 */
window.showSection = function (name) {
  var sections = ['overview', 'listings', 'messages', 'new', 'analytics']
  sections.forEach(function (s) {
    var el = document.getElementById('section-' + s)
    if (el) el.style.display = s === name ? 'block' : 'none'
  })
  var titles = {
    overview: 'Overview',
    listings: 'My Listings',
    messages: 'Messages',
    new: 'New Listing',
    analytics: 'Analytics',
  }
  var top = document.getElementById('topbarTitle')
  if (top) top.textContent = titles[name] || name
  document.querySelectorAll('.sidebar-link').forEach(function (l) {
    l.classList.remove('active')
  })
}
