/**
 * Medium-like Image Plugin
 * Author: github.com/ele828
 */

;(function() {
    var loaded = [];
    var bannersObj = document.querySelectorAll('.banner');
    var banenrs = Array.prototype.slice.apply(bannersObj);

    function getPos(el) {
        for (var lx=0, ly=0; el != null;
             lx += el.offsetLeft,
             ly += el.offsetTop,
             el = el.offsetParent ) {}
        return {x: lx,y: ly};
    }

    function loadOneImage(banner, i) {
      var imgtop = getPos(banner).y
      var scrollY = window.scrollY;
      var vpheight = window.innerHeight;
      // console.log(imgtop, scrollY, vpheight)
      if (scrollY >= imgtop - vpheight) {
        // console.log('img showed');
        if (!loaded[i]) {
          console.log('load a pic')
          loadLargeImage(banner);
          loaded[i] = true;
        }
      }
    }

    function loadSmallImage(banner) {
        var imgSmall = banner.querySelector('.img-small')
        var img = new Image(),
            width = imgSmall.dataset.width,
            height = imgSmall.dataset.height;

        img.src = imgSmall.src
        img.addEventListener('load', function (e) {
          imgSmall.classList.add('loaded')
        }, false)
    }

    function loadLargeImage(banner) {
        var imgSmall = banner.querySelector('.img-small')
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

    function throttle(fn, intv) {
      var __self = fn
        , timer
        , firstTime = true;

        return function() {
          var args = arguments
            , __me = this;

          if( firstTime ) {
              __self.apply(__me, args);
              return firstTime = false;
          }

          if( timer ) {
            return false;
          }

          timer = setTimeout(function() {
            clearTimeout(timer);
            timer = null;
            __self.apply(__me, args);
          }, intv || 500);

        };
    };

    function onLoad() {
      banenrs.forEach(function(banner, i) {
        setTimeout(function() {
          loadOneImage(banner, i)
        }, 50);
      })
    }

    // Init images if needed
    onLoad();
    // Load all thumbnails
    banenrs.forEach(loadSmallImage);
    window.addEventListener('scroll', throttle(onLoad, 800));

})()

