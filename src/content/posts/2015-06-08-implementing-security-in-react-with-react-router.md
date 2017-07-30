---
  title: "Implementing security in React with react-router"
  date: "2015-06-08"
  tags: 
    - "react"
    - "react-router"
    - "security"
  description: "A look at how to page-based security with React and react-router."
---

In the past I've talked about how to do [simple security with React](/posts/2015-01-17-evolving-authentication-on-react-components.html) but the focus has been on how can you conditionally include pieces on a page depending on what the user is allowed to do. Today I want to take this a step further and look at how you would do page-to-page security in a SPA using React. For this I'm going to be using the excellent [react-router](https://github.com/rackt/react-router) navigation framework.

Also like my last post I'm going to take a bit of a liberty on how you _do_ security, that's beyond the scope, let's assume you _can_ determine if a user is logged in or not and what their roles are. I'm also assuming you are familiar with react-router a bit already.

## Authenticated routes

The first thing I want to do is setup routes that you much be logged in for, this could be acting as a public/subscriber system. To do that we're going to take advantage of the pipeline that react-router gives us when navigating to a page (or transitioning as their documentation refers to it). The way this works is it looks for a particular static method on the React component that you will be navigating to and we can add some logic to potentially cancel that navigation request. I'm going to create a component called `AuthenticatedRoute`:

    'use strict';
    
    import React from 'react';
    import userService from './services/userService';
    
    class AuthenticatedRoute extends React.Component {
        static willTransitionTo(transition) {
            if (!userService.authenticated) {
                transition.redirect('login', {}, { 'nextPath': transition.path });
            }
        }
    
        constructor(props) {
            super(props);
        }
    }
    
    export default AuthenticatedRoute;

I've done this using the ES2015 support for React and ES2015 class syntax plus ES2015 `import` syntax for loading dependencies.

The most important method in this component that I've got is the `willTransitionTo` method, this is what react-router looks for to run before the navigation has been completed. The first argument to this method is the `transition` object which is used to control the navigation event that is happening. `transition` has three methods on it, `abort`, `cancel` and `redirect`. The one that we want to use here is the `redirect` method to navigate to the login page when the user is not logged in (which I am using a `userService` to determine) and we can also get the path that we're _trying_ to get to from `transition.path` to pass along with the redirect and then send you back after you do log in.

Now let's see a usage of it:

    'use strict';

    import React from 'react';
    import AuthenticatedRoute from './AuthenticatedRoute';

    class UserProfilePage extends AuthenticatedRoute {
        constructor(props) {
            super(props);
        }

        render() {
            //render logic here
        }
    }

    export default UserProfilePage;

Pretty easy ey? We just extend (inherit) from our `AuthenticatedRoute` and it's all sorted.

## Adding roles

Now thatwe've got basic security checks going let's setup it up to work out that not only if you are logged in you also have permission to get to where you want to go. You're logged in as a standard user but try and get into the site administration system, we probably want to stop that. To do that we'll expand our `willTransitionTo` method logic:

    static willTransitionTo(transition) {
        if (!userService.authenticated) {
            transition.redirect('login', {}, { 'nextPath': transition.path });
        } else if (this.rolesRequired) {
            let userRoles = userService.currentUser.roles;
            if (!this.rolesRequired.every(role => userRoles.indexOf(role) >= 0)) {
                transition.redirect('not-authorised');
            }
        }
    }

So I've added an `else if` block, and I'm looking for another `static` on the component, a `static` property called `rolesRequired` which would be an array of roles that are required for the user to access this particular route. If there are roles required to get to this page then the user must have **all** of these roles, the `.every` query on the array (you could implement this as a 'require any of these roles' use the `.some` array query method). Then we do a redirect away if the user can't access the route just like with login.

And how do we use this new update:

    'use strict';

    import React from 'react';
    import AuthenticatedRoute from './AuthenticatedRoute';

    class UserAdminPage extends AuthenticatedRoute {
        static get rolesRequired() {
            return ['admin'];
        }

        constructor(props) {
            super(props);
        }

        render() {
            //render logic here
        }
    }

    export default UserAdminPage;

Because I don't want the `rolesRequired` property value to be mutable I'm implementing this as a get-only property, which is the `get <name>() { ... }` syntax. Pretty simple and clean I reckon.

## Going async

Not everything that we can do can be synchronous, I've assumed that is the case so far but maybe loading the profile happens and it might not have happened before the navigation occurs. Say our `userService` now looks like:

    userService.getProfile().then(profile => ...)

Now we return a promise from the `userservice`'s `getProfile` method, how does that fit into a synchronous flow of navigation?

Conveniently the `willTransitionTo` method can be made asynchronous by changing the parameters passed in:

    static willTransitionTo(transition, params, query, callback) { ... }

The additional parameters are:

* `params` - the url segments defined, like an `id` or such if you've defined `/foo/:id`
* `query` - the query string info of the URL
* `callback` - a function to invoke once an async operation has completed

The last argument, `callback`, is the one that is of interest to us now. The way react-router works is it looks at the number of arguments your function takes and if it's 4 then it will hault the navigation until that callback is invoked, and you invoke the callback regardless of success of failure. So let's update our code:

    static willTransitionTo(transition, params, query, callback) {
        if (!userService.authenticated) {
            transition.redirect('login', {}, { 'nextPath': transition.path });
        } else if (this.rolesRequired) {
            userService.getProfile().then(profile => {
                let userRoles = profile.roles;
                if (!this.rolesRequired.every(role => userRoles.indexOf(role) >= 0)) {
                    transition.redirect('not-authorised');
                }

                callback();
            }, err => {
                transition.redirect('error', { error: err });
                callback();
            });
            return;
        }
        callback();
    }

Now that we have access to the `callback` once the async request has completed we invoke it and then bail out of the function. If we didn't do a role check we'll still call `callback`, else react-router doesn't know that the navigation event is completed.

## Conclusion

There we go, page-to-page security using react-router's built in hooks to add checks in our React SPA. I think it works pretty cleanly by giving us a base type to inherit from and simple logic. We can always add additional conditional steps if we want to add different security checks as well.

The one thing that this won't _necissarily_ work well for is if you're using the nested routing with react-router. Because that only navigates a section of the page rather than the whole page you might want to look at the approach I talked about in my previous posts.

You can find a basic implementation in the code from my [ANZCoders talk](https://github.com/aaronpowell/reply).
