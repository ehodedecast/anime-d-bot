const fs = require('fs');

const PATH = './data/analytics.json';

function loadAnalytics() {

  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, '{}');
  }

  return JSON.parse(
    fs.readFileSync(PATH, 'utf8')
  );
}

function saveAnalytics(data) {

  fs.writeFileSync(
    PATH,
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  loadAnalytics,
  saveAnalytics
};