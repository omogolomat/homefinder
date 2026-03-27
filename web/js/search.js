/**
 * HomeFinder — search.html (listings + filters UI)
 */
;(function () {
  'use strict'

  function api() {
    return window.HomeFinder || window.FindBW
  }

  function escapeHtml(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')
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

  var state = { listingType: null, q: '', city: 'Gaborone' }

  function fetchListings() {
    var A = api()
    if (!A) return Promise.reject(new Error('App not ready'))
    if (A.hasSupabase && A.hasSupabase() && A.api && A.api.getListings) {
      return A.api.getListings({
        page: 1,
        pageSize: 24,
        city: state.city,
        listingType: state.listingType || undefined,
        q: state.q && state.q.trim() ? state.q.trim() : undefined,
      })
    }
    var params = new URLSearchParams()
    params.set('page', '1')
    params.set('pageSize', '24')
    if (state.city) params.set('city', state.city)
    if (state.listingType) params.set('listingType', state.listingType)
    if (state.q && state.q.trim()) params.set('q', state.q.trim())
    return fetch(A.getApiBase() + '/api/listings?' + params.toString()).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    })
  }

  function syncSearchUrl() {
    var p = new URLSearchParams()
    if (state.listingType) {
      var map = { Sale: 'sale', Rent: 'rent', CommercialSale: 'commercial', CommercialRent: 'commercial' }
      p.set('type', map[state.listingType] || 'sale')
    }
    if (state.city && state.city !== 'Gaborone') p.set('city', state.city)
    if (state.q && state.q.trim()) p.set('q', state.q.trim())
    var qs = p.toString()
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', 'search.html' + (qs ? '?' + qs : ''))
    }
  }

  function cardHtml(item, i) {
    var rent = item.listingType === 'Rent' || item.listingType === 'CommercialRent'
    var price = formatBwp(item.priceBwp) + (rent ? ' <span>/mo</span>' : '')
    var beds = item.bedrooms != null ? String(item.bedrooms) : '—'
    var imgBg = item.primaryImageUrl
      ? '<div class="prop-card-img-bg" style="position:absolute;inset:0;background:#1a2a3a"><img src="' +
        escapeHtml(item.primaryImageUrl) +
        '" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>'
      : '<div class="prop-card-img-bg img-' + (1 + (i % 8)) + '"></div>'
    return (
      '<div class="prop-card fade-up" data-listing-id="' +
      escapeHtml(item.id) +
      '" onclick="location.href=\'listing.html?id=' +
      escapeHtml(item.id) +
      '\'">' +
      '<div class="prop-card-img">' +
      imgBg +
      '<span class="prop-badge ' +
      (rent ? 'badge-rent' : 'badge-sale') +
      '">' +
      (rent ? 'For Rent' : 'For Sale') +
      '</span>' +
      '<button type="button" class="prop-fav" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>' +
      '</div>' +
      '<div class="prop-body">' +
      '<div class="prop-price">' +
      price +
      '</div>' +
      '<div class="prop-name">' +
      escapeHtml(item.title) +
      '</div>' +
      '<div class="prop-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>' +
      escapeHtml(item.suburb) +
      ', ' +
      escapeHtml(item.city) +
      '</div>' +
      '<div class="prop-specs">' +
      '<div class="prop-spec"><div class="prop-spec-val">' +
      beds +
      '</div><div class="prop-spec-lbl">Beds</div></div>' +
      '</div></div></div>'
    )
  }

  function hydrate() {
    var grid = document.getElementById('propGrid')
    var countEl = document.querySelector('.results-count span')
    if (!grid) return
    grid.innerHTML = '<p class="results-count" aria-live="polite">Loading listings…</p>'
    if (countEl) countEl.textContent = '…'

    fetchListings()
      .then(function (data) {
        syncSearchUrl()
        var items = (data && data.items) || []
        if (items.length === 0) {
          grid.innerHTML = '<p class="results-count">No listings match — try widening your search.</p>'
          if (countEl) countEl.textContent = '0'
          return
        }
        grid.innerHTML = items.map(cardHtml).join('')
        if (countEl) countEl.textContent = String(data.totalCount != null ? data.totalCount : items.length)
        initFavClicks()
      })
      .catch(function () {
        grid.innerHTML =
          '<p class="results-count">Could not load listings. Configure Supabase (supabase-url / supabase-anon-key) or run the legacy API.</p>'
        if (countEl) countEl.textContent = '—'
      })
  }

  function initFavClicks() {
    document.querySelectorAll('#propGrid .prop-fav').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation()
        var svg = btn.querySelector('svg')
        if (!svg) return
        if (!api() || !api().isLoggedIn()) {
          window.location.href = 'login.html?next=' + encodeURIComponent('search.html')
          return
        }
        var card = btn.closest('.prop-card')
        var id = card && card.getAttribute('data-listing-id')
        var on = btn.dataset.active === '1'
        var wantAdd = !on
        if (id && api().fetchJson) {
          api()
            .fetchJson('/api/favorites/' + encodeURIComponent(id), {
              method: wantAdd ? 'POST' : 'DELETE',
              token: true,
            })
            .then(function () {
              btn.dataset.active = wantAdd ? '1' : '0'
              svg.style.fill = wantAdd ? '#F47B20' : 'none'
              svg.style.stroke = wantAdd ? '#F47B20' : 'var(--ink-40)'
            })
            .catch(function () {})
          return
        }
        btn.dataset.active = wantAdd ? '1' : '0'
        svg.style.fill = wantAdd ? '#F47B20' : 'none'
        svg.style.stroke = wantAdd ? '#F47B20' : 'var(--ink-40)'
      })
    })
  }

  window.setTab = function (el) {
    document.querySelectorAll('.search-tab').forEach(function (t) {
      t.classList.remove('active')
    })
    el.classList.add('active')
    var label = (el.textContent || '').trim()
    if (label === 'Buy') state.listingType = 'Sale'
    else if (label === 'Rent') state.listingType = 'Rent'
    else if (label === 'Commercial') state.listingType = 'CommercialSale'
    hydrate()
  }

  window.setView = function (v) {
    var grid = document.getElementById('propGrid')
    var gBtn = document.getElementById('gridBtn')
    var lBtn = document.getElementById('listBtn')
    if (!grid) return
    if (v === 'list') {
      grid.classList.add('list-view')
      if (lBtn) lBtn.classList.add('active')
      if (gBtn) gBtn.classList.remove('active')
    } else {
      grid.classList.remove('list-view')
      if (gBtn) gBtn.classList.add('active')
      if (lBtn) lBtn.classList.remove('active')
    }
  }

  window.toggleChip = function (el) {
    el.classList.toggle('active')
  }

  window.toggleBed = function (el) {
    var parent = el.parentElement
    parent.querySelectorAll('.bed-btn').forEach(function (b) {
      b.classList.remove('active')
    })
    el.classList.add('active')
  }

  window.clearFilters = function () {
    document.querySelectorAll('.filter-chip-sm,.bed-btn').forEach(function (el) {
      el.classList.remove('active')
    })
    document.querySelectorAll('.active-filter-tag').forEach(function (el) {
      el.remove()
    })
  }

  window.activatePage = function (el) {
    document.querySelectorAll('.page-btn').forEach(function (b) {
      b.classList.remove('active')
    })
    el.classList.add('active')
  }

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search)
    var t = (params.get('type') || '').toLowerCase()
    if (t === 'sale') state.listingType = 'Sale'
    else if (t === 'rent') state.listingType = 'Rent'
    else if (t === 'commercial') state.listingType = 'CommercialSale'
    if (params.get('city')) state.city = params.get('city')
    if (params.get('q')) state.q = params.get('q')
    var inp = document.getElementById('searchQueryInput')
    if (inp && state.q) inp.value = state.q

    var run = document.getElementById('searchRunBtn')
    if (run && inp) {
      run.addEventListener('click', function () {
        state.q = (inp.value || '').trim()
        hydrate()
      })
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault()
          state.q = (inp.value || '').trim()
          hydrate()
        }
      })
    }

    hydrate()
  })
})()
