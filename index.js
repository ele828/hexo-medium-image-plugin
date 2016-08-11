const fs     = require('fs')
const co     = require('co')
const gm     = require('gm')
const path   = require('path')
const mkdirp = require('mkdirp')

/**
 * Helper functions
 */

const readDir = path => new Promise((resolve, reject) =>
  fs.readdir(path, (err, files) => err ? reject(err) : resolve(files)))

const readFile = path => new Promise((resolve, reject) => 
  fs.readFile(path, (err, content) => err? reject(err): resolve(content)))

const writeFile = (path, content) => new Promise((resolve, reject) => 
  fs.writeFile(path, content, err => err? reject(err): resolve(content)))

const existFile = path => new Promise((resolve, reject) => 
  fs.exists(path, (exists) => resolve(exists)))

const statFile = path => new Promise((resolve, reject) =>
  fs.stat(path, (err, stat) =>  err? reject(err) : resolve(stat)))

const statFiles = paths => Promise.all(paths.map(statFile))

const mkdir = dpath => new Promise((resolve, reject) =>
  mkdirp(path.dirname(dpath), err => err? reject(err): resolve(dpath)))

const copyFile = (origin, dest) => 
  fs.createReadStream(origin).pipe(fs.createWriteStream(dest))

const copyFileInExist = (origin, dest) => 
  existFile(dest).then(exists => {
    exists? null
      : mkdir(dest).then(() =>
          copyFile(origin, dest))
    })

// Throttle Promise.all execution
const PromiseAllChunks = (p, l) => p.length <= l ? Promise.all(p)
     : Promise.all([p.filter((_, i) => !(i % 2)),
        p.filter((_, i) => i % 2)]
         .map((e) => PromiseAllChunks(e, l)))
           .then(([a, b]) => [...a, ...b])

const isImageFile = file => /(.*)\/[\w|\s|.|-]+[.]+[\w]+$/.test(file)

const filterImage = files => files.filter(isImageFile)

const filterPath = (paths, root) => paths.map((p) => p.replace(root, ''))

const getImageSize = gm => new Promise((resolve, reject) =>
  gm.size((err, size) => err? reject(err): resolve(size)))

const GMConverter = fileUri =>
  // if gif file, grab the first frame
  Promise.resolve(
    gm(fileUri.replace(/(.*).gif/igm, s => `${s}[0]`))
      .scale(20, 20)
      .quality(10)
      .noProfile())

const convertImage = (img, root, dest) =>
  mkdir(path.join(dest, img)).then((dpath) =>
    GMConverter(path.join(root, img))
      .then((gm) => getImageSize(gm).then((size) =>
        new Promise((resolve, reject) =>
          gm.write(dpath, err => !err? resolve({path: dpath, size: size}): reject(err)))
      )))

const convertImages = (imgs, root, dest) =>
  PromiseAllChunks(imgs.map(img => convertImage(img, root, dest)), 3)

const difference = ([a, b]) => 
  a.filter(v => b.indexOf(v) < 0).concat(b.filter(v => a.indexOf(v) < 0))

/**
 * Filter if a's element is in b
 */
const diffObjectArray= (a, b) => {
  let ret = [];
  for (let i = 0; i < a.length; i++ ) {
    let found = false;
    for (let j = 0; j < b.length; j++) {
      if (a[i].path === b[j].path) {
        found = true
        break;
      }
    }
    if (!found) ret.push(a[i])
  }
  return ret;
}

const appendFileAsJsonArray = (path, content) => readFile(path)
  .then(prevContent => {
    prevContent = JSON.parse(prevContent)
    // Assure saved only once
    const contentArray = [...prevContent,
        ...diffObjectArray(content, prevContent)] 
    content = JSON.stringify(contentArray)
    return writeFile(path, content)
      .then(_ => Promise.resolve(contentArray))
  }).catch(err => {
    // Error, retry
    return writeFile(path, JSON.stringify([])).then(_ =>
      appendFileAsJsonArray(path, content)) 
  })

const walk = curpath => co(function* () {
  let files, fileArray = []
  
  try {
    files = yield readDir(curpath)
  } catch(e) {
    // lib `mkdirp` cannot judge `a/b` as folder
    yield mkdir(curpath + '/.')
    files = yield readDir(curpath)
  }

  let file_paths = files.map(f => path.join(curpath, f))
  let stats = yield statFiles(file_paths)
  for (let i = 0; i < stats.length; i++) {
    const file_path = path.join(curpath, files[i])
    if (stats[i].isDirectory())
      fileArray = [...fileArray, ...yield walk(file_path)]
    else fileArray.push(file_path)
  }
  return fileArray
})

/**
 * Stats image files in image folder
 */

const generateThumbs = (root_path, thumbnail_path) => co(function* () {
  const fns = [
      walk(root_path).then(filterImage).then(ps => filterPath(ps, root_path)),
      walk(thumbnail_path).then(filterImage).then(ps => filterPath(ps, thumbnail_path))]

  const retval   = yield Promise.all(fns)
  const diffImgs = yield difference(retval)
  const info     = yield convertImages(diffImgs, root_path, thumbnail_path)
  return info
})

const copyAssets = (base_dir, plugin_path) => {
  const libPath = path.join(base_dir, 'node_modules', 'hexo-medium-image-plugin', 'lib')

  const js = path.join(libPath, 'lib.js')
  const style = path.join(libPath, 'lib.css')

  copyFileInExist(js, path.join(plugin_path, 'lib.js'))
  copyFileInExist(style, path.join(plugin_path, 'lib.css'))
}

const importAssets = (src) => 
  src + `<script src="/medium-image-plugin/lib.js"></script>
      <link rel="stylesheet" href="/medium-image-plugin/lib.css">`

/**
 * Transform HTML to specified format
 */
const transformHTML = (source, thumbInfo, thumbDir, imgDir, max_width) =>
  source.replace(/<img([^>]+)?>/igm, (s, attr) => {
    let width, height, img_url
    attr = attr.replace(/src="([^"]+)?"/, (s, img) => {
      thumbInfo.forEach(info => {

        // Pick a thumbnail
        img_url = img.replace('/'+imgDir, '')
        info.path = info.path.replace(thumbDir, '')
        if (info.path.indexOf(img_url) != -1) {
          width = info.size.width
          height = info.size.height

          // Image too large, scale by ratio
          if (width > max_width) {
            const ratio = width / max_width
            width = width / ratio
            height = height / ratio
          }

        }
      })
      return `src="/medium-image-plugin/thumbnails${img_url}"`
    })

    return `<figure class="banner" style="width:${width}px; height:${height}px;margin: 0 auto;">
      <img${attr} class="img-small" data-large="/img${img_url}">
      </figure>`
  }
)

const mediumImagePlugin = data => co(function *() {
  const base_dir = hexo.base_dir
  const img_path = hexo.config.medium_image_plugin.image_path || 'img'
  const max_width = hexo.config.medium_image_plugin.max_width
  const root_path = path.join(base_dir, 'source', img_path)
  const plugin_path = path.join(base_dir, 'public', 'medium-image-plugin')
  const thumbnail_path = path.join(plugin_path, 'thumbnails')

  const info = yield generateThumbs(root_path, thumbnail_path)
  const thumbInfo = yield appendFileAsJsonArray(path.join(plugin_path, 'thumbnails.json'), info)

  // Asynchronous operation
  copyAssets(base_dir, plugin_path)
  data.content = importAssets(data.content)
  data.content = transformHTML(data.content, thumbInfo, thumbnail_path, img_path, max_width)

  return data
})

// Adjust html structure
hexo.extend.filter.register('after_post_render', mediumImagePlugin)