/**
 * HomeFinder — Supabase client (ES module)
 * Configure via (first match wins):
 *   window.__SUPABASE_URL__ / window.__SUPABASE_ANON_KEY__
 *   meta[name="supabase-url"] / meta[name="supabase-anon-key"]
 *   import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (bundlers)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

function readMeta() {
  if (typeof document === 'undefined') return { url: '', key: '' }
  var u = document.querySelector('meta[name="supabase-url"]')
  var k = document.querySelector('meta[name="supabase-anon-key"]')
  return {
    url: (u && u.getAttribute('content')) || '',
    key: (k && k.getAttribute('content')) || '',
  }
}

function readWindow() {
  var w = typeof window !== 'undefined' ? window : {}
  return {
    url: (w.__SUPABASE_URL__ && String(w.__SUPABASE_URL__).trim()) || '',
    key: (w.__SUPABASE_ANON_KEY__ && String(w.__SUPABASE_ANON_KEY__).trim()) || '',
  }
}

function readImportMeta() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      var e = import.meta.env
      var u = e.VITE_SUPABASE_URL || e.SUPABASE_URL
      var k = e.VITE_SUPABASE_ANON_KEY || e.SUPABASE_ANON_KEY
      if (u && k) {
        return { url: String(u).trim(), key: String(k).trim() }
      }
    }
  } catch (_) {}
  return { url: '', key: '' }
}

export function getSupabaseConfig() {
  var win = readWindow()
  if (win.url && win.key) return win
  var im = readImportMeta()
  if (im.url && im.key) return im
  var meta = readMeta()
  if (meta.url && meta.key) return meta
  return { url: '', key: '' }
}

export function isSupabaseConfigured() {
  var c = getSupabaseConfig()
  return Boolean(c.url && c.key)
}

var _client = null

export function getSupabase() {
  if (_client) return _client
  var c = getSupabaseConfig()
  if (!c.url || !c.key) return null
  _client = createClient(c.url, c.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
  return _client
}

export function resetSupabaseClient() {
  _client = null
}
