const { series, parallel, src, dest } = require('gulp');
const minifyCSS = require('gulp-csso');
const minify = require('gulp-minify');
const zip = require('gulp-zip');
const del = require('del');

var copyFiles = ['*fonts/**/*', '*images/**/*', '*_locales/**/*', 'README.md', 'manifest.json', 'LICENSE', '*app/*.html'];

function minifyCss(cb) {
	return src('app/*.css')
	  .pipe(minifyCSS())
	  .pipe(dest('build/app'));
}

function minifyJs(cb) {
	return src(['app/*.js'])
	  .pipe(minify({
		ext: {
		  min: '.js'
		},
		noSource: true,
		mangle: true,
		compress: true
	  }))
	  .pipe(dest('build/app'))
}

function copyUnmodifiedFiles(cb) {
	return src(copyFiles).pipe(dest('build'));
}

function zipResults(cb) {
	return src('build/**')
	  .pipe(zip('simple.zip'))
	  .pipe(dest('./distribution'));
}

function clean(cb) {
	return del('build/**', {force:true});
}

exports.clean = clean;
exports.default = series(parallel(minifyCss, minifyJs, copyUnmodifiedFiles), zipResults, clean); 
