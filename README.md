# hexo-medium-image-plugin
A medium-like image plugin

## Demo

http://www.dobest.me

## Install

```
npm install hexo-medium-image-plugin --save
```

## Config

Specify your static image path.
```yaml
medium_image_plugin:
    image_path: 'img'
    max_width: 680 
```

## Usage

If you want to use it in all pages, clean it first.

```
hexo clean
```

And then, re-generator all pages.
```
hexo g
```

Done!