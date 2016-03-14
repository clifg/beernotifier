module.exports = {
    // 'work' should be a function that takes a callback that expects two
    // parameters: err, result
    // err is null if there is no error. If err is non-null, we'll repeat
    // up to maxAttempts times. If the last attempt still fails, we return
    // that to the done callback.
    retry: function(work, maxAttempts, done) {
        work(function(err, result) {
            if (err) {
                console.log('RETRY: Attempt failed, max attempts = ' + maxAttempts);
            }
            if (!err || (maxAttempts <= 1)) {
                return done(err, result);
            }
            return module.exports.retry(work, maxAttempts - 1, done);
        });
    }
};