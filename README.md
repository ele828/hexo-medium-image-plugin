# hexo-medium-image-plugin
A medium-like image lazyload plugin, the images will be loaded right after it appears on the page 
while scolling down, otherwise, it'll be presented in blur style. This plugin will only perform in post
page, because I didn't know how to inject JavaScrip and CSS into `index.html`, if you know how to do it,
plase let me know, I'd really appreciate it! This plugin will generate a `medium-image-plugin/` folder
inside `public/` folder for storing thumbnails. If you still have any problem, let me know please!
Hope it works for you!

## Demo

http://www.dobest.me

## Install

Note: Node V6.0 or higher is requird.

```
npm install hexo-medium-image-plugin --save
```

## Config

Specify your static image path in `_config.yml`.
```yaml
medium_image_plugin:
    image_path: 'img'
    max_width: 680 
```
`image_path` means where your images stored. `max_width` means the maximum of page width.

## Usage

If you want to use it in all pages, clean it first.

```
hexo clean
```

And then, re-generator all pages.
```
hexo g
```

## Todo
- [x] Scroll Listener
- [ ] Image Magnifier

## License
MIT