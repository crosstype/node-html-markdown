const fs = require('fs');
const path = require('path');
const async = require('async');
const { fork } = require('child_process');


/* ****************************************************************************************************************** */
// region: Config / Const
/* ****************************************************************************************************************** */

const quickMode = process.argv[2] === 'quick'

const wrappers = fs
  .readdirSync(path.join(__dirname, 'wrapper'))
  .sort((a, b) => a.localeCompare(b))
  .map(filename => ({
      name: path.basename(filename, '.js').replace('_reuse', ' (reused instance)'),
      parser: path.join(__dirname, 'wrapper', filename)
    })
  );

const MAX_WIDTH = Math.max(...wrappers.map(wrapper => wrapper.name.length));

const SEPARATOR = '\n' + '-'.repeat(MAX_WIDTH + 41) + '\n';

// endregion


/* ****************************************************************************************************************** */
// region: Helpers
/* ****************************************************************************************************************** */

function formatName(name) {
  const left = MAX_WIDTH - name.length;
  let str = name;
  for (let i = 0; i < left; i++) str += ' ';
  return str;
}

function humanFileSize(size) {
  const i = Math.floor( Math.log(size) / Math.log(1024) );
  return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

/**
 * Turn seconds into written time form
 */
function humanTime(seconds) {
  let s = seconds;
  const hours = Math.floor(s / 3600);
  s -= (hours * 3600);
  const minutes = Math.floor(s / 60);
  s -= (minutes * 60);

  for (const n of [ hours, minutes, s ]) if (!isFinite(n) || isNaN(n)) return 'N/A';

  return (!hours && !minutes && seconds < 1) ? `${Math.round((s % 1) * 1000)}ms` :
         (!hours && !minutes) ? `${s.toFixed(2)}sec` :
         `${hours ? hours + 'hr, ' : ''}${minutes ? minutes + 'min, ' : ''}${Math.round(s)}sec`;
}

// endregion


/* ****************************************************************************************************************** */
// region: Implementation
/* ****************************************************************************************************************** */

(function run() {
  if (!quickMode) console.log('NOTE: Large mode is generally less reliable in most environments!');
  const stats = [];

  console.log(SEPARATOR);

  async.eachSeries(
    wrappers,
    function (item, done) {
      const runner = fork(path.join(__dirname, '_run.js'), void 0, { env: { QUICK_MODE: quickMode, LOG_PERF: true }});
      runner.send(item);
      runner.on('message', function (stat) {
        const name = formatName(item.name);
        const mean = stat.mean.toPrecision(6);
        const sd = stat.sd.toPrecision(6);
        const avgBytesPerSec = (stat.avgBytesPerMs * 1000);

        stats.push({ name, ...stat });
        console.log(`${name}: ${mean} ms/file ± ${sd} (${humanFileSize(avgBytesPerSec)}/s)`);
      });

      runner.on('close', function (n) {
        if (n) console.log('%s failed (exit code %d)', item.name, n);
        done();
      });
    },
    function () {
      console.log(SEPARATOR);
      console.log(
        `Total Files: ${stats[0].totalFiles}\n`+
        `Avg. file size: ${humanFileSize(stats[0].avgFileSize)}`
      );

      /* Get speed estimates */
      console.log(SEPARATOR);
      console.log(`Estimated processing times (fastest to slowest):`);
      const sortedStats = [ ...stats ].sort((a,b) => b.avgBytesPerMs - a.avgBytesPerMs)
      sortedStats.forEach(({ name, avgBytesPerMs }) => {
        console.log(`\n  [${name.trim()}]`);
        [ 100, 1024, 51200, 1048576, 52428800 ].map(kbSize => {
          const byteSize = kbSize * 1024;
          const secToComplete = ((byteSize / avgBytesPerMs) / 1000);
          const tag = humanFileSize(byteSize);
          const spacing = 8 - tag.length;
          console.log(`    ${tag}:${' '.repeat(spacing)}${humanTime(secToComplete)}`);
        }).join('\n')
      });

      /* Get comparisons */
      console.log(SEPARATOR);
      console.log(`Speed comparison - ${sortedStats[0].name.trim()} is: \n`);
      const fastestMean = sortedStats[0].mean;
      sortedStats.slice(1).forEach(({ name, mean }) =>
        console.log(`  ${((mean / fastestMean)).toFixed(2)} times as fast as ${name.trim()}`)
      );

      console.log(SEPARATOR);
    }
  );
})();

// endregion
