---
  title: "Evolving authentication on React components"
  date: "2015-01-17"
  tags: 
    - "react"
    - "security"
  description: "Taking what we learnt in the last post and evolving the approach."
---

In my last post I talked about how you can do [Authentication on React components using `mixins`](/posts/2015-01-15-authentication-on-react-components.html).

Using a `mixin` to add role-based security to any component we create is really handy but it does have one real problem, you have to inherit that `mixin` on every component you want to have it on. It works well when you want to do something like hide links or buttons, but it starts to fall down when you want to hide sections of components, maybe a row in a table is only there for certain roles, or a section of a menu isn't visible for everyone.

In this post I wan to have a look at an alternate approach to adding role-based security only in a more generic fashion.

# RequireRoles Component

As I said in the post we used a `mixin` that we added to components, this time I'm going to create a dedicated component which I'll call `RequireRoles`. My goal is that you would end up with a usage like this:

    <RequireRoles profile={...} roles={...}>
        <div className="admin-widget">
            ...
        </div>
    </RequireRoles>

We'll start by creating our component:

    var RequireRoles = React.createClass({
        permitted: function (requiredRoles) {
            return this.props.profile.roles
                .some(role =>
                    requiredRoles.some(rr => rr === role)
                );
        },

        render: function () {
            if (!this.props.profile || !this.props.profile.roles) {
                return null;
            }

            if (!this.permitted(this.props.roles))) {
                return null;
            }

            //TODO: Render something on success
        }
    });

I've grabbed the code that I had in the last sample so if you've not read it [check it out](/posts/2015-01-15-authentication-on-react-components.html) to get what it's doing. Alternatively I could have used the `mixin` that we defined but I wanted to keep this sample stand-alone.

The only new thing we need to do here is deal with rendering when the roles are valid. For that we need to work with the `children` property.

    var RequireRoles = React.createClass({
        permitted: function (requiredRoles) {
            return this.props.profile.roles
                .some(role =>
                    requiredRoles.some(rr => rr === role)
                );
            },

        render: function () {
            if (!this.props.profile || !this.props.profile.roles) {
                return null;
            }

            if (!this.permitted(this.props.roles))) {
                return null;
            }

            return this.props.children;
        }
    });

Well that was simple wasn't it, all we return is `this.props.children`. It's worth nothing though that if you look back at my original code snippet:

    <RequireRoles profile={...} roles={...}>
        <div className="admin-widget">
            ...
        </div>
    </RequireRoles>

The _children_ of the component is the `<div>` and there is only a single child. This might be something that I'm doing wrong but I've found that **you can only have a single child**, if there are multiple children then nothing rendered, but this is a pretty easy requirement to meet, wrapping everything in a `<div>` and it's all good.

# Building our `<App>`

Now that we've got our component created how does our `<App />` look?

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
            return React.createElement('div', null,
                React.createElement(RequireRoles, { roles: ['admin'], profile: this.state.profile },
                    React.createElement('div', null,
                        React.createElement('h1', null, 'Admin stuff here'),
                        React.createElement('h2', null, 'Something else for the admin')
                    )
                )
            );
        }
    });

_Yeah I didn't use JSX here to show how it'd look "compiled"._

# Conclusion

There we have it, that's how we can build a reusable component for wrapping other DOM elements/components in role validation. By creating a component that returns the `this.props.children` rather than something crafted, means that you've created a wrapper component.

If you combine this with the `mixin` from the last post then you'll have covered pretty much every approach to doing role-based validation on components in React applications.

Again there is a working demo [here, on jsbin](http://jsbin.com/sunohe/2/edit).
