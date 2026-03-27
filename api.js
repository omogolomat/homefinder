/**
 * HomeFinder — Supabase data + storage (ES module)
 */
import { getSupabase } from './supabase.js'

function requireSupabase() {
  var sb = getSupabase()
  if (!sb) throw new Error('Supabase is not configured (set supabase-url / supabase-anon-key).')
  return sb
}

function escapeIlike(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function mapListingRow(row) {
  if (!row) return null
  var imgs = row.image_urls
  if (!imgs) imgs = []
  if (!Array.isArray(imgs)) imgs = []
  return {
    id: row.id,
    title: row.title,
    priceBwp: row.price_bwp != null ? Number(row.price_bwp) : 0,
    listingType: row.listing_type,
    propertyType: row.property_type,
    city: row.city,
    suburb: row.suburb,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    description: row.description,
    imageUrls: imgs,
    primaryImageUrl: imgs[0] || null,
    agentName: row.agent_name || '',
    agentPhone: row.agent_phone || '',
  }
}

function rowFromCamel(data, agentId, agentMeta) {
  return {
    agent_id: agentId,
    title: data.title,
    description: data.description || null,
    price_bwp: Number(data.priceBwp),
    listing_type: data.listingType,
    property_type: data.propertyType,
    city: data.city,
    suburb: data.suburb,
    bedrooms: data.bedrooms != null ? Number(data.bedrooms) : null,
    bathrooms: data.bathrooms != null ? Number(data.bathrooms) : null,
    image_urls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    agent_name: (agentMeta && agentMeta.full_name) || '',
    agent_phone: (agentMeta && agentMeta.phone) || '',
  }
}

/**
 * @param {{ page?: number, pageSize?: number, city?: string, listingType?: string, q?: string }} filters
 */
export async function getListings(filters) {
  var sb = requireSupabase()
  filters = filters || {}
  var page = Math.max(1, Number(filters.page) || 1)
  var pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 12))
  var start = (page - 1) * pageSize
  var end = start + pageSize - 1

  var q = sb.from('listings').select('*', { count: 'exact' })

  if (filters.city) q = q.eq('city', filters.city)
  if (filters.listingType) q = q.eq('listing_type', filters.listingType)
  var search = filters.q && String(filters.q).trim()
  if (search) {
    var term = '%' + escapeIlike(search) + '%'
    q = q.or('title.ilike.' + term + ',suburb.ilike.' + term)
  }

  q = q.order('created_at', { ascending: false }).range(start, end)

  var res = await q
  if (res.error && search) {
    var q2 = sb.from('listings').select('*', { count: 'exact' })
    if (filters.city) q2 = q2.eq('city', filters.city)
    if (filters.listingType) q2 = q2.eq('listing_type', filters.listingType)
    q2 = q2.ilike('title', '%' + escapeIlike(search) + '%')
    q2 = q2.order('created_at', { ascending: false }).range(start, end)
    res = await q2
  }
  if (res.error) throw new Error(res.error.message || 'Could not load listings.')
  return {
    items: (res.data || []).map(mapListingRow),
    totalCount: res.count != null ? res.count : (res.data || []).length,
  }
}

export async function getListingById(id) {
  var sb = requireSupabase()
  var res = await sb.from('listings').select('*').eq('id', id).maybeSingle()
  if (res.error) throw new Error(res.error.message || 'Listing lookup failed.')
  if (!res.data) throw new Error('notfound')
  return mapListingRow(res.data)
}

export async function createListing(data) {
  var sb = requireSupabase()
  var {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser()
  if (userErr || !user) throw new Error('Sign in required.')

  var profRes = await sb.from('profiles').select('role, full_name, phone').eq('id', user.id).maybeSingle()
  if (profRes.error) throw new Error(profRes.error.message)
  var prof = profRes.data
  if (!prof || (prof.role !== 'Agent' && prof.role !== 'Admin')) {
    throw new Error('Only verified agents can publish listings.')
  }

  var insertPayload = rowFromCamel(data, user.id, prof)
  var ins = await sb.from('listings').insert(insertPayload).select().single()
  if (ins.error) throw new Error(ins.error.message || 'Could not create listing.')
  return mapListingRow(ins.data)
}

export async function uploadPropertyImage(file) {
  var sb = requireSupabase()
  if (!file || !file.size) throw new Error('Choose an image file.')

  var {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser()
  if (userErr || !user) throw new Error('Sign in to upload images.')

  var ext = (file.name && file.name.split('.').pop()) || 'jpg'
  if (ext.length > 8) ext = 'jpg'
  var path = user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext

  var up = await sb.storage.from('property-images').upload(path, file, {
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (up.error) throw new Error(up.error.message || 'Upload failed.')

  var pub = sb.storage.from('property-images').getPublicUrl(path)
  return pub.data.publicUrl
}

export async function getFavoriteListingIds() {
  var sb = requireSupabase()
  var {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return { listingIds: [] }

  var res = await sb.from('user_favorites').select('listing_id').eq('user_id', user.id)
  if (res.error) throw new Error(res.error.message)
  return { listingIds: (res.data || []).map(function (r) { return r.listing_id }) }
}

export async function addFavorite(listingId) {
  var sb = requireSupabase()
  var {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser()
  if (userErr || !user) throw new Error('Unauthorized')

  var res = await sb.from('user_favorites').insert({ user_id: user.id, listing_id: listingId })
  if (res.error) throw new Error(res.error.message || 'Could not save favourite.')
  return { ok: true }
}

export async function removeFavorite(listingId) {
  var sb = requireSupabase()
  var {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser()
  if (userErr || !user) throw new Error('Unauthorized')

  var res = await sb
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
  if (res.error) throw new Error(res.error.message || 'Could not remove favourite.')
  return { ok: true }
}
