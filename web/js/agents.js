/**
 * HomeFinder — agents.html
 */
;(function () {
  'use strict'

  window.activateRating = function (el) {
    document.querySelectorAll('.rating-btn').forEach(function (b) {
      b.classList.remove('active')
    })
    el.classList.add('active')
  }

  window.clearFilters = function () {
    document.querySelectorAll('.filter-check input').forEach(function (c) {
      c.checked = false
    })
  }

  window.applyFilters = function () {
    /* Hook for future API: filter agent directory */
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
    document.querySelectorAll('.page-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!this.classList.contains('arrow')) {
          document.querySelectorAll('.page-btn:not(.arrow)').forEach(function (b) {
            b.classList.remove('active')
          })
          this.classList.add('active')
        }
      })
    })
  })
})()
