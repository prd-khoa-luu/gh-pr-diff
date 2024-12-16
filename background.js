  const pattern = /^https:\/\/github.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(\/.*)?$/;
    const [_, owner, repo, prNumber, __] = match;
  // doc: https://git-scm.com/docs/diff-format/2.9.5#_generating_patches_with_p
  const isMetadataLine = line =>
    line.startsWith('index ') ||
    line.startsWith('--- ') ||
    line.startsWith('+++ ') ||
    line.startsWith('@@ ') ||
    line.startsWith('old mode ') ||
    line.startsWith('new mode ') ||
    line.startsWith('deleted file mode ') ||
    line.startsWith('new file mode ') ||
    line.startsWith('copy from ') ||
    line.startsWith('copy to ') ||
    line.startsWith('rename from ') ||
    line.startsWith('rename to ') ||
    line.startsWith('similarity index ') ||
    line.startsWith('dissimilarity index ');

  const extractFilename = line => {
    const match = line.match(/diff --git a\/(.+) b\/.+/);
    return match ? match[1] : null;
  };

  const fileChunks = diffText.split('diff --git ').slice(1);

  return fileChunks.reduce((files, chunk) => {
    const lines = chunk.split('\n');
    const filename = extractFilename(`diff --git ${lines[0]}`);
    if (filename) {
      const content = lines.slice(1).filter(line => !isMetadataLine(line)).join('\n');
      files[filename] = content;
    return files;
  }, {});
  // If no files are selected, compare all files
  if (!selectedFiles || selectedFiles.length === 0) {
    selectedFiles = [...new Set([...Object.keys(diff1Files), ...Object.keys(diff2Files)])];
  }

        .then(response => {
          if (!response.ok) {
            throw new Error(`Request to ${response.url} failed with status ${response.status}`);
          }
          return response.text();
        })
      // TODO: remove this check for the use case where we need to compare PRs from different repos
        fetch(diffUrl1, { credentials: 'include' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Request to ${response.url} failed with status ${response.status}`);
            }
            return response.text();
          }),
        fetch(diffUrl2, { credentials: 'include' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Request to ${response.url} failed with status ${response.status}`);
            }
            return response.text();
          })