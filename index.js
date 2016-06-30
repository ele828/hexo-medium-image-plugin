const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const co = require('co')
const gm = require('gm')

/**
 * Helper functions
 */

const readDir = path => new Promise((resolve, reject) =>
  fs.readdir(path, (err, files) => err ? reject(err) : resolve(files)))

const statFile = path => new Promise((resolve, reject) =>
  fs.stat(path, (err, stat) =>  err? reject(err) : resolve(stat)))

const statFiles = paths => Promise.all(paths.map(statFile))

const isImageFile = file => /(.*)\/[\w|.|-]+[.]+[\w]+$/.test(file)

const filterImage = files => files.filter(isImageFile)

const filterPath = (paths, root) => paths.map((p) => p.replace(root, ''))

const difference = ([a, b]) => 
  a.filter(v => b.indexOf(v) < 0).concat(b.filter((v) => a.indexOf(v) < 0))

const mkdir = (dpath) => new Promise((resolve, reject) =>
  mkdirp(path.dirname(dpath), (err) => err? reject(err): resolve(dpath)))

const getImageSize = (gm) => new Promise((resolve, reject) =>
  gm.size((err, size) => err? reject(err): resolve(size)))

const convertImage = (img, root, dest) =>
  mkdir(path.join(dest, img)).then((dpath) =>
    Promise.resolve( gm(path.join(root, img)).scale(20, 20).quality(10).noProfile() )
      .then((gm) => getImageSize(gm).then((size) =>
        new Promise((resolve, reject) =>
          gm.write(dpath, (err) => !err? resolve({path: dpath, size: size}): reject(err)))
      )))

const convertImages = (imgs, root, dest) =>
  Promise.all(imgs.map(img => convertImage(img, root, dest)))

const walk = (curpath) => co(function* () {
  let fileArray = [], files
  
  try {
    files = yield readDir(curpath)
  } catch(e) {
    // mkdir cannot judge `a/b` as folder
    yield mkdir(curpath + '/.')
    files = yield readDir(curpath)
  }

  let file_paths = files.map((f) => path.join(curpath, f))
  let stats = yield statFiles(file_paths)
  for (let i = 0; i < stats.length; i++) {
    const file_path = path.join(curpath, files[i])
    if (stats[i].isDirectory()) {
      fileArray = fileArray.concat(yield walk(file_path))
    }
    else {
      fileArray.push(file_path)
    }
  }
  return fileArray
})

/**
 * Stats image files in image folder
 */

const App = () => co(function* () {
  const root_path = 'images'
  const plugin_path = 'medium-plugin'
  const thumbnail_path = path.join(plugin_path, 'thumbnails')

  const fns = [walk(root_path).then(filterImage).then(ps => filterPath(ps, root_path)),
    walk(thumbnail_path).then(filterImage).then(ps => filterPath(ps, thumbnail_path))]

  const retval   = yield Promise.all(fns)
  const diffImgs = yield difference(retval)
  const info     = yield convertImages(diffImgs, root_path, thumbnail_path)

  console.log(info)
  
})

App()