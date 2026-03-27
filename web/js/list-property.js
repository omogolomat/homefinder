document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('listing-form')
  var err = document.getElementById('form-err')
  var ok = document.getElementById('form-ok')
  var gateSignin = document.getElementById('listing-gate-signin')
  var gateBuyer = document.getElementById('listing-gate-buyer')
  var formRoot = document.getElementById('listing-form-root')
  var fileInput = document.getElementById('listingFiles')
  var uploadStatus = document.getElementById('listing-upload-status')
  if (!form || !window.FindBW) return

  var A = window.HomeFinder || window.FindBW

  function isAgent() {
    var u = A.getUser()
    return Boolean(u && (u.role === 'Agent' || u.role === 'Admin'))
  }

  function showGate() {
    if (!A.isLoggedIn()) {
      if (gateSignin) gateSignin.hidden = false
      if (gateBuyer) gateBuyer.hidden = true
      if (formRoot) formRoot.hidden = true
      if (err) err.hidden = true
      return
    }
    if (!isAgent()) {
      if (gateSignin) gateSignin.hidden = true
      if (gateBuyer) gateBuyer.hidden = false
      if (formRoot) formRoot.hidden = true
      if (err) err.hidden = true
      return
    }
    if (gateSignin) gateSignin.hidden = true
    if (gateBuyer) gateBuyer.hidden = true
    if (formRoot) formRoot.hidden = false
  }

  showGate()
  window.addEventListener('findbw-auth-change', showGate)
  window.addEventListener('homefinder-auth-change', showGate)

  if (!A.isLoggedIn() || !isAgent()) return

  function collectImageUrls() {
    var raw = document.getElementById('imageUrls').value
    return raw
      .split(/[\n,]+/)
      .map(function (s) {
        return s.trim()
      })
      .filter(Boolean)
  }

  async function uploadSelectedFiles() {
    if (!fileInput || !fileInput.files || !fileInput.files.length) return []
    if (!A.hasSupabase || !A.hasSupabase() || !A.storage || !A.storage.uploadImage) {
      throw new Error('Image upload requires Supabase (configure supabase-url / supabase-anon-key).')
    }
    var urls = []
    for (var i = 0; i < fileInput.files.length; i++) {
      var f = fileInput.files[i]
      if (!/^image\//.test(f.type)) continue
      var url = await A.storage.uploadImage(f)
      urls.push(url)
    }
    return urls
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    err.hidden = true
    ok.hidden = true
    var submitBtn = form.querySelector('button[type="submit"]')
    function busy(on) {
      if (submitBtn) {
        submitBtn.disabled = on
        submitBtn.setAttribute('aria-busy', on ? 'true' : 'false')
      }
    }

    var title = document.getElementById('title').value.trim()
    var price = Number(document.getElementById('priceBwp').value)
    if (!title || !price || price < 1) {
      err.textContent = 'Please enter a title and a valid price.'
      err.hidden = false
      return
    }

    busy(true)
    if (uploadStatus) {
      uploadStatus.hidden = false
      uploadStatus.textContent = 'Uploading images…'
    }

    var run = Promise.resolve([])
    if (fileInput && fileInput.files && fileInput.files.length) {
      run = uploadSelectedFiles()
    }

    run.then(function (uploadedUrls) {
      if (uploadStatus) uploadStatus.textContent = 'Publishing…'
      var manual = collectImageUrls()
      var imageUrls = uploadedUrls.concat(manual)
      var body = {
        title: title,
        description: document.getElementById('description').value.trim() || null,
        priceBwp: price,
        listingType: document.getElementById('listingType').value,
        propertyType: document.getElementById('propertyType').value,
        city: document.getElementById('city').value,
        suburb: document.getElementById('suburb').value.trim(),
        bedrooms: document.getElementById('bedrooms').value
          ? Number(document.getElementById('bedrooms').value)
          : null,
        bathrooms: document.getElementById('bathrooms').value
          ? Number(document.getElementById('bathrooms').value)
          : null,
        imageUrls: imageUrls,
      }

      if (A.hasSupabase && A.hasSupabase() && A.api && A.api.createListing) {
        return A.api.createListing(body)
      }
      return A.fetchJson('/api/listings', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    })
      .then(function (res) {
        busy(false)
        if (uploadStatus) uploadStatus.hidden = true
        var id = res && (res.id != null ? res.id : res.Id)
        ok.innerHTML =
          'Listing created. <a href="listing.html?id=' + encodeURIComponent(id) + '">View listing</a>'
        ok.hidden = false
        form.reset()
        if (fileInput) fileInput.value = ''
      })
      .catch(function (ex) {
        busy(false)
        if (uploadStatus) {
          uploadStatus.hidden = true
        }
        err.textContent = (ex && ex.message) || 'Could not create listing.'
        err.hidden = false
      })
  })
})
