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

function getPrDiff(owner, repo, prNumber) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
  return fetch(url, {
    headers: { 'Accept': 'application/vnd.github.v3.diff' },
    credentials: 'include'
  }).then(response => response.text());
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'compare') {
    try {
      const { owner: owner1, repo: repo1, prNumber: pr1 } = extractPrInfo(message.url1);
      const { owner: owner2, repo: repo2, prNumber: pr2 } = extractPrInfo(message.url2);

      if (owner1 !== owner2 || repo1 !== repo2) {
        sendResponse({ error: 'The two PRs must be from the same repository.' });
        return;
      }

      Promise.all([
        getPrDiff(owner1, repo1, pr1),
        getPrDiff(owner2, repo2, pr2)
      ]).then(([diff1, diff2]) => {
        sendResponse({ same: diff1 === diff2 });
      }).catch(error => {
        sendResponse({ error: error.message });
      });

    } catch (error) {
      sendResponse({ error: error.message });
    }

    return true; // Indicates that the response will be sent asynchronously
  }
});
