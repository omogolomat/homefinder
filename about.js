/**
 * HomeFinder — about.html
 */
;(function () {
  'use strict'

  window.submitContact = function (e) {
    e.preventDefault()
    var btn = e.target.querySelector('button[type="submit"]')
    if (btn) {
      btn.textContent = "✓ Message sent! We'll respond within 24 hours."
      btn.style.background = 'linear-gradient(135deg,var(--green),var(--green-dark))'
    }
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
