---
  title: "Testing Messaging Within a Presenter"
  metaTitle: "Testing Messaging Within a Presenter"
  description: "Cross-Presenter messaging is really handy, and here's how to do testing of it when it's in a presenter"
  revised: "2010-05-18"
  date: "2010-05-18"
  tags: 
    - "asp.net"
    - "webforms-mvp"
  migrated: "true"
  urls: 
    - "/testing-messaging-within-a-presenter"
  summary: ""
---
Cross-Presenter messaging is a great way which you can have two presenters which don't know about each other, but may have a reliance on data from the other.

There's a [good demo][1] up on the WebForms MVP wiki which shows how it can be implemented.

One really handy feature of this is that you can have something happen when the message never arrives. Lets say for example we have a presenter which shows a set of promotions pulled from a global store. But I also want the ability to set the promotions on a per-page basis. So if there's no promo's for this page I want to see the global ones.

##Setup##

I'll have my promotions presenter like this:

	public class PromoPresenter : Presenter<IView<PromoModel>> {
		private IPromoService service;
		public PromoPresenter(IView<PromoModel> view, IPromoService service) : base(view) {
			this.service = service;
			this.View.Load += View_Load;
		}
		
		void View_Load(object sender, EventArgs e) {
			//TODO
		}
		
		public void ReleaseView() {
			this.View.Load -= View_Load;
		}
	}

Now I need to add some functionality to the `View_Load` method so that it loads in from either the messages or not (ignore the implementation of IPromoService, it's not important for this demo).

		void View_Load(object sender, EventArgs e) {
			Messages.Subscribe<IEnumerable<IPromo>>(promos => this.View.Model.Promos = promos, () => this.View.Model.Promos = this.service.GetGlobalPromos());
		}

So we also need a `PagePresenter` which may have promo boxes that are in-context to display.

	public class PagePresenter : Presenter<IView<PageModel>> {
		private IContentService service;
		
		public PagePresenter(IView<PageModel> view, IContentService service) : base(view) {
			this.service = service;
			this.View.Load += View_Load;
		}
		
		void View_Load(object sender, EventArgs e) {
			var page = this.service.CurrentPage();
			//set some model stuff about the page
			Messages.Publish<IEnumerable<IPromo>>(page.Promotions);
		}
		
		public void ReleaseView() {
			this.View.Load -= View_Load;
		}
	}

##Unit Testing##

This is pretty simple, and it *should just work*, but I'm a good developer, so how do I setup the unit tests to ensure that the right methods are called?

We need to simulate the underlying MessageBus of WebForms MVP, but that's nothing you need to worry about when working with WebForms MVP, it does that on our behalf.

And this is a situation I found myself in, I wanted to test both the message received and message not received functionality. So I started off looking into the source for WebForms MVP, they have tests kind of doing what I wanted, but not the full end-to-end which I required.

So let's look at how to do it:

*A few assumptions, I'm using MS Test and RhinoMocks*

	[TestMethod]
	public void PromoPresenterTests_From_Service_When_No_Message_Published() {
		//Arrange
		var view = MockRepository.GenerateStub<IView<PromoModel>>();
		view.Model = new PromoModel();
		var service = MockRepository.GenerateMock<IContentService>();
		service.Expect(x => x.GetGlobalPromos()).Return(MockRepository.CreateStub<IEnumerable<IPromo>>());

		var presenter = new PromoPresenter(view, service);
		var messageCoordinator = new MessageCoordinator();
		presenter.Messages = messageCoordinator;
		
		//Act
		view.Raise(x => x.Load += null, null, null);
		presenter.ReleaseView();
		messageCoordinator.Close();

		//Assert
		Assert.IsNotNull(view.Model.Promos);
		service.VerifyAllExpectations();
	}

There's not much different I'd have done if it was just a standard WebForms MVP test (or any other test for that matter) but I'm putting an expectation of my IContentService that I am calling the `GetGlobalPromos` method. What comes back is not important, just that something comes back.

Next you need to setup a `MessageCoordinator`. This is what is responsible for the MessageBus, handling the publishing and subscription of the events.

You can either make a mock version if you want to be really explicit and set an expectation on the `Messages.Subscribe` call, but I'm not wanting that. I'll just use the `MessageCoordinator` class which comes from WebForms MVP itself. This also means that I'm getting it operate pretty much the same as if it was really running.

Since this test is verifying the *no messages published* operation I just want to close the MessageCoordinator as soon as I've raised the `View.Load` event, (which is where the subscription happens).

Next we'll test the `Message.Publish` will work like we expect it to:

	[TestMethod]
	public void PromoPresenterTests_No_Service_When_Published() {
		//Arrange
		var view = MockRepository.GenerateStub<IView<PromoModel>>();
		view.Model = new PromoModel();
		var service = MockRepository.GenerateMock<IContentService>();

		var presenter = new PromoPresenter(view, service);
		var messageCoordinator = new MessageCoordinator();
		presenter.Messages = messageCoordinator;
		
		//Act
		view.Raise(x => x.Load += null, null, null);
		presenter.ReleaseView();
		messageCoorindator.Publish(MockRepository.CreateStub<IEnumerable<IPromo>>());
		messageCoordinator.Close();

		//Assert
		Assert.IsNotNull(view.Model.Promos);
		service.AssertWasNotCalled(x => x.GetGlobalPromos());
	}	

This test is basically the same as the last one, but instead of setting an expectation on the `GetGlobalPrommos` method I'm putting an `AssertWasNotCalled` which is an extension method from RhinoMocks.

Also, we're doing a `Publish` via our MessageCoordinator, before we close it off, which is how we would expect it to run in the web implementation (yes, you could setup an expectation on your mock objects if you want to go deeply into it).

###PagePresenter?###

You'll notice that the tests here are only covering the `PromoPresenter`, not the `PagePresenter`. Well to do a full test you would need something like this:

	[TestMethod]
	public void PromoPresenterTests_Published_From_Other_Presenter() {
		//Arrange
		var promoView = MockRepository.GenerateStub<IView<PromoModel>>();
		promoView.Model = new PromoModel();
		var service = MockRepository.GenerateMock<IContentService>();

		var promoPresenter = new PromoPresenter(promoView, service);
		var messageCoordinator = new MessageCoordinator();
		promoPresenter.Messages = messageCoordinator;
		
		var pageView = MockRepository.GenerateStub<IView<PageModel>>();
		var page = MockRepository.GenerateStub<IPage>();
		page.Stub(x => x.Promotions).Return(MockRepository.CreateStub<IEnumerable<IPromo>>());
		service.Stub(x => x.CurrentPage()).Return(page);
		var pagePresenter = new PagePresenter(pageView, service);
		
		//Act
		promoView.Raise(x => x.Load += null, null, null);
		pageView.Raise(x => x.Load += null, null, null);
		promoPresenter.ReleaseView();
		pagePresenter.ReleaseView();
		messageCoordinator.Close();

		//Assert
		Assert.IsNotNull(view.Model.Promos);
		service.AssertWasNotCalled(x => x.GetGlobalPromos());
	}

Here we're creating both presenters, using their views and raising their load events so that the Messages should be passed around correctly.

##Conclusion##

The Messaging system of WebForms MVP is really powerfully, and hopefully this has show you just how you can do all your unit testing around it.

  [1]: http://wiki.webformsmvp.com/index.php?title=SC009