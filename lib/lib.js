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
      img.addEventListener('load', (e) => {
        imgSmall.classList.add('loaded')
      }, false)

      var imgLarge = new Image()

      imgLarge.src = imgSmall.dataset.large
      imgLarge.addEventListener('load', (e) => {
        imgLarge.classList.add('loaded')
      }, false)
      
      imgLarge.classList.add('img-large')
      imgSmall.parentNode.appendChild(imgLarge)
    }
  }
})()

var banners = document.querySelectorAll('.banner')
Array.prototype.slice.apply(banners).forEach(Plugin.loadImage)