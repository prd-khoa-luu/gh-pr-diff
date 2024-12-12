// Get the current tab's URL and set it as the value of the first input field
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTabUrl = tabs[0].url;
  document.getElementById('url1').value = currentTabUrl;
});

let filesList = [];
let selectedFiles = new Set();

// Initialize file selector
const fileSelector = document.getElementById('fileSelector');
const filesContent = document.getElementById('filesContent');

fileSelector.addEventListener('click', () => {
  const isExpanded = filesContent.style.display === 'block';
  filesContent.style.display = isExpanded ? 'none' : 'block';
  fileSelector.classList.toggle('expanded', !isExpanded);

  if (!isExpanded && filesList.length === 0) {
    // Fetch files when expanding for the first time
    const url1 = document.getElementById('url1').value;
    if (url1) {
      chrome.runtime.sendMessage({ action: 'fetchFiles', url: url1 }, (response) => {
        if (response.error) {
          console.error(response.error);
        } else {
          filesList = response.files;
          renderFilesList();
        }
      });
    }
  }
});

function renderFilesList() {
  const filesListElement = document.getElementById('filesList');
  filesListElement.innerHTML = '';

  filesList.forEach(file => {
    const div = document.createElement('div');
    div.className = 'file-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `file-${file}`;
    checkbox.checked = selectedFiles.has(file);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedFiles.add(file);
      } else {
        selectedFiles.delete(file);
      }
    });

    const label = document.createElement('label');
    label.htmlFor = `file-${file}`;
    label.textContent = file;

    div.appendChild(checkbox);
    div.appendChild(label);
    filesListElement.appendChild(div);
  });
}

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

  // If no files are selected, compare all files
  const filesToCompare = selectedFiles.size === 0 ? filesList : Array.from(selectedFiles);

  chrome.runtime.sendMessage({
    action: 'compare',
    url1,
    url2,
    ignoreContext,
    selectedFiles: filesToCompare
  }, (response) => {
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
