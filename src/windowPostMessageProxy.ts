declare global {
  interface Window {
    msCrypto: Crypto;
  }
}

interface IDeferred {
  resolve: <T>(value?: T | Promise<T>) => void;
  reject: <T>(error: T) => void;
  promise: Promise<any>;
}

interface IDeferredCache {
  [messageId: string]: IDeferred;
}

export interface ITrackingProperties {
  id: string;
}

export interface IAddTrackingProperties {
  <T>(message: T, trackingProperties: ITrackingProperties): T;
}

export interface IGetTrackingProperties {
  (message: any): ITrackingProperties;
}

export interface IProcessTrackingProperties {
  addTrackingProperties: IAddTrackingProperties;
  getTrackingProperties: IGetTrackingProperties;
}

export interface IIsErrorMessage {
  (message: any): boolean;
}

export interface IMessageHandler {
  test(message: any): boolean;
  handle(message: any): any;
}

export interface IWindowPostMessageProxyOptions {
  receiveWindow?: Window;
  processTrackingProperties?: IProcessTrackingProperties;
  isErrorMessage?: IIsErrorMessage;
  name?: string;
  logMessages?: boolean;
  eventSourceOverrideWindow?: Window;
  suppressWarnings?: boolean;
}

export class WindowPostMessageProxy {
  // Static
  static defaultAddTrackingProperties<T>(message: T, trackingProperties: ITrackingProperties): T {
    (<any>message)[WindowPostMessageProxy.messagePropertyName] = trackingProperties;
    return message;
  }
  static defaultGetTrackingProperties(message: any): ITrackingProperties {
    return message[WindowPostMessageProxy.messagePropertyName];
  }

  static defaultIsErrorMessage(message: any): boolean {
    return !!message.error;
  }

  private static messagePropertyName = "windowPostMessageProxy";
  /**
   * Utility to create a deferred object.
   */
  // TODO: Look to use RSVP library instead of doing this manually.
  // From what I searched RSVP would work better because it has .finally and .deferred; however, it doesn't have Typings information.
  private static createDeferred(): IDeferred {
    const deferred: IDeferred = {
      resolve: null,
      reject: null,
      promise: null
    };

    const promise = new Promise((resolve: (value: any) => void, reject: () => void) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    deferred.promise = promise;

    return deferred;
  }

  /**
   * Utility to generate random sequence of characters used as tracking id for promises.
   */
  private static createRandomString(): string {

    	// window.msCrypto for IE
    let cryptoObj = window.crypto || window.msCrypto;
    let randomValueArray = new Uint32Array(1);
    cryptoObj.getRandomValues(randomValueArray);

    return randomValueArray[0].toString(36).substring(1);
  }

  // Private
  private logMessages: boolean;
  private name: string;
  private addTrackingProperties: IAddTrackingProperties;
  private getTrackingProperties: IGetTrackingProperties;
  private isErrorMessage: IIsErrorMessage;
  private receiveWindow: Window;
  private pendingRequestPromises: IDeferredCache = {};
  private handlers: IMessageHandler[];
  private windowMessageHandler: (e: MessageEvent) => any;
  private eventSourceOverrideWindow: Window;
  private suppressWarnings: boolean;

  constructor(
    options: IWindowPostMessageProxyOptions = {
      processTrackingProperties: {
        addTrackingProperties: WindowPostMessageProxy.defaultAddTrackingProperties,
        getTrackingProperties: WindowPostMessageProxy.defaultGetTrackingProperties
      },
      isErrorMessage: WindowPostMessageProxy.defaultIsErrorMessage,
      receiveWindow: window,
      name: WindowPostMessageProxy.createRandomString()
    }) {

    // save options with defaults
    this.addTrackingProperties = (options.processTrackingProperties && options.processTrackingProperties.addTrackingProperties) || WindowPostMessageProxy.defaultAddTrackingProperties;
    this.getTrackingProperties = (options.processTrackingProperties && options.processTrackingProperties.getTrackingProperties) || WindowPostMessageProxy.defaultGetTrackingProperties;
    this.isErrorMessage = options.isErrorMessage || WindowPostMessageProxy.defaultIsErrorMessage;
    this.receiveWindow = options.receiveWindow || window;
    this.name = options.name || WindowPostMessageProxy.createRandomString();
    this.logMessages = options.logMessages || false;
    this.eventSourceOverrideWindow = options.eventSourceOverrideWindow;
    this.suppressWarnings = options.suppressWarnings || false;

    if (this.logMessages) {
      console.log(`new WindowPostMessageProxy created with name: ${this.name} receiving on window: ${this.receiveWindow.document.title}`);
    }

    // Initialize
    this.handlers = [];
    this.windowMessageHandler = (event: MessageEvent) => this.onMessageReceived(event);
    this.start();
  }

  /**
   * Adds handler.
   * If the first handler whose test method returns true will handle the message and provide a response.
   */
  addHandler(handler: IMessageHandler) {
    this.handlers.push(handler);
  }
  /**
   * Removes handler.
   * The reference must match the original object that was provided when adding the handler.
   */
  removeHandler(handler: IMessageHandler) {
    const handlerIndex = this.handlers.indexOf(handler);
    if (handlerIndex === -1) {
      throw new Error(`You attempted to remove a handler but no matching handler was found.`);
    }

    this.handlers.splice(handlerIndex, 1);
  }

  /**
   * Start listening to message events.
   */
  start() {
    this.receiveWindow.addEventListener('message', this.windowMessageHandler);
  }

  /**
   * Stops listening to message events.
   */
  stop() {
    this.receiveWindow.removeEventListener('message', this.windowMessageHandler);
  }

  /**
   * Post message to target window with tracking properties added and save deferred object referenced by tracking id.
   */
  postMessage<T>(targetWindow: Window, message: any): Promise<T> {
    // Add tracking properties to indicate message came from this proxy
    const trackingProperties: ITrackingProperties = { id: WindowPostMessageProxy.createRandomString() };
    this.addTrackingProperties(message, trackingProperties);

    if (this.logMessages) {
      console.log(`${this.name} Posting message:`);
      console.log(JSON.stringify(message, null, '  '));
    }

    targetWindow.postMessage(message, "*");
    const deferred = WindowPostMessageProxy.createDeferred();
    this.pendingRequestPromises[trackingProperties.id] = deferred;

    return deferred.promise;
  }

  /**
   * Send response message to target window.
   * Response messages re-use tracking properties from a previous request message.
   */
  private sendResponse(targetWindow: Window, message: any, trackingProperties: ITrackingProperties): void {
    this.addTrackingProperties(message, trackingProperties);

    if (this.logMessages) {
      console.log(`${this.name} Sending response:`);
      console.log(JSON.stringify(message, null, '  '));
    }

    targetWindow.postMessage(message, "*");
  }

  /**
   * Message handler.
   */
  private onMessageReceived(event: MessageEvent) {
    if (this.logMessages) {
      console.log(`${this.name} Received message:`);
      console.log(`type: ${event.type}`);
      console.log(JSON.stringify(event.data, null, '  '));
    }

    let sendingWindow = this.eventSourceOverrideWindow || event.source as Window;
    if (!sendingWindow) {
      return;
    }

    let message: any = event.data;

    if (typeof message !== "object") {
      if (!this.suppressWarnings) {
        console.warn(`Proxy(${this.name}): Received message that was not an object. Discarding message`);
      }
      return;
    }

    let trackingProperties: ITrackingProperties;
    try {
      trackingProperties = this.getTrackingProperties(message);
    }
    catch (e) {
      if (!this.suppressWarnings) {
        console.warn(`Proxy(${this.name}): Error occurred when attempting to get tracking properties from incoming message:`, JSON.stringify(message, null, '  '), "Error: ", e);
      }
    }

    let deferred: IDeferred;
    if (trackingProperties) {
      deferred = this.pendingRequestPromises[trackingProperties.id];
    }

    // If message does not have a known ID, treat it as a request
    // Otherwise, treat message as response
    if (!deferred) {
      const handled = this.handlers.some(handler => {
        let canMessageBeHandled = false;
        try {
          canMessageBeHandled = handler.test(message);
        }
        catch (e) {
          if (!this.suppressWarnings) {
            console.warn(`Proxy(${this.name}): Error occurred when handler was testing incoming message:`, JSON.stringify(message, null, '  '), "Error: ", e);
          }
        }

        if (canMessageBeHandled) {
          let responseMessagePromise: Promise<any>;

          try {
            responseMessagePromise = Promise.resolve(handler.handle(message));
          }
          catch (e) {
            if (!this.suppressWarnings) {
              console.warn(`Proxy(${this.name}): Error occurred when handler was processing incoming message:`, JSON.stringify(message, null, '  '), "Error: ", e);
            }
            responseMessagePromise = Promise.resolve();
          }

          responseMessagePromise
            .then(responseMessage => {
              if (!responseMessage) {
                const warningMessage = `Handler for message: ${JSON.stringify(message, null, '  ')} did not return a response message. The default response message will be returned instead.`;
                if (!this.suppressWarnings) {
                  console.warn(`Proxy(${this.name}): ${warningMessage}`);
                }
                responseMessage = {
                  warning: warningMessage
                };
              }
              this.sendResponse(sendingWindow, responseMessage, trackingProperties);
            });

          return true;
        }
      });

      /**
       * TODO: Consider returning an error message if nothing handled the message.
       * In the case of the Report receiving messages all of them should be handled,
       * however, in the case of the SDK receiving messages it's likely it won't register handlers
       * for all events. Perhaps make this an option at construction time.
       */
      if (!handled && !this.suppressWarnings) {
        console.warn(`Proxy(${this.name}) did not handle message. Handlers: ${this.handlers.length}  Message: ${JSON.stringify(message, null, '')}.`);
        // this.sendResponse({ notHandled: true }, trackingProperties);
      }
    }
    else {
      /**
       * If error message reject promise,
       * Otherwise, resolve promise
       */
      let isErrorMessage = true;
      try {
        isErrorMessage = this.isErrorMessage(message);
      }
      catch (e) {
        console.warn(`Proxy(${this.name}) Error occurred when trying to determine if message is consider an error response. Message: `, JSON.stringify(message, null, ''), 'Error: ', e);
      }

      if (isErrorMessage) {
        deferred.reject(message);
      }
      else {
        deferred.resolve(message);
      }

      // TODO: Move to .finally clause up where promise is created for better maitenance like original proxy code.
      delete this.pendingRequestPromises[trackingProperties.id];
    }
  }
}
