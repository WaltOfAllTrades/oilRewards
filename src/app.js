import { initHome } from './features/home/home.js';
import { initCustomer } from './features/customer/customer.js';

function route() {
  const main = document.getElementById('main-content');

  // Cleanup previous page if needed
  if (main._cleanupCustomer) {
    main._cleanupCustomer();
    main._cleanupCustomer = null;
  }

  const hash = window.location.hash || '#home';
  const [page, param] = hash.slice(1).split('/');

  switch (page) {
    case 'customer':
      if (param) {
        initCustomer(main, param);
      } else {
        window.location.hash = '#home';
      }
      break;
    default:
      initHome(main);
      break;
  }
}

window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', route);
