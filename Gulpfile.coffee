gulp = require 'gulp'
plugins = require('gulp-load-plugins')(
  pattern: ['gulp-*', 'gulp.*', 'del', 'nib'],
  replaceString: /\bgulp[\-.]/
)


# Asset source and destination directories
distPath = './dist'
srcPath = './src'
bowerPath = './bower_components'


# Javascript library files
jsLibFiles = [
  bowerPath+'/jquery/dist/jquery.js',
  bowerPath+'/underscore/underscore.js',
  bowerPath+'/iscroll/build/iscroll.js'
]

# Javascript source files (Coffeescript)
jsFiles = [
  srcPath+'/js/asse-slider.coffee',
  srcPath+'/js/main.coffee'
]

# CSS source files (bower)
cssLibFiles = [
    bowerPath+'/normalize.css/normalize.css',
    bowerPath+'/fontawesome/css/font-awesome.css'
]

fontFiles = [
    bowerPath+'/fontawesome/fonts/fontawesome-webfont.ttf',
    bowerPath+'/fontawesome/fonts/fontawesome-webfont.eot',
    bowerPath+'/fontawesome/fonts/fontawesome-webfont.woff',
    bowerPath+'/fontawesome/fonts/fontawesome-webfont.woff2',
    bowerPath+'/fontawesome/fonts/fontawesome-webfont.svg'
]


gulp.task 'copy-fonts', ->
  gulp.src fontFiles
    .pipe gulp.dest distPath+'/examples/fonts'


gulp.task 'copy-css', ['copy-fonts'], ->
  gulp.src cssLibFiles
    .pipe gulp.dest distPath+'/examples/css'


# Build CSS from stylus sources
gulp.task 'build-css', ['copy-css'], ->
  gulp.src srcPath+'/examples/css/*.styl'
    .pipe plugins.plumber()
    .pipe plugins.sourcemaps.init()
    .pipe plugins.stylus
      use: plugins.nib()
    .pipe plugins.autoprefixer
      browsers:['last 10 versions']
    .pipe plugins.sourcemaps.write()
    .pipe gulp.dest distPath+'/examples/css'


# Delete generated css/js files from dist directory
# and vendor files in src directory copied from
# bower_components
gulp.task 'clean', (cb)->
  plugins.del [
    distPath+'/css/*.css',
    distPath+'/js/*.js',
    distPath+'/html'
  ], cb


# Coffeescript compilation
gulp.task 'build-js', ->
  gulp.src jsFiles
    .pipe plugins.plumber()
    .pipe plugins.coffeelint()
    .pipe plugins.coffeelint.reporter()
    .pipe plugins.sourcemaps.init()
    .pipe plugins.coffee()
    .pipe plugins.sourcemaps.write()
    .pipe plugins.concat 'asse-slider.js'
    .pipe gulp.dest distPath+'/js'


# Uglify Javascript
gulp.task 'uglify-js', ['build-js'], ->
  gulp.src [distPath+'/js/*.js', '!'+distPath+'/js/*.min.js']
    .pipe plugins.uglify().on('error', plugins.util.log)
    .pipe plugins.rename
      suffix: '.min'
    .pipe gulp.dest distPath+'/js'


# Compile jade templates
gulp.task 'jade-tpl', ->
  gulp.src [srcPath+'/examples/**/*.jade', '!'+srcPath+'/examples/mixins/*.jade', '!'+srcPath+'/examples/layouts/*.jade']
    .pipe plugins.plumber()
    .pipe plugins.jade pretty: true
    .pipe gulp.dest distPath+'/examples/'



# Default: Build theme and keep watching for changes
gulp.task 'default', ['clean'], ->

  gulp.src srcPath+'/examples/css/**/*.styl'
    .pipe plugins.watch srcPath+'/examples/css/**/*.styl', ->
      gulp.start 'build-css'

  gulp.src srcPath+'/js/*.coffee'
    .pipe plugins.watch srcPath+'/js/**/*.coffee', ->
      gulp.start 'uglify-js'

  gulp.src srcPath+'/examples/**/*.jade'
    .pipe plugins.watch srcPath+'/examples/**/*.jade', ->
      gulp.start 'jade-tpl'


# Build without watch
gulp.task 'build', ['clean'], ->
  gulp.start 'build-css'
  gulp.start 'uglify-js'
  gulp.start 'jade-tpl'

