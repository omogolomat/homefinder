/**
 * HomeFinder — blog.html
 */
;(function () {
  'use strict'

  window.activateCat = function (el) {
    document.querySelectorAll('.cat-tab').forEach(function (t) {
      t.classList.remove('active')
    })
    el.classList.add('active')
  }

  window.loadMore = function (btn) {
    btn.textContent = 'Loading...'
    setTimeout(function () {
      btn.textContent = 'No more articles'
      btn.disabled = true
      btn.style.opacity = '0.5'
    }, 800)
  }

  window.addEventListener('scroll', function () {
    var nav = document.getElementById('navbar')
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20)
  })

  document.addEventListener('DOMContentLoaded', function () {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.style.animationPlayState = 'running'
        })
      },
      { threshold: 0.1 },
    )
    document.querySelectorAll('.fade-up').forEach(function (el) {
      el.style.animationPlayState = 'paused'
      obs.observe(el)
    })
  })
})()
