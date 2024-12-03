// Get the current tab's URL and set it as the value of the first input field
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabUrl = tabs[0].url;
  document.getElementById('url1').value = currentTabUrl;
});

document.getElementById('compare').addEventListener('click', () => {
  const url1 = document.getElementById('url1').value;
  const url2 = document.getElementById('url2').value;

  if (url1 && url2) {
    chrome.runtime.sendMessage({ action: 'compare', url1, url2 }, (response) => {
      const resultDiv = document.getElementById('result');
      if (response.error) {
        resultDiv.textContent = `Error: ${response.error}`;
      } else {
        resultDiv.textContent = response.same ? 'The two pull requests have the same diff.' : 'The two pull requests do not have the same diff.';
      }
    });
  }
});