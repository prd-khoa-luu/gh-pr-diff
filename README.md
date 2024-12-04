# Github Pull Request Diff Comparison Tool
This is a Chrome extension for comparing 2 Github PRs.
A Firefox extension may come later :)

## Why?
This extension can help you compare 2 PRs, especially when one is a cherry-pick version of the other. No more silly cherry-pick mistakes!

## Installation
This extension is not available on the Chrome Web Store, so you need to install it manually.

1. Download the latest release from this repo
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" at the top left corner
5. Find and select the downloaded extension folder

## Usage
Follow these steps

1. Open 2 PRs in 2 tabs
2. Copy one of the PR URLs
3. Go to the other PR tab
4. Click the extension icon -- you will see that the first input box is automatically filled with the current tab URL
5. Paste the URL of the PR you copied in the second input box
6. Uncheck the "Ignore diff code context" checkbox if you want to take the code around the diffs into account when doing the comparison
7. Click "Compare"

Screenshots
* ![Usage](docs/image-1.png)
* ![Extension Popup](docs/image.png)


## TODOs
* Keyboard shortcut activation
* [v2] Showing diff details

## Acknowledgements
The favicon used in this project are provided by [Lucide](https://lucide.dev/).
