import { pipeline, decide, routeAction } from '../src/index.js';

console.log('--- decide ---');
console.log(decide({ clear: true, consequential: false, reversible: true }));

console.log('--- money blast ---');
console.log(
  routeAction({
    id: 'pay',
    allowed: true,
    clear: true,
    consequential: true,
    reversible: false,
    blastRadius: 'money'
  })
);

console.log('--- pipeline CRM ---');
console.log(
  pipeline({
    happened: 'Lead validated',
    next: 'Create CRM contact',
    clear: true,
    consequential: false,
    reversible: true,
    actionId: 'crm_create',
    blastRadius: 'write_reversible'
  })
);
