import * as wpmp from '../src/windowPostMessageProxy';

declare global {
  interface Window {
    __karma__: any;
  }
}

let logMessages = (window.__karma__.config.args[0] === 'logMessages');

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
      const iframeSrc = "base/test/utility/noop.html";
      const $iframe = $(`<iframe src="${iframeSrc}" id="testiframe"></iframe>`).appendTo(document.body);
      const $iframe2 = $(`<iframe src="${iframeSrc}" id="testiframe"></iframe>`).appendTo(document.body);
      iframe = <HTMLIFrameElement>$iframe.get(0);
      iframe2 = <HTMLIFrameElement>$iframe2.get(0);

      windowPostMessageProxy = new wpmp.WindowPostMessageProxy({
        name: "hostProxyDefaultNoHandlers",
        logMessages
      });

      iframeWindowPostMessageProxy = new wpmp.WindowPostMessageProxy({
        receiveWindow: iframe.contentWindow,
        name: "iframeProxyWithHandler",
        logMessages
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

      iframeLoaded = new Promise<void>(resolve => {
        iframe.addEventListener('load', () => {
          resolve();
        });
      });

      iframe2Loaded = new Promise<void>(resolve => {
        iframe2.addEventListener('load', () => {
          resolve();
        });
      });
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
          windowPostMessageProxy.postMessage(iframe.contentWindow, testData.message)
            .then((response: any) => {
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
          windowPostMessageProxy.postMessage(iframe.contentWindow, testData.message)
            .catch((message: any) => {
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
          windowPostMessageProxy.postMessage(iframe.contentWindow, testData.message)
            .then((message: any) => {
              expect(message.windowPostMessageProxy.id).toBeDefined();
              done();
            });
        });

      // Assert
    });

    it("multiple handlers can be registered but only one can handle a message", function (done) {
      // Arrange
      const testData = {
        message: {
          someKey: true
        }
      };

      const unusedHandler: wpmp.IMessageHandler = {
        test() { return true },
        handle: jasmine.createSpy("unusedHandlerSpy")
      };

      const unusedHandlerSpy: jasmine.Spy = <any>unusedHandler.handle;

      iframeWindowPostMessageProxy.addHandler(unusedHandler);

      // Act
      iframeLoaded
        .then(() => {
          windowPostMessageProxy.postMessage(iframe.contentWindow, testData.message)
            .then((message: any) => {
              expect(unusedHandlerSpy).not.toHaveBeenCalled();
              done();
            });
        });

      // Assert
    })

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

      const customWindowPostMessageProxy = new wpmp.WindowPostMessageProxy({
        processTrackingProperties: customTrackingPropertiesProcess,
        name: "Override TrackingId"
      });
      const customIframeWindowPostMessageProxy = new wpmp.WindowPostMessageProxy({
        receiveWindow: iframe2.contentWindow,
        processTrackingProperties: customTrackingPropertiesProcess,
        name: "Iframe Override TrackingId"
      });
      customIframeWindowPostMessageProxy.addHandler(handler);

      // Act
      iframe2Loaded
        .then(() => {
          return customWindowPostMessageProxy.postMessage(iframe2.contentWindow, testData.message)
            .then((message: any) => {
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

      const customIsErrorWindowPostMessageProxy = new wpmp.WindowPostMessageProxy({
        isErrorMessage: customIsError,
        name: "OverRide IsError"
      });
      const customIsErrorIframeWindowPostMessageProxy = new wpmp.WindowPostMessageProxy({
        receiveWindow: iframe2.contentWindow,
        isErrorMessage: customIsError,
        name: "OverRide IsError"
      });
      customIsErrorIframeWindowPostMessageProxy.addHandler(handler);

      // Act
      iframe2Loaded
        .then(() => {
          return customIsErrorWindowPostMessageProxy.postMessage(iframe2.contentWindow, testData.message)
            .then((message: any) => {
              expect(message.windowPostMessageProxy.id).toBeDefined();
            });
        })
        .then(() => {
          return customIsErrorWindowPostMessageProxy.postMessage(iframe2.contentWindow, testData.errorMessage)
            .catch((message: any) => {
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
