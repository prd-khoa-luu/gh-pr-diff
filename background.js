function extractPrInfo(url) {
  const pattern = /https:\/\/github.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
  const match = url.match(pattern);
  if (match) {
    const [_, owner, repo, prNumber] = match;
    return { owner, repo, prNumber };
  } else {
    throw new Error('Invalid GitHub PR URL');
  }
}

function constructDiffUrl(owner, repo, prNumber) {
  return `https://github.com/${owner}/${repo}/pull/${prNumber}.diff`;
}

function getPrDiff(url, ignoreContext) {
  return fetch(url, {
    credentials: 'include'
  }).then(response => {
    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.statusText}`);
    }
    return response.text();
  }).then(diff => {
    return diff.split('\n').filter(line => (
      !line.startsWith('diff --git ') &&
      !line.startsWith('index ') &&
      !line.startsWith('--- ') &&
      !line.startsWith('+++ ') &&
      !line.startsWith('@@ ') &&
      (!ignoreContext || line.startsWith('+') || line.startsWith('-'))
    )).join('\n');
  });
}

function parseDiff(diffText) {
  const files = {};
  let currentFile = null;
  let currentContent = [];

  const lines = diffText.split('\n');

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      // Save previous file if exists
      if (currentFile) {
        files[currentFile] = currentContent.join('\n');
      }

      // Extract new filename
      const match = line.match(/diff --git a\/(.+) b\/.+/);
      currentFile = match ? match[1] : null;
      currentContent = [];

    } else if (currentFile &&
               !line.startsWith('index ') &&
               !line.startsWith('--- ') &&
               !line.startsWith('+++ ') &&
               !line.startsWith('@@ ')) {
      currentContent.push(line);
    }
  }

  // Save the last file
  if (currentFile) {
    files[currentFile] = currentContent.join('\n');
  }

  return files;
}

function compareDiffs(diff1Files, diff2Files, selectedFiles, ignoreContext) {
  for (const filename of selectedFiles) {
    const content1 = diff1Files[filename] || '';
    const content2 = diff2Files[filename] || '';

    if (ignoreContext) {
      const filtered1 = content1.split('\n')
        .filter(line => line.startsWith('+') || line.startsWith('-'))
        .join('\n');
      const filtered2 = content2.split('\n')
        .filter(line => line.startsWith('+') || line.startsWith('-'))
        .join('\n');

      if (filtered1 !== filtered2) return false;
    } else {
      if (content1 !== content2) return false;
    }
  }

  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchFiles') {
    const { url } = message;
    try {
      const { owner, repo, prNumber } = extractPrInfo(url);
      const diffUrl = constructDiffUrl(owner, repo, prNumber);
      console.log("hehe")

      fetch(diffUrl, { credentials: 'include' })
        .then(response => response.text())
        .then(diff => {
          const files = parseDiff(diff);
          sendResponse({ files: Object.keys(files) });
        })
        .catch(error => sendResponse({ error: error.message }));

      return true;
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
  else if (message.action === 'compare') {
    try {
      const { url1, url2, ignoreContext, selectedFiles } = message;
      const { owner: owner1, repo: repo1, prNumber: pr1 } = extractPrInfo(url1);
      const { owner: owner2, repo: repo2, prNumber: pr2 } = extractPrInfo(url2);

      if (owner1 !== owner2 || repo1 !== repo2) {
        sendResponse({ error: 'The two PRs must be from the same repository.' });
        return;
      }

      const diffUrl1 = constructDiffUrl(owner1, repo1, pr1);
      const diffUrl2 = constructDiffUrl(owner2, repo2, pr2);

      Promise.all([
        fetch(diffUrl1, { credentials: 'include' }).then(r => r.text()),
        fetch(diffUrl2, { credentials: 'include' }).then(r => r.text())
      ]).then(([diff1Text, diff2Text]) => {
        const diff1Files = parseDiff(diff1Text);
        const diff2Files = parseDiff(diff2Text);
        const result = compareDiffs(diff1Files, diff2Files, selectedFiles, ignoreContext);
        sendResponse({ same: result });
      }).catch(error => {
        sendResponse({ error: error.message });
      });

      return true;
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
});
