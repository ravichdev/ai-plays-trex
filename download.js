const http = require('https');
const fs = require('fs');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');

const download = function(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

const file = './public/neterror.tar.gz';
download( 'https://chromium.googlesource.com/chromium/src.git/+archive/refs/heads/master/components/neterror/resources.tar.gz', file, function() {
	decompress(file, './public/neterror', {
		plugins: [
			decompressTargz()
		]
	}).then(() => {
		fs.unlinkSync(file)
	});
} );