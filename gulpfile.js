const gulp = require('gulp');
const minifyCSS = require('gulp-csso');
const minify = require('gulp-minify');
const zip = require('gulp-zip');
const del = require('del');

var copyFiles = ['*fonts/**/*', '*images/**/*', '*_locales/**/*', '*.md', 'manifest.json', 'LICENSE', 'app/*.html'];

gulp.task('minify-css', function () {
    return gulp.src('app/*.css')
        .pipe(minifyCSS())
        .pipe(gulp.dest('build/app'))
});
gulp.task('minify-js', function () {
    gulp.src(['app/*.js'])
        .pipe(minify({
            ext: {
                min: '.js'
            },
            noSource: true,
        }))
        .pipe(gulp.dest('build/app'))
});
gulp.task('copyUnmodifiedFiles', function () {
    return gulp.src(copyFiles)
        .pipe(gulp.dest('build'));
});
gulp.task('zipresult', ['minify-css', 'minify-js', 'copyUnmodifiedFiles'], function () {
    return gulp.src('build/**')
        .pipe(zip('simple.zip'))
        .pipe(gulp.dest('./distribution'));
});
gulp.task('clean', ['zipresult'], function(){
    return del('build/**', {force:true});
});

gulp.task('default', ['minify-css', 'minify-js', 'copyUnmodifiedFiles', 'zipresult', 'clean']);
