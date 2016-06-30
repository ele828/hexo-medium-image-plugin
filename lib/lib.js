/**
 * Medium-like Image Plugin
 * Author: github.com/ele828
 */

var Plugin = (function() {
  return {
    loadImage: function(banner) {
      var imgSmall = banner.querySelector('.img-small')
      var img = new Image(),
          width = imgSmall.dataset.width,
          height = imgSmall.dataset.height;

      img.src = imgSmall.src
      img.addEventListener('load', function (e) {
        imgSmall.classList.add('loaded')
      }, false)

      var imgLarge = new Image()

      imgLarge.src = imgSmall.dataset.large
      imgLarge.addEventListener('load',function (e) {
        imgLarge.classList.add('loaded')
        setTimeout(function () {
          imgSmall.classList.add('faded')
        }, 750)
      }, false)
      
      imgLarge.classList.add('img-large')
      imgSmall.parentNode.appendChild(imgLarge)
    }
  }
})()

var banners = document.querySelectorAll('.banner')
Array.prototype.slice.apply(banners).forEach(Plugin.loadImage)