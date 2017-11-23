import gulp from "gulp";
import sass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import cp from "child_process";
import gutil from "gulp-util";
import postcss from "gulp-postcss";
import cssImport from "postcss-import";
import neatgrid from "postcss-neat";
import nestedcss from "postcss-nested";
import colorfunctions from "postcss-colour-functions";
import hdBackgrounds from "postcss-at2x";
import cssextend from "postcss-simple-extend";
import BrowserSync from "browser-sync";
import webpack from "webpack";
import webpackConfig from "./webpack.conf";

const browserSync = BrowserSync.create();
const hugoBin = "hugo";
const defaultArgs = ["-d", "../dist", "-s", "site", "-v"];

gulp.task("hugo", (cb) => buildSite(cb));
gulp.task("hugo-preview", (cb) => buildSite(cb, ["--buildDrafts", "--buildFuture"]));

gulp.task("build", ["css", "js", "videos", "images", "hugo", "fonts", "scss"]);
gulp.task("build-preview", ["css", "js", "videos", "images", "fonts", "hugo-preview", "scss"]);

gulp.task("css", () => (
  gulp.src("./src/css/*.css")
    .pipe(postcss([
      cssImport({from: "./src/css/main.css"}),
      neatgrid(),
      colorfunctions(),
      nestedcss(),
      hdBackgrounds(),
      cssextend()]))
    .pipe(gulp.dest("./dist/css"))
    .pipe(browserSync.stream())
));
gulp.task("scss", () => (
  gulp.src("./src/scss/*.scss")
    .pipe(sass({
        outputStyle : "compressed"
    }))
    .pipe(autoprefixer({
        browsers : ["last 20 versions"]
    }))
    .pipe(gulp.dest("./dist/css"))
    .pipe(browserSync.stream())
));

gulp.task("js", (cb) => {
  const myConfig = Object.assign({}, webpackConfig);

  webpack(myConfig, (err, stats) => {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      colors: true,
      progress: true
    }));
    browserSync.reload();
    cb();
  });

  gulp.src(["./src/js/**/*", "!./src/js/app.js", "!./src/js/cms.js", "!./src/js/cms/**/*"])
    .pipe(gulp.dest("./dist/js"))
    .pipe(browserSync.stream())
});

gulp.task("videos", () => (
  gulp.src("./src/videos/**/*")
    .pipe(gulp.dest("./dist/videos"))
    .pipe(browserSync.stream())
));

gulp.task("fonts", () => (
  gulp.src("./src/fonts/**/*")
    .pipe(gulp.dest("./dist/fonts"))
    .pipe(browserSync.stream())
));

gulp.task("images", () => (
  gulp.src("./src/img/**/*")
    .pipe(gulp.dest("./dist/img"))
    .pipe(browserSync.stream())
));

gulp.task("server", ["hugo", "css", "js", "videos", "images", "fonts", "scss"], () => {
  browserSync.init({
    server: {
      baseDir: "./dist"
    },
    notify: false
  });
  gulp.watch("./src/js/**/*.js", ["js"]);
  gulp.watch("./src/css/**/*.css", ["css"]);
  gulp.watch("./src/scss/**/*.scss", ["scss"]);
  gulp.watch("./src/img/**/*", ["images"]);
  gulp.watch("./src/videos/**/*", ["videos"]);
  gulp.watch("./src/fonts/**/*", ["fonts"])
  gulp.watch("./site/**/*", ["hugo"]);
});

function buildSite(cb, options) {
  const args = options ? defaultArgs.concat(options) : defaultArgs;

  return cp.spawn(hugoBin, args, {stdio: "inherit"}).on("close", (code) => {
    if (code === 0) {
      browserSync.reload();
      cb();
    } else {
      browserSync.notify("Hugo build failed :(");
      cb("Hugo build failed");
    }
  });
}
