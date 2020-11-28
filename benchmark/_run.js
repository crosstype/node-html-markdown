const Benchmark = require('./index.js');
const ProgressBar = require('progress');


/* ****************************************************************************************************************** *
 * Handlers
 * ****************************************************************************************************************** */

process.on('uncaughtException', function(e){
  console.error(e);
	process.exit(1);
});

process.on('message', function (item) {
	const bar = new ProgressBar('[:bar] :current / :total', {
		total: Benchmark.TOTAL,
		complete: '=',
		incomplete: ' ',
		width: 50
	});

  const parser = require(item.parser);
  const bench = new Benchmark(parser);

	bench.on('progress', () => bar.tick());

	bench.once('result', function (stat) {
	  const mean = stat.mean();
		process.send({
			mean: mean,
			sd: stat.sd(),
      totalFiles: Benchmark.TOTAL,
      avgFileSize: Benchmark.AVG_FILE_SIZE,
      avgBytesPerMs: Benchmark.AVG_FILE_SIZE / mean
		});
		process.exit(0);
	});
});
