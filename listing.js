;(function () {
  'use strict'

  function getApiBase() {
    if (window.FindBW && window.FindBW.getApiBase) return window.FindBW.getApiBase()
    if (typeof window.__FINDBW_API_BASE__ === 'string') return window.__FINDBW_API_BASE__.replace(/\/$/, '')
    var m = document.querySelector('meta[name="findbw-api-base"]')
    return m && m.getAttribute('content') ? m.getAttribute('content').replace(/\/$/, '') : ''
  }

  function formatBwp(n) {
    try {
      return new Intl.NumberFormat('en-BW', {
        style: 'currency',
        currency: 'BWP',
        maximumFractionDigits: 0,
      }).format(Number(n))
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
      case 'Sale': return 'For sale'
      case 'Rent': return 'For rent'
      case 'CommercialSale': return 'Commercial sale'
      case 'CommercialRent': return 'Commercial rent'
      default: return t || ''
    }
  }

  function waHref(phone, msg) {
    var d = String(phone || '').replace(/\D/g, '')
    if (d.startsWith('0')) d = '267' + d.slice(1)
    else if (!d.startsWith('267')) d = '267' + d
    var u = 'https://wa.me/' + d
    return msg ? u + '?text=' + encodeURIComponent(msg) : u
  }

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search)
    var id = params.get('id')
    var root = document.getElementById('listing-root')
    if (!id || !root) {
      if (root) root.innerHTML = '<p class="listing-detail-meta">Missing listing id.</p>'
      return
    }

    function loadListing() {
      var H = window.HomeFinder || window.FindBW
      if (H && H.hasSupabase && H.hasSupabase() && H.api && H.api.getListingById) {
        return H.api.getListingById(id)
      }
      if (window.FindBW) {
        return window.FindBW.fetchJson('/api/listings/' + encodeURIComponent(id), { token: false })
      }
      var base = getApiBase()
      return fetch(base + '/api/listings/' + encodeURIComponent(id)).then(function (r) {
        if (r.status === 404) throw new Error('notfound')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
    }

    loadListing().then(function (l) {
        var rent = l.listingType === 'Rent' || l.listingType === 'CommercialRent'
        var price = formatBwp(l.priceBwp) + (rent ? ' <span style="font-size:0.55em;font-weight:400;color:var(--ink-40)">/month</span>' : '')
        var wa = waHref(l.agentPhone, 'Hi ' + l.agentName + ', I saw "' + l.title + '" on HomeFinder Botswana.')
        var imgs =
          l.imageUrls && l.imageUrls.length
            ? l.imageUrls
                .map(function (u) {
                  return '<img src="' + escapeHtml(u) + '" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:8px"/>'
                })
                .join('')
            : ''

        root.innerHTML =
          '<h1 class="section-title" style="margin-bottom:8px">' +
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
          '<div class="listing-detail-price">' +
          price +
          '</div>' +
          (l.description ? '<div class="listing-detail-body">' + escapeHtmlWithBreaks(l.description) + '</div>' : '') +
          imgs +
          '<div class="listing-detail-actions">' +
          '<a class="btn-primary" href="' +
          escapeHtml(wa) +
          '" target="_blank" rel="noopener noreferrer">WhatsApp agent</a>' +
          '<a class="btn-ghost" href="index.html">← Back to listings</a>' +
          '</div>' +
          '<p class="listing-detail-meta" style="margin-top:24px"><strong>' +
          escapeHtml(l.agentName) +
          '</strong><br>' +
          escapeHtml(l.agentPhone) +
          '</p>'
      })
      .catch(function () {
        root.innerHTML =
          '<p class="listing-detail-meta">Listing not found or API unavailable. <a href="index.html">← Home</a></p>'
      })
  })
})()
