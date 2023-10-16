import CustomRunner from './CustomRunner';

window.loadTimeData = null;
window.HIDDEN_CLASS = 'hidden';

document.addEventListener('DOMContentLoaded', () => {
  window.runner = new CustomRunner('#runner');
});
