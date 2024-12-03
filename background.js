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

function getPrDiff(url) {
  return fetch(url, {
    credentials: 'include'
  }).then(response => {
    if (!response.ok) {
      throw new Error(`GitHub request failed: ${response.statusText}`);
    }
    return response.text();
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'compare') {
    try {
      const { url1, url2 } = message;

      const { owner: owner1, repo: repo1, prNumber: pr1 } = extractPrInfo(url1);
      const { owner: owner2, repo: repo2, prNumber: pr2 } = extractPrInfo(url2);

      if (owner1 !== owner2 || repo1 !== repo2) {
        sendResponse({ error: 'The two PRs must be from the same repository.' });
        return;
      }

      const diffUrl1 = constructDiffUrl(owner1, repo1, pr1);
      const diffUrl2 = constructDiffUrl(owner2, repo2, pr2);

      Promise.all([
        getPrDiff(diffUrl1),
        getPrDiff(diffUrl2)
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
