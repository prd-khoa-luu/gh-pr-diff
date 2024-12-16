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
    const url2 = document.getElementById('url2').value;
    const filesContentElement = document.getElementById('files-content');
    const loadingIndicator = document.getElementById('files-loading-indicator');

    // Clear previous content and errors
    filesContentElement.innerHTML = '';

    if (!url1 || !url2) {
      filesContentElement.innerHTML = `
        <div style="padding: 12px; color: #86181d; background-color: #ffeef0; border-radius: 4px;">
          Please enter both PR URLs to view files for comparison.
        </div>`;
      return;
    }

    // Show loading indicator
    loadingIndicator.style.display = 'block';

    Promise.all([
      new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'fetchFiles', url: url1 }, resolve);
      }),
      new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'fetchFiles', url: url2 }, resolve);
      })
    ]).then(([response1, response2]) => {
      // Hide loading indicator
      loadingIndicator.style.display = 'none';

      if (response1.error || response2.error) {
        filesContentElement.innerHTML = `
          <div style="padding: 12px; color: #86181d; background-color: #ffeef0; border-radius: 4px;">
            Error: ${response1.error || response2.error}
          </div>`;
        return;
      }

      // Merge and deduplicate files from both PRs
      const filesSet = new Set([
        ...(response1.files || []),
        ...(response2.files || [])
      ]);
      filesList = Array.from(filesSet).sort();
      renderFilesList();
    });
  }
});

function renderFilesList() {
  const filesContentElement = document.getElementById('files-content');
  const loadingIndicator = document.getElementById('files-loading-indicator');

  // Hide loading indicator
  loadingIndicator.style.display = 'none';

  if (filesList.length === 0) {
    filesContentElement.innerHTML = `
      <div style="padding: 12px; color: #24292e; background-color: #f6f8fa; border-radius: 4px;">
        No files found in either PR.
      </div>`;
    return;
  }

  filesContentElement.innerHTML = ''; // Clear existing content

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
    filesContentElement.appendChild(div);
  });
}

function resetFileSelection() {
  filesList = [];
  selectedFiles.clear();
  filesContent.style.display = 'none';
  fileSelector.classList.remove('expanded');

  // Clear the files content
  const filesContentElement = document.getElementById('files-content');
  if (filesContentElement) {
    filesContentElement.innerHTML = '';
  }
}

// Add event listeners for URL input changes
document.getElementById('url1').addEventListener('input', resetFileSelection);
document.getElementById('url2').addEventListener('input', resetFileSelection);

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

  chrome.runtime.sendMessage({
    action: 'compare',
    url1,
    url2,
    ignoreContext,
    selectedFiles: [...selectedFiles],
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
