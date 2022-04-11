const fs = require('fs');
const path = require('path');
const util = require('util');
const events = require('events');
const async = require('async');
const summary = require('summary');


/* ****************************************************************************************************************** */
// region: Load files
/* ****************************************************************************************************************** */

const fileNames = fs.readdirSync(path.resolve(__dirname, 'files'));
const FILES = [];
for (let i = 0; i < fileNames.length; i++) {
  if (process.env.QUICK_MODE === 'true' && i >= 25) break;

  const fileName = fileNames[i];
  const filePath = path.resolve(__dirname, 'files', fileName);
  FILES.push({
    key: path.basename(fileName, '.html'),
    file: filePath,
    fileSize: fs.statSync(filePath).size
  });
}

// endregion


/* ****************************************************************************************************************** */
// region: Benchmark
/* ****************************************************************************************************************** */

function Benchmark(parser) {
  if (!(this instanceof Benchmark)) return new Benchmark(parser);

  this._parser = parser;
  async.mapSeries(FILES, this._file.bind(this), this._done.bind(this));
}

// The total amount of files
Benchmark.TOTAL = FILES.length;

// Average file size
Benchmark.AVG_FILE_SIZE = Math.round(FILES.reduce((acc, { fileSize }) => acc + fileSize, 0) / FILES.length);

// Parse a file
Benchmark.prototype._file = function (item, done) {
  const self = this;

  fs.readFile(item.file, 'utf8', function (err, html) {
    if (err) return done(err);

    const tic = process.hrtime();
    self._parser(html, function (err) {
      const toc = process.hrtime(tic);

      if (err) {
        done(err, toc);
      } else {
        self.emit('progress', item.key);
        done(null, toc);
      }
    });
  });
};

// Benchmark for this parser is done
Benchmark.prototype._done = function (err, times) {
  if (err) return this.emit('error', err);

  const stat = summary(times.map(function (time) {
    return time[0] * 1e3 + time[1] / 1e6;
  }));

  this.emit('result', stat);
};

util.inherits(Benchmark, events.EventEmitter);

// endregion


/* ****************************************************************************************************************** *
 * Exports
 * ****************************************************************************************************************** */

module.exports = Benchmark;
