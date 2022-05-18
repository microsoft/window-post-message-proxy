# Contributing

## Setup

Clone the repository:
```
git clone https://github.com/Microsoft/window-post-message-proxy
```

Navigate to the cloned directory

Install local dependencies:
```
npm install
```

## Building
```
npm run build
```
Or if using VS Code: `Ctrl + Shift + B`

## Testing
```
npm test
```

By default the tests run using PhantomJS

There are various command line arguments that can be passed to the test command to facilitate debugging:

Run tests with Chrome
```
npm test -- --chrome
```

Enable  debug level logging for karma, and remove code coverage
```
npm test -- --debug
```

Disable single run to remain open for debugging
```
npm test -- --watch
```

These are often combined and typical command for debugging tests is:
```
npm test -- --chrome --debug --watch
```