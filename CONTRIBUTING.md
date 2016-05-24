# Contributing

## Setup

Clone the repository:
```
git clone https://pbix.visualstudio.com/DefaultCollection/PaaS/_git/window-post-message-proxy
```

Install global dependencies:
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
Or if using VSCode: `Ctrl + Shift + B`

## Testing
```
npm test
```
or use gulp directly:
```
gulp test
```

Run tests with Chrome and close when finished
```
gulp test --debug
```

Run tests with Chrome and remain open for debugging
```
gulp test --debug --watch
```