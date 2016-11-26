/**
 * Phaser Gulp Setup
 * 
 * The recipe provides:
 * 
 * - A local server
 * - CommonJS modules via browserify
 * - A LiveReload server to trigger browser refresh upon saving
 * - A deploy task for uploading to GitHub Pages
 *
 * Run "gulp" to start the default task, which builds the site and serves it.
 * Run with the command line flag "gulp -p" or "gulp --production" to enable
 * uglification of JS code. It is helpful while developing to NOT uglify code. 
 *
 * Note: An the environment variable is needed to get colored output in git bash
 * on windows. Add "export FORCE_COLOR=1" to the .bashrc file. Source: 
 *     https://github.com/MarkTiedemann/supports-color-bug
 */


// -- PATHS --------------------------------------------------------------------

var dest = "public"
var paths = {
    html: {
    	src: ["src/**/*.html"],
    	dest: dest
    },
    sass: {
    	src: ["src/**/*.{scss,sass}"],
    	dest: dest
    },
    jsLibs: {
    	src: ["src/js/libs/**/*.js"],
    	outputFile: "libs.js",
    	dest: dest + "/js"
    },
    js: {
    	entry: "src/js/main.js",
    	src: ["src/js/**/*.js"],
    	outputFile: "main.js",
    	dest: dest + "/js"
    },
    resources: {
        src: ["src/resources/**/*.*"],
        dest: dest + "/resources"
    },
    deploy: {
    	src: ["public/**/*.*"]
    }
};


// -- SETUP --------------------------------------------------------------------

// Gulp & gulp plugins
var gulp = require("gulp");
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");
var sourcemaps = require("gulp-sourcemaps");
var liveReload = require("gulp-livereload");
var order = require("gulp-order");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var newer = require("gulp-newer");
var ghPages = require("gulp-gh-pages");
var open = require("gulp-open");
var gutil = require("gulp-util");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var del = require("del");
var express = require("express");
var path = require("path");
var fs = require("fs");
var runSequence = require("run-sequence");
var gulpif = require("gulp-if");
var beep = require("beepbeep");
var plumber = require("gulp-plumber");
var eslint = require("gulp-eslint");

// Check the command line to see if this is a production build
var isProduction = (gutil.env.p || gutil.env.production);
console.log("Build environment: " + (isProduction ? "production" : "debug"));

function beepLogError(err) {
    beep();
    var stringError = err.messageFormatted || err.message || err.toString();
    var msg = [
        gutil.colors.bgRed.bold("Gulp error in plugin: " + err.plugin),
        gutil.colors.green(stringError),
        ""
    ].join("\n");
    gutil.log(msg);
    this.emit("end");
}


// -- BUILD TASKS --------------------------------------------------------------
// These gulp tasks take everything that is in src/, process them (e.g. turn
// SASS into css) and output them into public/.

// Copy HTML (src/ -> build/).  Pipe changes to LiveReload to trigger a reload.
gulp.task("copy-html", function () {
    return gulp.src(paths.html.src)
        .pipe(gulp.dest(paths.html.dest))
        .pipe(liveReload());
});

// Turn SASS in src/ into css in build/, autoprefixing CSS vendor prefixes and
// generating sourcemaps.  Pipe changes to LiveReload to trigger a reload.
gulp.task("sass", function () {
    // Convert SASS
    return gulp.src(paths.sass.src)
        .pipe(plumber({ errorHandler: beepLogError }))
        .pipe(sourcemaps.init())
            .pipe(sass({ outputStyle: "compressed" }))
            .pipe(autoprefixer({
                browsers: ["last 2 versions"],
                cascade: true
            }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.sass.dest))
        .pipe(liveReload());
});

// Combine, sourcemap and uglify vendor libraries (e.g. bootstrap, jquery, etc.)
// into build/js/libs.js.  This supports adding the libs in a particular order.
// Pipe changes to LiveReload to trigger a reload.
gulp.task("js-libs", function() {
    return gulp.src(paths.jsLibs.src)
        .pipe(plumber({ errorHandler: beepLogError }))
        .pipe(order([
            // Order the files here, if necessary
            "**/*.js" 
        ]))
        .pipe(sourcemaps.init())
            .pipe(concat(paths.jsLibs.outputFile))
            // Uglify only if we are in a production build
            .pipe(gulpif(isProduction, uglify()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.jsLibs.dest))
        .pipe(liveReload());
});

// Combine, sourcemap and uglify our JS libraries into main.js. This uses 
// browserify (CommonJS-style modules). 
gulp.task("js-browserify", function() {
    var b = browserify({
        entries: paths.js.entry,
        debug: true // Allow debugger statements
    })
    return b.bundle()    
            .on("error", function (err) {
                err.plugin = "Browserify";
                beepLogError.call(this, err);
            })
        .pipe(plumber({ errorHandler: beepLogError }))
        .pipe(source(paths.js.outputFile))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
            // Uglify only if we are in a production build
            .pipe(gulpif(isProduction, uglify()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.js.dest))
        .pipe(liveReload());
});

// Lint only our custom JS.
gulp.task("js-lint", function() {
    return gulp.src(paths.js.src)    
        .pipe(plumber({ errorHandler: beepLogError }))
        .pipe(eslint())
        .pipe(eslint.format());
});

// Take any (new) resources from src/resources over to build/resources.
gulp.task("resources", function () {
    return gulp.src(paths.resources.src)
        .pipe(newer(paths.resources.dest))
        .pipe(gulp.dest(paths.resources.dest))
        .pipe(liveReload());
});

// The build task will run all the individual build-related tasks above.
gulp.task("build", [
    "copy-html",
    "sass",
    "js-lint",
    "js-browserify",
    "js-libs",
    "resources"
]);


// -- RUNNING TASKS ------------------------------------------------------------
// These gulp tasks handle everything related to running the site.  Starting a
// local server, watching for changes to files, opening a browser, etc.

// Watch for changes and then trigger the appropraite build task.  This also
// starts a LiveReload server that can tell the browser to refresh the page.
gulp.task("watch", function () {
    liveReload.listen(); // Start the LiveReload server
    gulp.watch(paths.html.src, ["copy-html"]);
    gulp.watch(paths.jsLibs.src, ["js-libs"]);
    gulp.watch(paths.js.src, ["js-lint", "js-browserify"]);
    gulp.watch(paths.sass.src, ["sass"]);
    gulp.watch(paths.resources.src, ["resources"]);
});

// Start an express server that serves everything in build/ to localhost:8080/.
gulp.task("express-server", function () {
    var app = express();
    app.use(express.static(dest));
    app.listen(8080);
});

// Automatically open localhost:8080/ in the browser using whatever the default
// browser.
gulp.task("open", function() {
    return gulp.src(dest)
        .pipe(open({uri: "http://127.0.0.1:8080"}));
});

// The build task will run all the individual run-related tasks above.
gulp.task("run", [
    "watch",
    "express-server",
    "open"
]);


// -- DEPLOYING TASKS ----------------------------------------------------------
// These gulp tasks handle everything related to deploying the site to live
// server(s).

gulp.task("push:gh-pages", function () {
    return gulp.src(paths.deploy.src)
        .pipe(ghPages({
            remoteUrl: "https://github.com/retwedt/octo-chainsaw.git"
            // remoteUrl: "git@github.com:retwedt/octo-chainsaw.git"
        }));
});

// Build, deploy build/ folder to gh-pages and then clean up
gulp.task("deploy:gh-pages", function () {
    return runSequence("build", "push:gh-pages", "clean:publish");
});

// -- CLEANING TASKS ----------------------------------------------------------
// These gulp tasks handle deleting files.

gulp.task("clean:publish", function () {
    return del(["./.publish"]);
});


// -- DEFAULT TASK -------------------------------------------------------------
// This gulp task runs automatically when you don't specify task.

// Build and then run it.
gulp.task("default", function(callback) {
    runSequence("build", "run", callback);
});