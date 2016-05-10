// SETUP

// Gulp & gulp plugins
var gulp = require("gulp");
var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");
var sourcemaps = require("gulp-sourcemaps");
var liveReload = require("gulp-livereload");
var merge = require("merge-stream");
var open = require('gulp-open');
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var newer = require("gulp-newer");

// for deploying to gh-pages
var ghPages = require("gulp-gh-pages");

// Other modules
var express = require("express");
var path = require("path");
var fs = require("fs");


// BUILD TASKS

gulp.task("html", function () {
	return gulp.src("src/html/*.*")
		.pipe(newer("public"))
		.pipe(gulp.dest("public"));
});

gulp.task("img", function () {
	return gulp.src("src/img/*.*")
		.pipe(newer("public/img"))
		.pipe(gulp.dest("public/img"));
});


// Convert from sass to css adding vendor prefixes along the way and generating
// a source map to allow for easier debugging in chrome.
gulp.task("sass", function () {
	// Configure a sass stream so that it logs errors properly
	var sassStream = sass({
		outputStyle: "expanded",
		includePaths: []
	});
	sassStream.on("error", sass.logError);

	return gulp.src("src/scss/*.scss")
		.pipe(sourcemaps.init())
			.pipe(sassStream)
			.pipe(autoprefixer({
				browsers: [
					// https://github.com/twbs/bootstrap-sass#sass-autoprefixer
					"Android 2.3",
					"Android >= 4",
					"Chrome >= 20",
					"Firefox >= 24",
					"Explorer >= 8",
					"iOS >= 6",
					"Opera >= 12",
					"Safari >= 6"
				],
				cascade: true
			}))
		.pipe(sourcemaps.write("maps"))
		.pipe(gulp.dest("public/css"))
		.pipe(liveReload());
});

// Copy bootstrap and jquery vendor libraries files into public/js folder
gulp.task("vendor-js", function() {
	var jquery = gulp.src("bower_components/jquery/dist/jquery.min.js")
		.pipe(gulp.dest("public/js"));
	var phaser = gulp.src("bower_components/phaser/build/phaser.min.js")
		.pipe(gulp.dest("public/js"));
	return merge(jquery, phaser);
});

// Uglify and sourcemap custom JS for the project into public/js/all.js
gulp.task("js", function() {
	return gulp.src("src/js/*.js")
		.pipe(sourcemaps.init())
			// .pipe(concat("all.js")) Disabling so separate pages can have separate JS!
			.pipe(uglify())
		.pipe(sourcemaps.write("maps"))
		.pipe(gulp.dest("public/js"))
		.pipe(liveReload());
});

gulp.task("build", [
	"html",
	"img",
	"sass",
	"vendor-js",
	"js"
]);


// RUN TASKS

// Watch for changes to HTML/SASS files and start a liveReload server
gulp.task("watch", function () {
	liveReload.listen();
	gulp.watch("src/js/*.js", ["js"]);
	gulp.watch("src/scss/*.scss", ["sass"]);
});

// Start an express server that serves public/ to localhost:8080
gulp.task("express-server", function () {
	var app = express();
	app.use(express.static(path.join(__dirname, "public")));
	app.listen(8080);
});

gulp.task("open", function() {
	return gulp.src(__filename)
		.pipe(open({ uri: "http://127.0.0.1:8080" }));
});

gulp.task("run", [
	"watch",
	"express-server",
	"open"
]);


// DEPLOY TASKS

// Default task is run when "gulp" is run from terminal
gulp.task("default", [
	"build",
	"run"
]);

// Build & deploy the public/ folder to gh-pages
gulp.task("gh-deploy", ["build"], function () {
  return gulp.src("./public/**/*")
	.pipe(ghPages({
		remoteUrl: "https://github.com/retwedt/octo-chainsaw.git"
	}));
});