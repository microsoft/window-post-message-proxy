import * as wpmp from '../src/windowPostMessageProxy';

function createDeferred(): wpmp.IDeferred {
    const deferred: wpmp.IDeferred = {
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

describe('windowPostMessageProxy', function () {
  describe('test with proxy configured to message own window', function () {
    let windowPostMessageProxy: wpmp.WindowPostMessageProxy;
    let iframeWindowPostMessageProxy: wpmp.WindowPostMessageProxy;
    let handler: wpmp.IMessageHandler;
    let spyHandler: {
      test: jasmine.Spy,
      handle: jasmine.Spy
    };
    let iframe: HTMLIFrameElement;
    let iframe2: HTMLIFrameElement;
    let iframeLoaded: Promise<void>;
    let iframe2Loaded: Promise<void>;
    
    beforeAll(function () {
      const iframeSrc = "base/tmp/noop.html";
      const $iframe = $(`<iframe src="${iframeSrc}" id="testiframe"></iframe>`).appendTo(document.body);
      const $iframe2 = $(`<iframe src="${iframeSrc}" id="testiframe"></iframe>`).appendTo(document.body);
      iframe = <HTMLIFrameElement>$iframe.get(0);
      iframe2 = <HTMLIFrameElement>$iframe2.get(0);
      
      windowPostMessageProxy = new wpmp.WindowPostMessageProxy(iframe.contentWindow, {
        name: "hostProxyDefaultNoHandlers"
      });
      iframeWindowPostMessageProxy = new wpmp.WindowPostMessageProxy(window, {
          receiveWindow: iframe.contentWindow,
          name: "iframeProxyWithHandler"
      });
      
      handler = {
        test: jasmine.createSpy("testSpy").and.returnValue(true),
        handle: jasmine.createSpy("handleSpy").and.callFake(function (message: any) {
          message.handled = true;
          return message;
        })
      };
      
      spyHandler = <any>handler;
      
      iframeWindowPostMessageProxy.addHandler(handler);
      
      const iframeLoadedDeferred = createDeferred();
      iframe.addEventListener('load', () => {
        iframeLoadedDeferred.resolve();
      });
      iframeLoaded = iframeLoadedDeferred.promise;
      
      const iframe2LoadedDeferred = createDeferred();
      iframe2.addEventListener('load', () => {
        iframe2LoadedDeferred.resolve();
      });
      iframe2Loaded = iframe2LoadedDeferred.promise;
    });
    
    afterAll(function () { 
      windowPostMessageProxy.stop();
    });
    
    beforeEach(() => {
      // empty
    });
    
    afterEach(function () {
      spyHandler.test.calls.reset();
      spyHandler.handle.calls.reset();
    });

    it('postMessage returns a promise which is resolved if a response with matching id is observed and message is NOT considered an error message', function (done) {
      // Arrange
      const testData = {
        message: {
          messageTest: "abc123"
        },
        responseMessage: {
          handled: true,
          messageTest: "abc123"
        }
      };
      
      // Act
      iframeLoaded
        .then(() => {
          windowPostMessageProxy.postMessage(testData.message)
            .then((response:any) => {
              expect(spyHandler.handle).toHaveBeenCalled();
              expect(response.messageTest).toEqual(testData.message.messageTest);
              done();
            });
        });
      
      // Assert
    });
    
    it('postMessage returns a proimse which is rejected if a response with matching id is observed and message is considered an error message', function (done) {
      // Arrange
      const testData = {
        message: {
          error: true
        },
        responseMessage: {
          error: true,
          handled: true
        }
      };
      
      // Act
      iframeLoaded
        .then(() => {
          windowPostMessageProxy.postMessage(testData.message)
            .catch((message:any) => {
              expect(spyHandler.handle).toHaveBeenCalled();
              expect(message.error).toEqual(true);
              done();
            });
        });
      
      // Assert
    });
    
    it('By default tracking data is added to the message using the default method', function (done) {
      // Arrange
      const testData = {
        message: {
          someKey: true
        }
      };
      
      // Act
      iframeLoaded
        .then(() => {
          windowPostMessageProxy.postMessage(testData.message)
            .then((message:any) => {
              expect(message.windowPostMessageProxy.id).toBeDefined();
              done();
            });
        });
      
      // Assert
    });

    it("consumers can override how tracking id is added and retrieved from the message by passing in object at construction time.", function (done) {
      // Setup
      windowPostMessageProxy.stop();
      iframeWindowPostMessageProxy.stop();
      
      // Arrange
      const testData = {
        message: {
          someKey: true
        }
      };
      const customTrackingPropertiesProcess: wpmp.IProcessTrackingProperties = {
        addTrackingProperties(message: any, trackingProperties: wpmp.ITrackingProperties) {
          message.headers = message.headers || {};
          message.headers.id = trackingProperties.id;
          
          return message;
        },
        getTrackingProperties(message): wpmp.ITrackingProperties {
          return {
            id: message.headers.id
          };
        }
      };
      
      const customWindowPostMessageProxy = new wpmp.WindowPostMessageProxy(iframe2.contentWindow, {
        processTrackingProperties: customTrackingPropertiesProcess,
        name: "Override TrackingId"
      });
      const customIframeWindowPostMessageProxy = new wpmp.WindowPostMessageProxy(window, {
        receiveWindow: iframe2.contentWindow,
        processTrackingProperties: customTrackingPropertiesProcess,
        name: "Iframe Override TrackingId"
      });
      customIframeWindowPostMessageProxy.addHandler(handler);
      
      // Act
      iframe2Loaded
        .then(() => {
          return customWindowPostMessageProxy.postMessage(testData.message)
            .then((message:any) => {
              expect(message.headers.id).toBeDefined();
            });
        })
        .then(() => {
          customWindowPostMessageProxy.stop();
          customIframeWindowPostMessageProxy.stop();
          done();
        });
      
      // Assert
      
      // Cleanup
    });
    
    it("consumers can override how to determine if a message is an error by passing a function at construction time", function (done) {
      // Arrange
      const testData = {
        message: {
          error: true
        },
        errorMessage: {
          isError: true
        }
      };
      const customIsError: wpmp.IIsErrorMessage = (message: any) => {
        return message.isError;
      };
      
      const customIsErrorWindowPostMessageProxy = new wpmp.WindowPostMessageProxy(iframe2.contentWindow, {
        isErrorMessage: customIsError,
        name: "OverRide IsError"
      });
      const customIsErrorIframeWindowPostMessageProxy = new wpmp.WindowPostMessageProxy(window, {
        receiveWindow: iframe2.contentWindow,
        isErrorMessage: customIsError,
        name: "OverRide IsError"
      });
      customIsErrorIframeWindowPostMessageProxy.addHandler(handler);
      
      // Act
      iframe2Loaded
        .then(() => {
          return customIsErrorWindowPostMessageProxy.postMessage(testData.message)
            .then((message:any) => {
              expect(message.windowPostMessageProxy.id).toBeDefined();
            });
        })
        .then(() => {
          return customIsErrorWindowPostMessageProxy.postMessage(testData.errorMessage)
            .catch((message:any) => {
              expect(message.windowPostMessageProxy.id).toBeDefined();
            });
        })
        .then(() => {
          customIsErrorWindowPostMessageProxy.stop();
          customIsErrorIframeWindowPostMessageProxy.stop();
          done();
        });
      
      // Assert
      
      // Cleanup
    });
  });
  
  // // Goal is to test entire post message protocol against live embed page by sending messages and testing response.
  // // Although this library is suppose to be indepdent of PowerBI's particular use case so these tests should probably live with ReportEmbed pages tests.
  // xdescribe('test with actual report embed page', function () {
  //   let windowPostMessageProxy: wpmp.WindowPostMessageProxy;
  //   let iframe: HTMLIFrameElement;
  //   let iframeLoaded: JQueryPromise<void>;

  //   beforeAll(function () {
  //     const iframeSrc = "http://embed.powerbi.com/appTokenReportEmbed";
  //     const $iframe = $(`<iframe src="${iframeSrc}" id="testiframe"></iframe>`).appendTo(document.body);
  //     iframe = <HTMLIFrameElement>$iframe.get(0);
  //     windowPostMessageProxy = new wpmp.WindowPostMessageProxy(window);
      
  //     const iframeLoadedDeferred = $.Deferred<void>();
  //     iframe.addEventListener('load', () => {
  //       iframeLoadedDeferred.resolve();
  //     });
  //     iframeLoaded = iframeLoadedDeferred.promise();
  //   });
    
  //   afterAll(function () {
  //     // Choose to leave iframe in window, for easier debugging of the tests. Specifically to make sure correct html page was loaded.
  //     // $('#testiframe').remove();
  //   });
    
  //   it('', function (done) {
  //     // Arrange
  //     const testData = {
  //       message: {
  //         error: true
  //       }
  //     };
      
  //     // Act
  //     // Assert
  //     iframeLoaded
  //       .then(() => {
  //         windowPostMessageProxy.postMessage(testData.message)
  //           .catch((message:any) => {
  //             expect(message.error).toEqual(true);
  //             done();
  //           });
  //       });
        
    // });
});
