// Get the current tab's URL and set it as the value of the first input field
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabUrl = tabs[0].url;
  document.getElementById('url1').value = currentTabUrl;
});

document.getElementById('compare').addEventListener('click', () => {
  const url1 = document.getElementById('url1').value;
  const url2 = document.getElementById('url2').value;
  const ignoreContext = document.getElementById('ignoreContext').checked;
  const result = document.getElementById('result');

  result.textContent = 'Fetching diffs and comparing...';
  result.classList.remove('error', 'success', 'failure');
  result.classList.add('loading');

  if (!url1 || !url2) {
    result.textContent = 'Please enter both URLs.';
    result.classList.add('error');
    result.classList.remove('loading');
    return;
  }

  chrome.runtime.sendMessage({ action: 'compare', url1, url2, ignoreContext }, (response) => {
    result.classList.remove('loading');

    if (response.error) {
      result.textContent = `Error: ${response.error}`;
      result.classList.add('error');
    } else {
      if (response.same) {
        result.textContent = 'Perfect match! The PR diffs are identical! :)';
        result.classList.add('success');
      } else {
        result.textContent = 'Heads up! The PR diffs are different! :(';
        result.classList.add('failure');
      }
    }
  });
});
