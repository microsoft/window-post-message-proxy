interface IDeferred {
  resolve: <T>(value?: T | Thenable<T>) => void,
  reject: <T>(error: T) => void,
  promise: Promise<any>
}

interface IDeferredCache {
  [messageId: string]: IDeferred
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

export class WindowPostMessageProxy {
  // Static
  private static defaultAddTrackingProperties<T>(message: T, trackingProperties: ITrackingProperties): T {
    (<any>message)[WindowPostMessageProxy.messagePropertyName] = trackingProperties;
    return message;
  }
  private static defaultGetTrackingProperties(message: any): ITrackingProperties {
    return message[WindowPostMessageProxy.messagePropertyName];
  }
  
  private static defaultIsErrorMessage(message: any): boolean {
    return !!message.error;
  }
  
  private static messagePropertyName = "windowPostMesssageProxy";
  
  // Private
  private name: string;
  private addTrackingProperties: IAddTrackingProperties;
  private getTrackingProperties: IGetTrackingProperties;
  private isErrorMessage: IIsErrorMessage;
  private contentWindow: Window;
  private pendingRequestPromises: IDeferredCache = {};
  private handlers: IMessageHandler[];
  private windowMessageHandler: (e: MessageEvent) => any;

  constructor(
    contentWindow: Window,
    processTrackingProperties: IProcessTrackingProperties = {
      addTrackingProperties: WindowPostMessageProxy.defaultAddTrackingProperties,
      getTrackingProperties: WindowPostMessageProxy.defaultGetTrackingProperties
    },
    isErrorMessage: IIsErrorMessage = WindowPostMessageProxy.defaultIsErrorMessage
  ) {
    this.addTrackingProperties = processTrackingProperties.addTrackingProperties;
    this.getTrackingProperties = processTrackingProperties.getTrackingProperties;
    this.isErrorMessage = isErrorMessage;
    this.handlers = [];
    this.name = `WindowProxyMessageHandler(${WindowPostMessageProxy.createRandomString()})`;
    this.contentWindow = contentWindow;
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
    if(handlerIndex == -1) {
      throw new Error(`You attempted to remove a handler but no matching handler was found.`);
    }
    
    this.handlers.splice(handlerIndex, 1);
  }
  
  /**
   * Start listening to message events.
   */
  start() {
    window.addEventListener('message', this.windowMessageHandler);
  }
  
  /**
   * Stops listening to message events.
   */
  stop() {
    window.removeEventListener('message', this.windowMessageHandler);
  }
  
  /**
   * Post message to target window with tracking properties added and save deferred object referenced by tracking id.
   */
  postMessage<T>(message: any): Promise<T> {
    // Add tracking properties to indicate message came from this proxy
    const trackingProperties: ITrackingProperties = { id: WindowPostMessageProxy.createRandomString() };
    this.addTrackingProperties(message, trackingProperties);
    
    this.contentWindow.postMessage(message, "*");
    const deferred = WindowPostMessageProxy.createDeferred();
    this.pendingRequestPromises[trackingProperties.id] = deferred;
    
    return deferred.promise;
  }
  
  /**
   * Send response message to target window.
   * Response messages re-use tracking properties from a previous request message.
   */
  private sendResponse(message: any, trackingProperties: ITrackingProperties): void {
    this.addTrackingProperties(message, trackingProperties);
    this.contentWindow.postMessage(message, "*");
  }
  
  /**
   * Message handler.
   */
  private onMessageReceived(event: MessageEvent) {
    console.log(`${this.name} Received message:`);
    console.log(`type: ${event.type}`);
    console.log(JSON.stringify(event.data, null, '  '));

    let message:any = event.data;
    let trackingProperties: ITrackingProperties = this.getTrackingProperties(message);
    
    // If this proxy instance could not find tracking properties then disregard message since we can't reliably respond
    if (!trackingProperties) {
      return;
    }
    
    const deferred = this.pendingRequestPromises[trackingProperties.id];
    
    // If message does not have a known ID, treat it as a request
    // Otherwise, treat message as response
    if (!deferred) {
      const handled = this.handlers.some(handler => {
        if(handler.test(message)) {
          const responseMessage = handler.handle(message);
          this.sendResponse(responseMessage, trackingProperties);
          return true;
        }
      });
    }
    else {
      /**
       * If error message reject promise,
       * Otherwise, resolve promise
       */
      if (this.isErrorMessage(message)) {
        deferred.reject(message);
      }
      else {
        deferred.resolve(message);
      }
    }
  }

  /**
   * Utility to create a deferred object.
   */
  // TODO: Look to use RSVP library instead of doing this manually.
  // From what I searched RSVP would work better because it has .finally and .deferred but it doesn't have Typings information. 
  private static createDeferred(): IDeferred {
    const deferred: IDeferred = {
      resolve: null,
      reject: null,
      promise: null
    };
    
    const promise = new Promise((resolve: () => void, reject: () => void) => {
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
    return (Math.random() + 1).toString(36).substring(7);
  }
}