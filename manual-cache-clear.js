// MANUAL CACHE CLEAR - Copy and paste this into browser console
// Then refresh the page to see fresh questions

console.log('🚨 MANUAL CACHE CLEAR STARTING...');

// Clear all localStorage
Object.keys(localStorage).forEach(key => {
  localStorage.removeItem(key);
});

// Clear all sessionStorage  
Object.keys(sessionStorage).forEach(key => {
  sessionStorage.removeItem(key);
});

// Clear IndexedDB if it exists
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name && db.name.includes('linguaflow')) {
        indexedDB.deleteDatabase(db.name);
      }
    });
  });
}

console.log('✅ ALL CACHES CLEARED! Refresh the page now.');
console.log('🔄 After refresh, you should see fresh AI-generated questions.');

// Force page refresh after 2 seconds
setTimeout(() => {
  window.location.reload();
}, 2000);