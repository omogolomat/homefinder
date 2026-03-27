/**
 * HomeFinder — listing.html (API detail when ?id=…; lightbox helpers)
 */
;(function () {
  'use strict'

  function api() {
    return window.HomeFinder || window.FindBW
  }

  function getApiBase() {
    var A = api()
    if (A && A.getApiBase) return A.getApiBase()
    var m = document.querySelector('meta[name="homefinder-api-base"]') || document.querySelector('meta[name="findbw-api-base"]')
    return m && m.getAttribute('content') ? m.getAttribute('content').replace(/\/$/, '') : ''
  }

  function formatBwp(n) {
    try {
      return new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', maximumFractionDigits: 0 }).format(
        Number(n),
      )
    } catch {
      return 'BWP ' + n
    }
  }

  function escapeHtml(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')
  }

  function escapeHtmlWithBreaks(s) {
    if (s == null) return ''
    return escapeHtml(s).replace(/\n/g, '<br/>')
  }

  function listingTypeLabel(t) {
    switch (t) {
      case 'Sale':
        return 'For sale'
      case 'Rent':
        return 'For rent'
      case 'CommercialSale':
        return 'Commercial sale'
      case 'CommercialRent':
        return 'Commercial rent'
      default:
        return t || ''
    }
  }

  function waHref(phone, msg) {
    var d = String(phone || '').replace(/\D/g, '')
    if (d.startsWith('0')) d = '267' + d.slice(1)
    else if (!d.startsWith('267')) d = '267' + d
    var u = 'https://wa.me/' + d
    return msg ? u + '?text=' + encodeURIComponent(msg) : u
  }

  window.openLightbox = function () {
    var lb = document.getElementById('lightbox')
    if (lb) {
      lb.classList.add('open')
      document.body.style.overflow = 'hidden'
    }
  }

  window.closeLightbox = function () {
    var lb = document.getElementById('lightbox')
    if (lb) {
      lb.classList.remove('open')
      document.body.style.overflow = ''
    }
  }

  window.toggleFav = function () {
    var btn = document.getElementById('favBtn')
    if (!btn) return
    if (!api() || !api().isLoggedIn()) {
      window.location.href = 'login.html?next=' + encodeURIComponent('listing.html' + window.location.search)
      return
    }
    btn.classList.toggle('active')
    var svg = btn.querySelector('svg')
    if (svg) svg.style.fill = btn.classList.contains('active') ? 'var(--orange)' : 'none'
  }

  window.switchTab = function (el, tab) {
    document.querySelectorAll('.listing-tab').forEach(function (t) {
      t.classList.remove('active')
    })
    el.classList.add('active')
    ;['description', 'features', 'location', 'details'].forEach(function (t) {
      var el2 = document.getElementById('tab-' + t)
      if (el2) el2.style.display = t === tab ? 'block' : 'none'
    })
  }

  window.toggleMore = function (btn) {
    var t = document.getElementById('more-text')
    if (!t) return
    if (t.style.display === 'none') {
      t.style.display = 'block'
      btn.textContent = 'Show less'
    } else {
      t.style.display = 'none'
      btn.textContent = 'Read more'
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeLightbox()
  })

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search)
    var id = params.get('id')
    var main = document.querySelector('.listing-main')
    if (!id || !main) return

    function loadListing() {
      var A = api()
      if (A && A.hasSupabase && A.hasSupabase() && A.api && A.api.getListingById) {
        return A.api.getListingById(id)
      }
      if (A) {
        return A.fetchJson('/api/listings/' + encodeURIComponent(id), { token: false })
      }
      return fetch(getApiBase() + '/api/listings/' + encodeURIComponent(id)).then(function (r) {
        if (r.status === 404) throw new Error('notfound')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
    }

    loadListing()
      .then(function (l) {
        var rent = l.listingType === 'Rent' || l.listingType === 'CommercialRent'
        var price =
          formatBwp(l.priceBwp) +
          (rent ? ' <span style="font-size:0.55em;font-weight:400;color:var(--ink-40)">/month</span>' : '')
        var wa = waHref(l.agentPhone, 'Hi ' + l.agentName + ', I saw "' + l.title + '" on HomeFinder Botswana.')
        var imgs =
          l.imageUrls && l.imageUrls.length
            ? l.imageUrls
                .map(function (u) {
                  return (
                    '<img src="' +
                    escapeHtml(u) +
                    '" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:8px"/>'
                  )
                })
                .join('')
            : ''

        main.innerHTML =
          '<div class="listing-card fade-up">' +
          '<h1 class="listing-title" style="margin-bottom:8px">' +
          escapeHtml(l.title) +
          '</h1>' +
          '<p class="listing-detail-meta">' +
          escapeHtml(listingTypeLabel(l.listingType)) +
          ' · ' +
          escapeHtml(l.propertyType) +
          ' · ' +
          escapeHtml(l.suburb) +
          ', ' +
          escapeHtml(l.city) +
          '</p>' +
          '<div class="listing-price" style="font-size:28px;font-weight:800;margin:16px 0">' +
          price +
          '</div>' +
          (l.description
            ? '<div class="listing-detail-body" style="margin:16px 0;line-height:1.6">' +
              escapeHtmlWithBreaks(l.description) +
              '</div>'
            : '') +
          imgs +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px">' +
          '<a class="action-btn" style="background:linear-gradient(135deg,var(--orange),var(--orange-dark));color:white;padding:12px 20px;border-radius:var(--radius-sm);font-weight:600" href="' +
          escapeHtml(wa) +
          '" target="_blank" rel="noopener noreferrer">WhatsApp agent</a>' +
          '<a class="action-btn" href="search.html" style="padding:12px 20px;border:1px solid var(--border);border-radius:var(--radius-sm)">← Back to search</a>' +
          '</div>' +
          '<p style="margin-top:24px;color:var(--ink-70)"><strong>' +
          escapeHtml(l.agentName) +
          '</strong><br>' +
          escapeHtml(l.agentPhone) +
          '</p>' +
          '</div>'
      })
      .catch(function () {
        main.innerHTML =
          '<p class="listing-detail-meta">Listing not found or unavailable. <a href="search.html">← Search</a></p>'
      })
  })
})()
