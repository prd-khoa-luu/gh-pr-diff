// Get the current tab's URL and set it as the value of the first input field
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabUrl = tabs[0].url;
  document.getElementById('url1').value = currentTabUrl;
});

document.getElementById('compare').addEventListener('click', () => {
  const url1 = document.getElementById('url1').value;
  const url2 = document.getElementById('url2').value;
  const ignoreContext = document.getElementById('ignoreContext').checked;
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const error = document.getElementById('error');

  loading.style.display = 'block';
  result.innerHTML = 'Result will show here';
  error.innerHTML = 'Error will show here';

  if (url1 && url2) {
    chrome.runtime.sendMessage({ action: 'compare', url1, url2, ignoreContext }, (response) => {
      loading.style.display = 'none';
      if (response.error) {
        result.textContent = `Error: ${response.error}`;
      } else {
        result.textContent = response.same ? 'The two pull requests have the same diff.' : 'The two pull requests do not have the same diff.';
      }
    });
  }
  else {
    error.innerHTML = 'Please enter both URLs.';
  }
});

document.getElementById('clear').addEventListener('click', function() {
  document.getElementById('url1').value = '';
  document.getElementById('url2').value = '';
  document.getElementById('result').innerHTML = 'Result will show here';
  document.getElementById('error').innerHTML = 'Error will show here';
});
