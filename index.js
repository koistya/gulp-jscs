'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var Checker = require('jscs');
var loadConfigFile = require('jscs/lib/cli-config');

module.exports = function (options) {
	var out = [], checker;

	if (typeof options === 'object') {
		checker = options.esnext ? new Checker({esnext: true}) : new Checker();
		delete options.esnext;
		checker.registerDefaultRules();
		checker.configure(options);
	} else {
		checker = new Checker();
		checker.registerDefaultRules();
		checker.configure(loadConfigFile.load(options));
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-jscs', 'Streaming not supported'));
			return;
		}

		if (checker._isExcluded(file.path)) {
			cb(null, file);
			return;
		}

		try {
			var errors = checker.checkString(file.contents.toString(), file.relative);
			errors.getErrorList().forEach(function (err) {
				out.push(errors.explainError(err, true));
			});
		} catch (err) {
			out.push(err.message.replace('null:', file.relative + ':'));
		}

		cb(null, file);
	}, function (cb) {
		if (out.length > 0) {
			this.emit('error', new gutil.PluginError('gulp-jscs', out.join('\n\n'), {
				showStack: false
			}));
		}

		cb();
	});
};
