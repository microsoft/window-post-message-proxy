# Contributing

## Setup

Clone the repository:
```
git clone https://pbix.visualstudio.com/DefaultCollection/PaaS/Integrate/_git/window-post-message-proxy
```

Install global dependencies if needed:
```
npm install -g typescript gulp typings
```

Install local dependencies:
```
npm install
typings install
```

## Building
```
tsc -p .
```
Or if using VS Code: `Ctrl + Shift + B`

## Testing
```
npm test
```
> Note currently there seems to be a problem when running the tests using PhantomJS which is why the `--chrome` flag is coded into the test command.

Run tests with PhantomJS
```
gulp test
```

There are various command line arguments that can be passed to the test command to facilitate debugging:

Run tests with Chrome
```
gulp test --chrome
```

Enable  debug level logging for karma, and remove code coverage
```
gulp test --debug
```

Disable single run to remain open for debugging
```
gulp test --watch
```

These are often combined and typical command for debugging tests is:
```
gulp test --chrome --debug --watch
```