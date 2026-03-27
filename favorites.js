document.addEventListener('DOMContentLoaded', function () {
  var root = document.getElementById('fav-root')
  var empty = document.getElementById('fav-empty')
  if (!root || !window.FindBW) return

  function A() {
    return window.HomeFinder || window.FindBW
  }

  function formatBwp(n) {
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
      maximumFractionDigits: 0,
    }).format(Number(n))
  }

  function escapeHtml(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')
  }

  function loadFavorites() {
    root.innerHTML = ''

    if (!A().isLoggedIn()) {
      empty.textContent = 'Sign in to see favourites.'
      empty.hidden = false
      return
    }

    empty.textContent = 'Loading favourites…'
    empty.hidden = false

    A()
      .fetchJson('/api/favorites')
      .then(function (data) {
        var ids = (data && (data.listingIds || data.ListingIds)) || []
        if (!ids.length) {
          empty.textContent = 'No favourites yet — use the heart on a listing.'
          empty.hidden = false
          return Promise.resolve('skip')
        }
        return Promise.all(
          ids.map(function (id) {
            return A()
              .fetchJson('/api/listings/' + encodeURIComponent(id), {
                token: false,
              })
              .catch(function () {
                return null
              })
          }),
        )
      })
      .then(function (rows) {
        if (rows === 'skip') return
        var list = (rows || []).filter(Boolean)
        if (!list.length) {
          empty.textContent = 'No saved listings to show — they may have been removed.'
          empty.hidden = false
          return
        }
        empty.hidden = true
        root.innerHTML = list
          .map(function (l) {
            var rent = l.listingType === 'Rent' || l.listingType === 'CommercialRent'
            var price = formatBwp(l.priceBwp) + (rent ? ' <span>/month</span>' : '')
            return (
              '<article class="prop-card fade-up">' +
              '<div class="prop-body">' +
              '<div class="prop-price">' +
              price +
              '</div>' +
              '<div class="prop-name"><a class="prop-card-title-link" href="listing.html?id=' +
              escapeHtml(l.id) +
              '">' +
              escapeHtml(l.title) +
              '</a></div>' +
              '<div class="prop-location">' +
              escapeHtml(l.suburb) +
              ', ' +
              escapeHtml(l.city) +
              '</div></div></article>'
            )
          })
          .join('')
      })
      .catch(function () {
        empty.textContent =
          'Could not load favourites. Ensure Supabase is configured or the legacy API is running.'
        empty.hidden = false
      })
  }

  loadFavorites()
  window.addEventListener('homefinder-auth-change', loadFavorites)
  window.addEventListener('findbw-auth-change', loadFavorites)
})
