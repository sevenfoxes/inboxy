var gulp        = require('gulp');
var gutil       = require('gulp-util');
var uglify      = require('gulp-uglify');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var watchify    = require('watchify');
var browserify  = require('browserify');
var reactify    = require('reactify');
var svgstore    = require('gulp-svgstore');
var svgmin      = require('gulp-svgmin');
var inject      = require('gulp-inject');
var cheerio     = require('gulp-cheerio');


//sass
var sass        = require("gulp-ruby-sass");
var filter      = require('gulp-filter');
var sourcemaps  = require('gulp-sourcemaps');

// browser-sync
var browserSync = require('browser-sync');
var reload      = browserSync.reload;

var path = {
  src: {
    root:   'src/',
    styles: 'src/scss/',
    js:     'src/js/',
    app:    './src/js/main.js',
    html:   ['src/index.html', 'src/**/*.jpg'],
    svg:    'src/svg/*.svg'
  },

  dist: {
    root:   'dist/',
    styles: 'dist/css/',
    js:     'dist/js/',
    app:    'main.js',
    svg:    'dist/img'
  }
};

var bundler = watchify(browserify({
  entries: [path.src.app],
  paths: [
    './node_modules',
    './src/js/actions',
    './src/js/components',
    './src/js/constants',
    './src/js/dispatchers',
    './src/js/stores'
  ]
}, watchify.args));
bundler.transform(reactify);

gulp.task('browserify', bundle);
bundler.on('update', bundle);
bundler.on('log', gutil.log);


function bundle() {
  return bundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(path.dist.app))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(path.dist.js))
    .pipe(reload({stream: true}));
}

gulp.task('copy', function() {
  gulp.src(path.src.html)
    .pipe(gulp.dest(path.dist.root))
    .pipe(reload({stream: true}));
});

gulp.task('sass', function() {
  return sass(path.src.styles, {sourcemap: true})
    .pipe(browserSync.reload({stream:true}))
    .on('error', function (err) {
      console.error('Error!', err.message);
    })
    .pipe(sourcemaps.write('maps', {
        includeContent: false,
        sourceRoot: path.dist.styles
    }))
    .pipe(gulp.dest(path.dist.styles));
});

gulp.task('svg', function () {
  var svgs = gulp
    .src('src/svg/*.svg')
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[width]').removeAttr('width');
        $('[height]').removeAttr('height');
      }
    }))
    .pipe(svgstore({ inlineSvg: true }));

  function fileContents (filePath, file) {
    return file.contents.toString();
  }

  return gulp
    .src('src/index.html')
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(gulp.dest('dist'));
});

gulp.task('browser-sync', ['svg', 'sass', 'browserify', 'copy'], function() {
  browserSync({
    server: {
      baseDir: "dist",
      https: false
    },
    ghostMode: true,
    notify: true,
    port: 9000,
    open: false,
    ui: {
      port: 9015,
      weinre: {
        port: 9016
      }
    }
  });

  gulp.watch(['src/**/*.html', 'src/**/*.jpg'], ['copy']);
  gulp.watch('src/**/*.js', ['browserify']);
  gulp.watch('src/scss/**/*.scss', ['sass']);
  gulp.watch('src/svg/**/*.svg', ['svg']);
});

gulp.task('default', ['browser-sync']);
