import * as wpmp from '../src/windowPostMessageProxy';



describe('windowPostMessageProxy', function () {
  describe('test with proxy configured to message own window', function () {
    let windowPostMessageProxy: wpmp.WindowPostMessageProxy;
    let handler: wpmp.IMessageHandler;
    
    beforeAll(function () {
      windowPostMessageProxy = new wpmp.WindowPostMessageProxy(window);
    });
    
    afterAll(function () { 
      windowPostMessageProxy.stop();
    });
    
    beforeEach(() => {
      handler = {
        test: jasmine.createSpy("testSpy").and.returnValue(true),
        handle: jasmine.createSpy("handleSpy").and.returnValue({ handled: true })
      };
      
      windowPostMessageProxy.addHandler(handler);
    });
    
    afterEach(function () {
      (<jasmine.Spy>handler.test).calls.reset();
      (<jasmine.Spy>handler.handle).calls.reset();
    });

    it('postMessage returns a promise which is resolved if a response with matching id is observed and message is NOT considered an error message', function (done) {
      // Arrange
      const testData = {
        message: {
          messageTest: "abc123"
        }
      };
      
      // Act
      let messagePromise: Promise<void>;
      windowPostMessageProxy.postMessage(testData.message)
        .then((response:any) => {
          expect(response.messageTest).toEqual(testData.message.messageTest);
          done();
        });
      
      // Assert
    });
    
    it('postMessage returns a proimse which is rejected if a response with matching id is observed and message is considered an error message', function (done) {
      // Arrange
      const testData = {
        message: {
          error: true
        }
      };
      
      // Act
      let messagePromise: Promise<void>;
      windowPostMessageProxy.postMessage(testData.message)
        .catch((message:any) => {
          expect(message.error).toEqual(true);
          done();
        });
      
      // Assert
    });
    
    it('By default tracking data is added to the message using the default method', function () {
      expect(true).toBe(true);
    });
  });
  
  // Goal is to test entire post message protocol against live embed page by sending messages and testing response.
  // Although this library is suppose to be indepdent of PowerBI's particular use case so these tests should probably live with ReportEmbed pages tests.
  xdescribe('test with actual report embed page', function () {
    let windowPostMessageProxy: wpmp.WindowPostMessageProxy;
    let iframe: HTMLIFrameElement;
    let iframeLoaded: JQueryPromise<void>;

    beforeAll(function () {
      const iframeSrc = "http://embed.powerbi.com/appTokenReportEmbed";
      const $iframe = $(`<iframe src="${iframeSrc}" id="testiframe"></iframe>`).appendTo(document.body);
      iframe = <HTMLIFrameElement>$iframe.get(0);
      windowPostMessageProxy = new wpmp.WindowPostMessageProxy(window);
      
      const iframeLoadedDeferred = $.Deferred<void>();
      iframe.addEventListener('load', () => {
        iframeLoadedDeferred.resolve();
      });
      iframeLoaded = iframeLoadedDeferred.promise();
    });
    
    afterAll(function () {
      // Choose to leave iframe in window, for easier debugging of the tests. Specifically to make sure correct html page was loaded.
      // $('#testiframe').remove();
    });
    
    it('', function (done) {
      // Arrange
      const testData = {
        message: {
          error: true
        }
      };
      
      // Act
      // Assert
      iframeLoaded
        .then(() => {
          windowPostMessageProxy.postMessage(testData.message)
            .catch((message:any) => {
              expect(message.error).toEqual(true);
              done();
            });
        });
        
    });
  });
});