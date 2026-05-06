const notifier = require('node-notifier');

notifier.notify({
  title: 'Teste',
  message: 'Funcionou?'
});

console.log('rodou');