# window-post-message-proxy
[![npm](https://img.shields.io/npm/v/window-post-message-proxy.svg)](https://www.npmjs.com/package/window-post-message-proxy)
[![Total Downloads](https://img.shields.io/npm/dt/window-post-message-proxy.svg)](https://www.npmjs.com/package/window-post-message-proxy)
[![Monthly Downloads](https://img.shields.io/npm/dm/window-post-message-proxy.svg)](https://www.npmjs.com/package/window-post-message-proxy)
[![GitHub tag](https://img.shields.io/github/tag/microsoft/window-post-message-proxy.svg)](https://github.com/Microsoft/window-post-message-proxy)

A library used in place of the native window.postMessage, which when used on both the sending and receiving windows allows for nicer asynchronous promise messaging between the windows.

When sending messages using the proxy, it will apply a unique ID to the message, create a deferred object referenced by the ID, and pass the message on to the target window.
The target window will also have an instance of the windowPostMessage proxy setup, which will send back messages and preserve the unique ID.
The original sending instance then receives the response message with the ID and looks to see if there is a matching id in its cache. If so, it resolves the deferred object with the response.

## Documentation
### [https://microsoft.github.io/window-post-message-proxy](https://microsoft.github.io/window-post-message-proxy)

## Installation

```bash
npm install --save window-post-message-proxy
```

## Basic Usage

```typescript
// Setup
const iframe = document.getElementById("myFrame");
const windowPostMessageProxy = new WindowPostMessageProxy();

// Send message
const message = {
    key: "Value"
};

windowPostMessageProxy.postMessage(iframe.contentWindow, message)
    .then(response => {

    });
```

## Advanced Customization

### Customizing how tracking properties are added to the method

By default, the windowPostMessage proxy will store the tracking properties as an object on the message named `windowPostMessageProxy`.

This means if you call:

```typescript
const message = {
    key: "Value"
};

windowPostMessageProxy.postMessage(iframe.contentWindow, message);
```
The message is actually modified before it's sent to become:

```typescript
{
    windowPostMessageProxy: {
        id: "ebixvvlbwa3tvtjra4i"
    },
    key: "Value"
};
```

If you want to customize how the tracking properties are added to and retrieved from the message, you can pass settings to the constructor in the form of an object with two functions:

```typescript
export interface IProcessTrackingProperties {
  addTrackingProperties<T>(message: T, trackingProperties: ITrackingProperties): T;
  getTrackingProperties(message: any): ITrackingProperties;
}
```
`addTrackingProperties` takes a message and adds the tracking properties object and returns the message.
`getTrackingProperties` takes a message and extracts the tracking properties.


Example:

```typescript
const customProcessTrackingProperties = {
    addTrackingProperties(message, trackingProperties) {
        message.headers = {
            'tracking-id': trackingProperties.id
        };

        return message;
    },
    getTrackingProperties(message): ITrackingProperties {
        return {
            id: message.headers['tracking-id']
        };
    }
};
const windowPostMessageProxy = new WindowPostMessageProxy(customProcessTrackingProperties);
```

### Customizing how messages are detected as error responses.

By default, response messages are considered error messages if they contain an error property.

You can override this behavior by passing an `isErrorMessage` function at construction time:

```typescript
export interface IIsErrorMessage {
  (message: any): boolean;
}
```

Example:

```typescript
function isErrorMessage(message: any) {
    return !(200 <= message.status && message.status < 300);
}

const windowPostMessageProxy = new WindowPostMessageProxy({ isErrorMessage });
```

### Logging messages

By default, messages are not logged, but you can override this behavior by passing `logMessages: true` in the options object.

```typescript
const windowPostMessageProxy = new WindowPostMessageProxy({ logMessages: true });
```
This will print out a stringified JSON of each object that is received or sent by the specific instance.

### Supplying custom name
Each windowPostMessageProxy gives itself a randomly generated name so you can see which instance is communicating in the log messages.
Often times you may want to pass a custom name for the window on which the windowPostMessageProxy instance is running.

You can provided a name by passing `name: 'Iframe'` in the options object.

```typescript
const windowPostMessageProxy = new WindowPostMessageProxy({ name: 'Iframe' });
```

### Supress Warning Message about unhandled messages
By default, the window post message proxy will warn you if it receives a message that was not handled, since this is usually an indication of error. However,
if you register multiple window message handlers, the message may in fact be handled despite being unknown to the windowPostMessageProxy. In cases like this, this warning no longer applies, so you can disable it by setting `suppressWarnings: true`:

```typescript
const windowPostMessageProxy = new WindowPostMessageProxy({ suppressWarnings: true });
```

## Support

- **Feature Requests:** Submit your ideas and suggestions to the [Fabric Ideas Portal](https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Fideas.fabric.microsoft.com%2F&data=05%7C02%7COr.Shemesh%40microsoft.com%7C72ccde64806a4ff4237b08dce610afa7%7C72f988bf86f141af91ab2d7cd011db47%7C1%7C0%7C638638206567959909%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C0%7C%7C%7C&sdata=f8%2Blboxk11RF0P4KelMaE7FEUfStuxgUkTc8HiuBxr0%3D&reserved=0), where you can also vote on ideas from other developers.
- **Bug Reports and Technical Assistance:** Visit the [Fabric Developer Community Forum](https://nam06.safelinks.protection.outlook.com/?url=https%3A%2F%2Fcommunity.fabric.microsoft.com%2Ft5%2FDeveloper%2Fbd-p%2FDeveloper&data=05%7C02%7COr.Shemesh%40microsoft.com%7C66158ccfa9d0420897b808dce93e491f%7C72f988bf86f141af91ab2d7cd011db47%7C1%7C0%7C638641700929578580%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C0%7C%7C%7C&sdata=niYdcy8yLbG2X11WQhy3lkUgfboyYdT3oowYYfbtaDc%3D&reserved=0). Our team and community experts are ready to assist you.
- **Additional Support:** Contact your account manager or reach out to the [Fabric Support Team](https://support.fabric.microsoft.com/en-us/support/).
