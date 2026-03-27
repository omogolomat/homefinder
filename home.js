/**
 * HomeFinder — index.html (requires js/core.js before this file)
 */
;(function () {
  'use strict'

  function apiBase() {
    var hf = window.HomeFinder || window.FindBW
    return hf ? hf.getApiBase() : ''
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

  function listingBadge(listingType) {
    switch (listingType) {
      case 'Sale':
        return { cls: 'badge-sale', text: 'For Sale' }
      case 'Rent':
        return { cls: 'badge-rent', text: 'For Rent' }
      case 'CommercialSale':
        return { cls: 'badge-sale', text: 'Commercial · Sale' }
      case 'CommercialRent':
        return { cls: 'badge-rent', text: 'Commercial · Rent' }
      default:
        return { cls: 'badge-sale', text: 'Listing' }
    }
  }

  var GRADIENTS = [
    'img-gaborone-1',
    'img-gaborone-2',
    'img-gaborone-3',
    'img-gaborone-4',
    'img-gaborone-5',
    'img-gaborone-6',
  ]

  var LOC_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>'

  var HEART_SVG =
    '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'

  function houseIcon() {
    return '<svg class="prop-card-img-icon" viewBox="0 0 80 60" fill="white"><path d="M5 28L40 5l35 23V56H52V36H28V56H5V28Z"/></svg>'
  }

  function renderListingCard(item, index) {
    var badge = listingBadge(item.listingType)
    var rent = item.listingType === 'Rent' || item.listingType === 'CommercialRent'
    var price = formatBwp(item.priceBwp) + (rent ? ' <span>/month</span>' : '')
    var grad = GRADIENTS[index % GRADIENTS.length]
    var delayClass = index > 0 ? ' delay-' + Math.min(index, 5) : ''
    var beds = item.bedrooms != null ? String(item.bedrooms) : '—'
    var baths = '—'
    var area = '—'
    var imgBlock = item.primaryImageUrl
      ? '<div class="prop-card-img-bg" style="position:absolute;inset:0;background:#1a2a3a"><img src="' +
        escapeHtml(item.primaryImageUrl) +
        '" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>'
      : '<div class="prop-card-img-bg ' + grad + '"></div>' + houseIcon()

    return (
      '<article class="prop-card fade-up' +
      delayClass +
      '" data-listing-id="' +
      escapeHtml(item.id) +
      '" data-listing-type="' +
      escapeHtml(item.listingType) +
      '">' +
      '<div class="prop-card-img">' +
      imgBlock +
      '<span class="prop-badge ' +
      badge.cls +
      '">' +
      escapeHtml(badge.text) +
      '</span>' +
      '<button type="button" class="prop-fav" aria-label="Save to favourites">' +
      HEART_SVG +
      '</button></div>' +
      '<div class="prop-body">' +
      '<div class="prop-price">' +
      price +
      '</div>' +
      '<div class="prop-name"><a class="prop-card-title-link" href="listing.html?id=' +
      escapeHtml(item.id) +
      '">' +
      escapeHtml(item.title) +
      '</a></div>' +
      '<div class="prop-location">' +
      LOC_ICON +
      escapeHtml(item.suburb) +
      ', ' +
      escapeHtml(item.city) +
      '</div>' +
      '<div class="prop-specs">' +
      '<div class="prop-spec"><span class="prop-spec-val">' +
      beds +
      '</span><span class="prop-spec-lbl">Beds</span></div>' +
      '<div class="prop-spec"><span class="prop-spec-val">' +
      baths +
      '</span><span class="prop-spec-lbl">Baths</span></div>' +
      '<div class="prop-spec"><span class="prop-spec-val">' +
      area +
      '</span><span class="prop-spec-lbl">Area</span></div>' +
      '</div></div></article>'
    )
  }

  var VALID_TYPES = ['Sale', 'Rent', 'CommercialSale', 'CommercialRent']

  function fetchListings(params) {
    var hf = window.HomeFinder || window.FindBW
    if (hf && hf.hasSupabase && hf.hasSupabase() && hf.api && hf.api.getListings) {
      return hf.api.getListings(params)
    }
    var base = apiBase()
    var q = new URLSearchParams()
    q.set('page', String(params.page || 1))
    q.set('pageSize', String(params.pageSize || 12))
    if (params.city) q.set('city', params.city)
    if (params.listingType) q.set('listingType', params.listingType)
    if (params.q && String(params.q).trim()) q.set('q', String(params.q).trim())
    return fetch(base + '/api/listings?' + q.toString()).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    })
  }

  /** @type {{ city: string, listingType: string | null, mode: 'api' | 'demo', q: string }} */
  var listState = { city: 'Gaborone', listingType: null, mode: 'api', q: '' }

  function syncListUrl() {
    var params = new URLSearchParams()
    if (listState.q && listState.q.trim()) params.set('q', listState.q.trim())
    if (listState.listingType) params.set('listingType', listState.listingType)
    if (listState.city && listState.city !== 'Gaborone') params.set('city', listState.city)
    if (listState.mode === 'demo') params.set('view', 'demo')
    var qs = params.toString()
    var newUrl = (qs ? '?' + qs : '') + '#explore'
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', newUrl)
    }
  }

  function applyUrlToState() {
    var params = new URLSearchParams(window.location.search)
    var q = params.get('q') || params.get('search') || ''
    listState.q = q
    var input = document.querySelector('.hero-search-input')
    if (input) input.value = q

    var lt = params.get('listingType') || params.get('type')
    if (lt && VALID_TYPES.indexOf(lt) >= 0) {
      listState.listingType = lt
      listState.mode = 'api'
    }

    if (params.get('view') === 'demo') {
      listState.mode = 'demo'
      listState.listingType = null
    }

    var city = params.get('city')
    if (city) listState.city = city
  }

  function reflectStateInUi() {
    document.querySelectorAll('.filter-chip').forEach(function (chip) {
      var f = chip.getAttribute('data-filter') || ''
      var active = false
      if (f === 'new') active = listState.mode === 'demo'
      else if (f === 'all') active = listState.mode === 'api' && !listState.listingType
      else active = listState.listingType === f
      chip.classList.toggle('active', active)
    })

    document.querySelectorAll('.hero-search-tab').forEach(function (t) {
      t.classList.remove('active')
    })
    if (listState.mode === 'demo') return
    var want = 'Buy'
    if (listState.listingType === 'Rent') want = 'Rent'
    else if (listState.listingType === 'CommercialSale' || listState.listingType === 'CommercialRent') {
      want = 'Commercial'
    }
    document.querySelectorAll('.hero-search-tab').forEach(function (t) {
      if ((t.textContent || '').trim() === want) t.classList.add('active')
    })
  }

  var staticListingsBackup = null

  function hydrateListingsFromApi() {
    var grid = document.getElementById('prop-grid')
    var statusEl = document.getElementById('prop-api-status')
    if (!grid) return
    if (!staticListingsBackup) staticListingsBackup = grid.innerHTML

    if (listState.mode === 'demo') {
      grid.innerHTML = staticListingsBackup
      if (statusEl) {
        statusEl.hidden = false
        statusEl.className = 'prop-api-banner'
        statusEl.textContent =
          'Showing demo properties (New Build filter — live “new build” tag comes in a later release).'
      }
      initFavouriteButtons()
      initFadeObserver()
      return
    }

    if (statusEl) {
      statusEl.hidden = false
      statusEl.className = 'prop-api-banner'
      statusEl.textContent = 'Loading listings…'
    }

    fetchListings({
      city: listState.city,
      pageSize: 12,
      listingType: listState.listingType || undefined,
      q: listState.q || undefined,
    })
      .then(function (data) {
        if (!data.items || data.items.length === 0) {
          if (statusEl) {
            statusEl.hidden = false
            statusEl.className = 'prop-api-banner'
            var hint = listState.q
              ? 'No matches for that search — try another area or clear filters.'
              : 'No live listings for this filter — showing demo properties below.'
            statusEl.textContent = hint
          }
          grid.innerHTML = staticListingsBackup
          initFavouriteButtons()
          initFadeObserver()
          return
        }
        grid.innerHTML = data.items.map(renderListingCard).join('')
        if (statusEl) {
          statusEl.hidden = false
          statusEl.className = 'prop-api-banner is-live'
          var src = hf() && hf().hasSupabase && hf().hasSupabase() ? 'Supabase' : 'API'
          var msg = 'Live listings from ' + src + ' (' + data.items.length + ' shown).'
          if (listState.q && listState.q.trim()) msg += ' Search: “' + listState.q.trim() + '”.'
          statusEl.textContent = msg
        }
        initFavouriteButtons()
        initFadeObserver()
      })
      .catch(function () {
        grid.innerHTML = staticListingsBackup
        if (statusEl) {
          statusEl.hidden = false
          statusEl.className = 'prop-api-banner'
          statusEl.textContent =
            'Could not load live listings. Configure Supabase (meta supabase-url / supabase-anon-key) or run the legacy API.'
        }
        initFavouriteButtons()
        initFadeObserver()
      })
  }

  window.setTab = function (el) {
    var label = (el.textContent || '').trim()
    if (label === 'Buy') listState.listingType = 'Sale'
    else if (label === 'Rent') listState.listingType = 'Rent'
    else if (label === 'Commercial') listState.listingType = 'CommercialSale'
    listState.mode = 'api'
    reflectStateInUi()
    syncListUrl()
    var ex = document.getElementById('explore')
    if (ex) ex.scrollIntoView({ behavior: 'smooth' })
    hydrateListingsFromApi()
  }

  window.activateChip = function (el) {
    document.querySelectorAll('.filter-chip').forEach(function (c) {
      c.classList.remove('active')
    })
    el.classList.add('active')
    var f = el.getAttribute('data-filter') || 'all'
    if (f === 'all') {
      listState.listingType = null
      listState.mode = 'api'
    } else if (f === 'new') {
      listState.listingType = null
      listState.mode = 'demo'
      reflectStateInUi()
      syncListUrl()
      hydrateListingsFromApi()
      return
    } else {
      listState.listingType = f
      listState.mode = 'api'
    }
    reflectStateInUi()
    syncListUrl()
    hydrateListingsFromApi()
  }

  var fadeObserver = null

  function initFadeObserver() {
    if (fadeObserver) fadeObserver.disconnect()
    fadeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.style.animationPlayState = 'running'
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.fade-up, .scale-in').forEach(function (el) {
      el.style.animationPlayState = 'paused'
      fadeObserver.observe(el)
    })
  }

  function hf() {
    return window.HomeFinder || window.FindBW
  }

  function toggleFavouriteApi(listingId, add) {
    var api = hf()
    if (!api || !api.isLoggedIn()) return Promise.resolve(false)
    var method = add ? 'POST' : 'DELETE'
    return api.fetchJson('/api/favorites/' + listingId, {
      method: method,
      token: true,
    }).then(function () {
      return true
    })
  }

  function setFavVisual(btn, on) {
    var svg = btn.querySelector('svg')
    if (!svg) return
    btn.dataset.active = on ? '1' : '0'
    svg.style.fill = on ? '#F47B20' : 'none'
    svg.style.stroke = on ? '#F47B20' : 'var(--ink-40)'
  }

  function initFavouriteButtons() {
    document.querySelectorAll('.prop-fav').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        var svg = btn.querySelector('svg')
        if (!svg) return
        var card = btn.closest('.prop-card')
        var id = card && card.getAttribute('data-listing-id')
        var isActive = btn.dataset.active === '1'
        var wantAdd = !isActive

        if (!hf() || !hf().isLoggedIn()) {
          window.location.href =
            'login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html')
          return
        }
        if (!id) {
          setFavVisual(btn, wantAdd)
          return
        }
        toggleFavouriteApi(id, wantAdd)
          .then(function () {
            setFavVisual(btn, wantAdd)
          })
          .catch(function () {
            window.location.href =
              'login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html')
          })
      })
    })
  }

  function initNavScroll() {
    var nav = document.getElementById('navbar')
    if (!nav) return
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20)
    })
  }

  function initMobileNav() {
    var panel = document.getElementById('mobileNav')
    var btn = document.getElementById('mobileMenuBtn')
    var close = document.getElementById('mobileNavClose')
    if (!panel || !btn) return

    function setOpen(open) {
      panel.classList.toggle('open', open)
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
      document.body.style.overflow = open ? 'hidden' : ''
    }

    btn.addEventListener('click', function () {
      setOpen(!panel.classList.contains('open'))
    })
    if (close) close.addEventListener('click', function () { setOpen(false) })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false)
    })
  }

  function runSearchFromHero() {
    var input = document.querySelector('.hero-search-input')
    if (!input) return
    listState.q = (input.value || '').trim()
    listState.mode = 'api'
    reflectStateInUi()
    syncListUrl()
    hydrateListingsFromApi()
    var ex = document.getElementById('explore')
    if (ex) ex.scrollIntoView({ behavior: 'smooth' })
  }

  function initHeroSearch() {
    var btn = document.getElementById('heroSearchBtn')
    var input = document.querySelector('.hero-search-input')
    if (!btn || !input) return
    btn.addEventListener('click', function () {
      runSearchFromHero()
    })
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault()
        runSearchFromHero()
      }
    })
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyUrlToState()
    reflectStateInUi()
    initNavScroll()
    initMobileNav()
    initFadeObserver()
    initFavouriteButtons()
    hydrateListingsFromApi()
    initHeroSearch()
  })
})()
