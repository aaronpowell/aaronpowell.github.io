---
  title: "Azure Mobile Services, AngularJS and broken promises"
  date: "2013-09-16"
  tags: 
    - "azure-mobile-services"
    - "angularjs"
    - "promise"
  description: "A look at how to use Azure Mobile Services with AngularJS and dealing with what I believe is a broken approach to the AngularJS promise API."
---

There's no denying it that [AngularJS](http://angularjs.org/) is the hot new SPA framework these days as it offers a lot of very nice features out of the box, has a very good programming model behind it and works as advertised. So when a new project was kicking off that I was on I decided to take the opportunity to use it so I could get a feel for it. Overall my feelings have been positive with the exception of what I want to talk about here.

# Bringing in Azure Mobile Services

For this project I've been working with [Azure Mobile Services](http://www.windowsazure.com/en-us/solutions/mobile/) as I've got data coming from some native mobile apps that needs to be managed via the website. So AMS has its own [JavaScript client](http://msdn.microsoft.com/en-us/library/windowsazure/jj554207.aspx) to work with that's quite a nice little library, you do things like so:

    client.getTable('members').insert(newMember).then(function () {
        console.log('member has been inserted with id: ' + newMmeber.id)
    });

    client.getTable('members').where(function () {
        return this.active;
    }).read().then(function (members) {
        console.log('You have ' + members.length + ' active members');
    });

Under the covers this is a REST API so it's doing HTTP requests out to Azure, handling the response and then using its own Promise API (which conforms to the Promise spec) to publish out to listeners.

# Abstracting Azure Mobile Services

AngularJS has [support for dependency injection](http://docs.angularjs.org/guide/di) which is a really nice feature when you're looking to modularize your project. So for this project I decided to create a factory which would expose AMS and then another which would expose friendly methods to wrap up the bits of functionality I wanted, meaning that if you were to unit test it you wouldn't directly depend on AMS, just an interface.

So I started with this as a module:

    angular.module('azure', [])
        .factory('client', ['$window', function ($window) {
            var azureSettings = //get them how you will
            var client = new $window.WindowsAzure.MobileServiceClient(
                "https://" + azureSettings.name + ".azure-mobile.net/",
                azureSettings.key
            );

            return client;
        }]);

And now I can create a factory for my "services", so we'll start with this:

    angular.module('api', ['azure'])
        .factory('services', ['client', function (client) {
            //TODO
        }]);

Lastly I could setup a controller:

    angular.module('app', ['api'])
        .controller('MyController', ['$scope', 'services', function ($scope, services) {

        }]);

Now we can set about creating our service. We'll do your typical todo item app, so for that I want to have a method on my service that'll expose all todo items:

    angular.module('api', ['azure'])
        .factory('services', ['client', function (client) {
            return {
                getAll: function () {
                    return client.getTable('todo').read();
                }
            };
        }]);

Because this is promise based we can `.then` the call and populate our UI:

    angular.module('app', ['api'])
        .controller('MyController', ['$scope', 'services', function ($scope, services) {
            $scope.items = [];

            services.getAll().then(function (items) {
                $scope.items = items;
            });
        }]);

# AngularJS's broken promise

I quite like the concept of [Promises in JavaScript](http://promises-aplus.github.io/promises-spec/), and I know [some people have issues with them](http://brianmckenna.org/blog/category_theory_promisesaplus), but all-in-all it's nicer to work with than callback trees, especially when it comes to working with multiple async operations. One of the core principles is that when the operation completes it will either be resolved or rejected and you can provide handlers for the appropriate states.

Looking back at the code up there, knowing that Azure Mobile Services will return a promise do you see anything wrong in the either the service or the controller which would prevent the success callback from being invoked?

No? Me either, but it won't be called.

And this is where we get to what I'm referring to as **AngularJS's broken promise**. The fact is that the callback *won't* be run, and that's rather annoying, really hard to debug and not obvious at all.

*Before we go much further I just want to clarify that I'm not an AngularJS expert, I've been using it for a grand total of 3 weeks so this is based on my expectations as a JavaScript developer.*

Everything in AngularJS is wrapped up in [scopes](http://docs.angularjs.org/guide/scope) and only within the space of a running scope can you interact with an AngularJS model (such as your controller). Anything that breaks out of an AngularJS scope will then need to notify AngularJS that it's completed and you can be on your way.

So the problem that I'm hitting is that I'm creating an XHR, which because it's asynchronous, will break out of an AngularJS scope and eventually complete. Because you are then "out of the scope" the Promise callbacks are **somehow** blocked by AngularJS (I've not been able to work out how they prevent it from firing but they somehow do).

## Fixing the broken promise

The good news is that you can work around this and I'll admit that this may not be the cleanest solution because it was determined by trial-and-error, but none the less you can solve the problem and that's by calling [`$apply`](http://docs.angularjs.org/api/ng.$rootScope.Scope#$apply) on the root scope before your promise tries to return. Annoyingly this means you have to create your own promise to wrap the AMS promise but AngularJS does ship with a slimmed down version of [Q](https://github.com/kriskowal/q) in the form of [`$q`](http://docs.angularjs.org/api/ng.$q).

The resulting code now looks like this:

    angular.module('api', ['azure'])
        .factory('services', ['client', '$q', '$rootScope', function (client, $q, $rootScope) {
            return {
                getAll: function () {
                    var d = $q.defer();

                    client.getTable('todo').read().then(function () {
                        d.resolve.apply(this, arguments);
                        $rootScope.$apply();
                    }, function () {
                        d.reject.apply(this, arguments);
                        $rootScope.$apply();
                    });

                    return d.promise().
                }
            };
        }]);

Here you'll see that we're creating a deferred object, and then returning its promise (meaning our controller doesn't need to be refactored, just our factory). We then add our own success handler (and fail handler) which pass through to `.resolve` and `.reject` for success and fail, providing the arguments, meaning that this solution doesn't need to know about the argument changes. Once that's done we then call `$rootScope.$apply()` which will inform AngularJS that our async operation has completed, and now the handlers in our controller will be executed.

# Beware of opinionated frameworks

So the main problem I was experiencing was supped up in this tweet:

<blockquote class="twitter-tweet"><p><a href="https://twitter.com/slace">@slace</a> normally, you wouldn't need to do this as a digest cycle would be triggered by angular if you were using its own services.</p>&mdash; James Sadler (@freshtonic) <a href="https://twitter.com/freshtonic/statuses/370784637024337920">August 23, 2013</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

The problem is _you're not doing in the AngularJS way_. When I was trying to work out why it wasn't working people kept pointing out that "if you just used the built in `$http` service you wouldn't have that problem". But really that's not the case, using the `$http` service [just handles it for you](https://github.com/angular/angular.js/blob/2bb0e1a6041a079b4c456eb6bae4ec5a206582eb/src/ng/http.js#L967), so it's still a problem with any XHR operations in AngularJS, they just hide some of it from you.

So just be aware that when you're using an opinionated library once you step outside "the norm" be prepared for things to not work as you'd expect.

# Conclusion

I'd really like to create a wrapper around the Azure Mobile Services API but they don't seem to expose their promise API which is where I'd like to wrap, I'm going to keep trying and will update if I can find a cleaner solution.

In the mean time you'll need to be aware that when you're using Azure Mobile Services with AngularJS it's not quite as simple as you'd expect it to be.