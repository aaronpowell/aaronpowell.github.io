---
  title: "Authentication on React components"
  date: "2015-01-16"
  tags: 
    - "react"
    - "security"
  description: "Here's an approach on how to create React components that have role-based security on them."
---

When building a Web Application, or any application at all, it's often required that you hide/show functionality depending on the permissions which the logged user has associated with them. The Web Application I'm currently working on has this requirement, only users who are in the administrator group will be able to access the administration section of the website.

In this application I'm using Facebook's [React](http://facebook.github.io/react/) JavaScript framework and in this post I want to look at the approach we're using to do role-based permissions on the React components that we are creating.

_It's worth pointing out that doing this is only adding client-side security for your components, not server-side security. In an application you'll want to make sure that you're also checking the users permissions on the server too to ensure that users can't type in a URL and get to pages/data they shouldn't. I won't be covering server-side security here as that depends on your server platform and your security model._

# Mixins

The easiest approach to this I have found is to leverage the [`mixin`](http://facebook.github.io/react/docs/reusable-components.html#mixins) feature of React. A `mixin` is kind of like a base class, it you "inherit" from zero or more mixins and React will extend your component with the members defined in the `mixin`.

For this I'm going to create a `mixin` named `RoleRequiredMixin`:

    var RoleRequiredMixin = {

    };

If you haven't used `mixin`'s before then you'll notice they are just a standard JavaScript object that you add members to. I'm going to create a member called `permitted` which takes some roles and checks them against the user.

    var RoleRequiredMixin = {
        permitted: function (requiredRoles) {
            //TODO: Implement
        }
    };


Ok, now the question here is how to find out who the current user is to check against them.

## Loading profiles

There's plenty of different ways which you can construct a profile for the user, it could be info rendered into the DOM during the page load, you could have an AJAX request to load it or a lot of different ways. How you construct it is not particularly important, what **is** important is getting into your component. My recommendation is that you pass the profile to your component as a property rather than resolving it in the `permitted` method. The reason for this that it gives me the ability to load it once and share to multiple components, so I'm going to assume our parent component, aka the page, takes care of that for us and just read it from the `props` of our component:

## Finishing our `permitted` method

    var RoleRequiredMixin = {
        permitted: function (requiredRoles) {
            return this.props.profile.roles
                .some(role =>
                    requiredRoles.some(rr => rr === role)
                );
        }
    };

And there we go, our `permitted` method is now implemented. Here we're:

* Getting the `roles` array from our profile
* Performing a `some` to find any roles that...
* Matches any of the required roles

You'll also notice that I'm using the ES6 _fat arrow_ feature (which React understands and transpiles down) to make our `some`'s look more lambda-ish.

# Using our `mixin`

Now that our `mixin` is created let's make use of it. I'll start off with a simple component that's available when the user has a role of `user`:

    var UserComponent = React.createClass({
        render: function () {
            return null;
        }
    });

Here's the start of our component, let's now add the `mixin`:

    var UserComponent = React.createClass({
        mixins: [RoleRequiredMixin],

        render: function () {
            return null;
        }
    });

Excelent, our component has been extended, time to start implementing the `render` method. I'm going to make an assumption that the `profile` might be asynchronously loaded so the first thing I'll do is check for a profile, if there's none then we'll not render the component:

    var UserComponent = React.createClass({
        mixins: [RoleRequiredMixin],

        render: function () {
            if (!this.props.profile || !this.props.profile.roles) {
                return null;
            }
            return null;
        }
    });

When the checks for the `profile` existing and being _well formed_ pass I can call our `mixin` method:

    var UserComponent = React.createClass({
        statics: {
            requiredRoles: ['user']
        },

        mixins: [RoleRequiredMixin],

        render: function () {
            if (!this.props.profile || !this.props.profile.roles) {
                return null;
            }

            if (!this.permitted(UserComponent.requiredRoles))) {
                return null;
            }

            return React.createElement("div", null, "This is a user component!");
        }
    });

As you can see here whenever a check fails we return `null` from the method. By doing this we are telling React that this component isn't actually rendering anything. If it succeedes then we render out our component as normal.

And that's our `UserComponent` completed. For the list of required roles I've created a `static` on the component which is passed in. The reason I did this is so if we have multiple instances of this component the role list is the same, reducing memory overhead.

# Using our component

With our component created we can now go about using it.

    var App = React.createClass({
        render: function () {
            return React.createElement("div", null,
                React.createElement(UserComponent, { profile: this.state.profile })
            );
        }
    });

    React.render(React.createElement(App, null), document.body);

You'll see that I'm passing the `profile` down as a property which comes from the `state` of our React app. Let's go about getting the profile:

    var App = React.createClass({
        getInitialState: function () {
            return {
                profile: {}
            };
        },

        componentDidMount: function () {
            profileLoader().then(profile => this.setState({ profile: profile }));
        },

        render: function () {
            return React.createElement("div", null,
                React.createElement(UserComponent, { profile: this.state.profile })
            );
        }
    });

For illustration purposes I'm loading the `profile` from an asynchronous method, this could be doing an AJAX call or any other method of loading the data.

# Conclusion

There we have it, a very simple way we can use React's `mixin` feature to create components that will only be rendered when a user has a required role. We used the `some` array method to perform check if the user has _any_ of the required roles but you could change that to an `every` if you wanted to make sure that users have all of the required roles set.

I've published a full example [on jsbin](http://jsbin.com/lokije/9/edit) which shows different components with different roles expected and a basic profile loader.
