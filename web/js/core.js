/**
 * HomeFinder — shared session, Supabase auth, API routing (ES module)
 * window.FindBW remains an alias for legacy code.
 */
import { getSupabase, isSupabaseConfigured } from './supabase.js'
import * as hfApi from './api.js'

var STORAGE_TOKEN = 'hf_token'
var STORAGE_USER = 'hf_user'
var LEGACY_TOKEN = 'findbw_token'
var LEGACY_USER = 'findbw_user'

function getApiBase() {
  if (typeof window.__HOMEFINDER_API_BASE__ === 'string' && window.__HOMEFINDER_API_BASE__.trim()) {
    return String(window.__HOMEFINDER_API_BASE__).replace(/\/$/, '')
  }
  if (typeof window.__FINDBW_API_BASE__ === 'string' && window.__FINDBW_API_BASE__.trim()) {
    return String(window.__FINDBW_API_BASE__).replace(/\/$/, '')
  }
  var m =
    document.querySelector('meta[name="homefinder-api-base"]') ||
    document.querySelector('meta[name="findbw-api-base"]')
  var fromMeta = m && m.getAttribute('content')
  if (fromMeta && fromMeta.trim()) {
    return fromMeta.replace(/\/$/, '')
  }
  if (typeof location !== 'undefined' && location.hostname === 'localhost') {
    var p = location.port
    if (p === '5173' || p === '4173') {
      return 'http://localhost:5252'
    }
  }
  return ''
}

function getToken() {
  try {
    return sessionStorage.getItem(STORAGE_TOKEN) || sessionStorage.getItem(LEGACY_TOKEN)
  } catch {
    return null
  }
}

function getUser() {
  try {
    var raw = sessionStorage.getItem(STORAGE_USER) || sessionStorage.getItem(LEGACY_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function dispatchAuth() {
  window.dispatchEvent(new Event('homefinder-auth-change'))
  window.dispatchEvent(new Event('findbw-auth-change'))
}

function clearLocalSession() {
  try {
    sessionStorage.removeItem(STORAGE_TOKEN)
    sessionStorage.removeItem(STORAGE_USER)
    sessionStorage.removeItem(LEGACY_TOKEN)
    sessionStorage.removeItem(LEGACY_USER)
  } catch (_) {}
}

async function syncFromSession(session) {
  if (!session || !session.user) {
    clearLocalSession()
    dispatchAuth()
    return
  }
  try {
    sessionStorage.setItem(STORAGE_TOKEN, session.access_token)
  } catch (_) {}

  var user = session.user
  var sb = getSupabase()
  var profile = null
  if (sb) {
    var pr = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (!pr.error) profile = pr.data
  }

  var u = {
    userId: user.id,
    email: user.email,
    fullName:
      (profile && profile.full_name) ||
      (user.user_metadata && user.user_metadata.full_name) ||
      '',
    role: (profile && profile.role) || 'User',
    phone: (profile && profile.phone) || '',
  }
  try {
    sessionStorage.setItem(STORAGE_USER, JSON.stringify(u))
    try {
      sessionStorage.removeItem(LEGACY_TOKEN)
      sessionStorage.removeItem(LEGACY_USER)
    } catch (_) {}
  } catch (e) {
    /* ignore */
  }
  dispatchAuth()
}

function setSession(accessToken, user) {
  try {
    sessionStorage.setItem(STORAGE_TOKEN, accessToken)
    sessionStorage.setItem(STORAGE_USER, JSON.stringify(user || {}))
    try {
      sessionStorage.removeItem(LEGACY_TOKEN)
      sessionStorage.removeItem(LEGACY_USER)
    } catch (_) {}
  } catch (e) {
    /* ignore */
  }
  dispatchAuth()
}

async function clearSession() {
  var sb = getSupabase()
  if (sb) {
    try {
      await sb.auth.signOut()
    } catch (_) {}
  }
  clearLocalSession()
  dispatchAuth()
}

function isLoggedIn() {
  return Boolean(getToken())
}

function trySupabaseFetchJson(path, options) {
  if (!isSupabaseConfigured()) return null
  var method = (options.method || 'GET').toUpperCase()

  if (path.indexOf('/api/favorites') === 0) {
    var favMatch = path.match(/^\/api\/favorites(?:\/([^/?]+))?(?:\?|$)/)
    if (favMatch && !favMatch[1]) {
      if (method === 'GET') return hfApi.getFavoriteListingIds()
    }
    if (favMatch && favMatch[1]) {
      var lid = favMatch[1]
      if (method === 'POST') return hfApi.addFavorite(lid)
      if (method === 'DELETE') return hfApi.removeFavorite(lid)
    }
  }

  if (path.indexOf('/api/listings') === 0) {
    var detail = path.match(/^\/api\/listings\/([^/?]+)\/?(?:\?|$)/)
    if (detail && method === 'GET') {
      return hfApi.getListingById(detail[1])
    }
    if (path === '/api/listings' || path.indexOf('/api/listings?') === 0) {
      if (method === 'GET') {
        var qs = path.indexOf('?') >= 0 ? path.slice(path.indexOf('?') + 1) : ''
        var p = new URLSearchParams(qs)
        return hfApi.getListings({
          page: p.get('page') || '1',
          pageSize: p.get('pageSize') || '12',
          city: p.get('city') || undefined,
          listingType: p.get('listingType') || undefined,
          q: p.get('q') || undefined,
        })
      }
      if (method === 'POST') {
        var body = options.body ? JSON.parse(options.body) : {}
        return hfApi.createListing(body)
      }
    }
  }

  return null
}

function fetchJson(path, options) {
  options = options || {}
  var routed = trySupabaseFetchJson(path, options)
  if (routed) {
    return routed.catch(function (err) {
      var msg = (err && err.message) || String(err)
      if (/JWT|session|Unauthorized|401/i.test(msg)) {
        clearLocalSession()
        dispatchAuth()
      }
      throw err
    })
  }

  var base = getApiBase()
  var url = path.startsWith('http') ? path : base + path
  var headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.token !== false) {
    var t = getToken()
    if (t) headers.set('Authorization', 'Bearer ' + t)
  }
  return fetch(url, {
    method: options.method || 'GET',
    headers: headers,
    body: options.body,
  }).then(function (res) {
    return res.text().then(function (text) {
      var data = null
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = text
        }
      }
      if (res.status === 401 && options.token !== false) {
        clearLocalSession()
        dispatchAuth()
      }
      if (!res.ok) {
        if (typeof data === 'string' && /^\s*</.test(data)) {
          throw new Error(
            'Received HTML instead of JSON — check API URL or Supabase configuration.',
          )
        }
        var msg =
          typeof data === 'object' && data !== null && data.message
            ? data.message
            : typeof data === 'string'
              ? data
              : res.statusText
        throw new Error(msg || String(res.status))
      }
      if (res.status === 204) return null
      return data
    })
  })
}

var authApi = {
  login: async function (email, password) {
    var sb = getSupabase()
    if (!sb) throw new Error('Supabase is not configured.')
    var res = await sb.auth.signInWithPassword({ email: email.trim(), password: password })
    if (res.error) throw new Error(res.error.message || 'Sign in failed.')
    await syncFromSession(res.data.session)
    return res.data
  },

  register: async function (email, password, meta) {
    meta = meta || {}
    var sb = getSupabase()
    if (!sb) throw new Error('Supabase is not configured.')
    var res = await sb.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: { full_name: meta.fullName || '' },
      },
    })
    if (res.error) throw new Error(res.error.message || 'Registration failed.')
    if (res.data.user) {
      var row = {
        id: res.data.user.id,
        full_name: meta.fullName || (res.data.user.user_metadata && res.data.user.user_metadata.full_name) || '',
        phone: meta.phone || '',
        role: 'User',
      }
      var ins = await sb.from('profiles').upsert(row, { onConflict: 'id' })
      if (ins.error) {
        /* profile may already exist from DB trigger */
      }
    }
    if (res.data.session) await syncFromSession(res.data.session)
    return res.data
  },

  logout: async function () {
    await clearSession()
  },

  getUser: function () {
    return getUser()
  },

  getSession: async function () {
    var sb = getSupabase()
    if (!sb) return null
    var r = await sb.auth.getSession()
    return r.data.session
  },

  getRole: function () {
    var u = getUser()
    return (u && u.role) || 'User'
  },
}

var publicApi = {
  getApiBase: getApiBase,
  getToken: getToken,
  getUser: getUser,
  setSession: setSession,
  clearSession: clearSession,
  isLoggedIn: isLoggedIn,
  hasSupabase: function () {
    return isSupabaseConfigured()
  },
  fetchJson: fetchJson,
  auth: authApi,
  api: {
    getListings: hfApi.getListings,
    getListingById: hfApi.getListingById,
    createListing: hfApi.createListing,
  },
  storage: {
    uploadImage: hfApi.uploadPropertyImage,
  },
}

window.HomeFinder = publicApi
window.FindBW = publicApi

;(async function initAuth() {
  var sb = getSupabase()
  if (!sb) return
  sb.auth.onAuthStateChange(function (_event, session) {
    syncFromSession(session)
  })
  var r = await sb.auth.getSession()
  await syncFromSession(r.data.session)
})()
