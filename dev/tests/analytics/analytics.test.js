const chalk =
  require('chalk').default;

async function run() {

  console.log(
    chalk.blue(
      '\n🧪 Empty suite\n'
    )
  );

  console.log(
    chalk.green(
      '✅ Suite placeholder passed\n'
    )
  );
}

module.exports = {
  run
};