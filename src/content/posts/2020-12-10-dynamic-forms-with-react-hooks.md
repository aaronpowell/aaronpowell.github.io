+++
title = "Creating Dynamic Forms With React Hooks"
date = 2020-12-10T07:58:10+11:00
description = "Dynamically generating forms can be a challenge, so let's break down how to do it with React Hooks"
draft = false
tags = ["javascript"]
tracking_area = "javascript"
tracking_id = "11633"
+++

The other week my friend [Amy Kapernick](https://twitter.com/Amys_Kapers) reached out because she was having a problem with React. She was working on a project that used a headless CMS to build and control multi page forms and the fields in it, including conditional fields/pages that appear/hide depending on the value of other fields. The headless CMS would then generate a JSON payload that was pulled into a Gatsby site and needed to be rendered as a React form that a user could walk through. While the form was building and rendering, her problem was working with different bits of state management and making sure to update the right things at the right time, and she needed another set of eyes on the problem.

Having built dynamic form generators in the past, built systems backed by generic form generators, and generally done a lot with dynamic forms, I knew just the sort of pain she was in for so I was happy to help.

So in this post, we'll break down how you can make dynamic forms in React, including how to do conditional control over fields appearing and page navigation.

## Defining a data structure

We'll start by defining the data structure that we'll use for this sample, but do keep in mind that the structure will be driven by the backend system the forms are designed in, so you'll need to tweak accordingly.

```json
[
    {
        "component": "page",
        "label": "Page 1",
        "_uid": "0c946643-5a83-4545-baea-055b27b51e8a",
        "fields": [
            {
                "component": "field_group",
                "label": "Name",
                "_uid": "eb169f76-4cd9-4513-b673-87c5c7d27e02",
                "fields": [
                    {
                        "component": "text",
                        "label": "First Name",
                        "type": "text",
                        "_uid": "5b9b79d2-32f2-42a1-b89f-203dfc0b6b98"
                    },
                    {
                        "component": "text",
                        "label": "Last Name",
                        "type": "text",
                        "_uid": "6eff3638-80a7-4427-b07b-4c1be1c6b186"
                    }
                ]
            },
            {
                "component": "text",
                "label": "Email",
                "type": "email",
                "_uid": "7f885969-f8ba-40b9-bf5d-0d57bc9c6a8d"
            },
            {
                "component": "text",
                "label": "Phone",
                "type": "text",
                "_uid": "f61233e8-565e-43d0-9c14-7d7f220c6020"
            }
        ]
    }
]
```

The structure we've got here is intended to be simple. It is made from an array of pages, with each page identified by the `component` value of `page`, and within that is an array of `fields` that contains the inputs, or groups of inputs (again, denoted by the `component` property).

## Creating the form

With the data structure ready, it's time to create the form. We'll start with a new component called `Form`:

```jsx
import React from "react";

const Form = ({ formData }) => {
    const onSubmit = e => {
        e.preventDefault();
        // todo - send data somewhere
    };

    return (
        <form onSubmit={onSubmit}>
            <p>todo...</p>
        </form>
    );
};

export default Form;
```

For this demo, the form won't submit anywhere, but we'll prevent the default action using `preventDefault`. The component will receive the `formData` as a prop, so it's up to the parent component to work out how to get the data and pass it over, again, for this demo we'll have it hard coded in the codebase, but for Amy's situation it was being fetched as part of the Gatsby rendering process and included in the output bundle.

## Defining state

There's a bit of state that we're going to have to manage in the React components, such as which page of the form we're on and the values of the [Controlled Components](https://reactjs.org/docs/forms.html#controlled-components). For this, we'll use [Hooks](https://reactjs.org/docs/hooks-intro.html) so that we can stick with function components.

```jsx
const Form = ({ formData }) => {
    const [page, setPage] = useState(0);
    const [currentPageData, setCurrentPageData] = useState(formData[page]);
    const onSubmit = e => {
        e.preventDefault();
        // todo - send data somewhere
    };

    return (
        <form onSubmit={onSubmit}>
            <p>todo...</p>
        </form>
    );
};
```

The first bit of state is the index of the current page, which starts at 0, and the second is the data for the page, plucked from the array, so we don't need to constantly grab it constantly and we can respond to it changing using the `useEffect` Hook if required.

## Rendering the form fields

Let's start by defining a generic field in a file called `Field.jsx`:

```jsx
import React from "react";

const Field = ({ field, fieldChanged, type, value }) => {
    return (
        <div key={field._uid}>
            <label htmlFor={field._uid}>{field.label}</label>
            <input
                type={type || field.component}
                id={field._uid}
                name={field._uid}
                value={value}
                onChange={e => fieldChanged(field._uid, e.target.value)}
            />
        </div>
    );
};

export default Field;
```

This will render out a label and input in a basic manner, update the HTML to the structure that's required for your design (or render out fields from a form library like [Formik](https://formik.org/)). The two props that are likely to be of most interest as the `value` and `fieldChanged`. The `value` prop is the current value for the Controlled Component, which will come from the Form component itself (we've not implemented that yet) and `fieldChanged` will be used to update this main state list.

Let's go about rendering out the fields in the Form component:

```jsx
const Form = ({ formData }) => {
    const [page, setPage] = useState(0);
    const [currentPageData, setCurrentPageData] = useState(formData[page]);
    const onSubmit = e => {
        e.preventDefault();
        // todo - send data somewhere
    };

    return (
        <form onSubmit={onSubmit}>
            <h2>{currentPageData.label}</h2>
            {currentPageData.fields.map(field => {
                switch (field.component) {
                    case "field_group":
                        return (
                            <FieldGroup
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                values={values}
                            />
                        );
                    case "options":
                        return (
                            <Option
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                value={values[field._uid]}
                            />
                        );
                    default:
                        return (
                            <Field
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                value={values[field._uid]}
                            />
                        );
                }
            })}
        </form>
    );
};
```

_You'll notice a few more types of fields rendered out here, I'll skip their implementations in the blog post, but you can check out the [full sample](https://codesandbox.io/s/interesting-oskar-9ryxt) for them._

We're iterating over `currentPageData.fields` and using a `switch` statement to work out what kind of field we want to render based on the `field.component`. it's then a matter of passing in the right props. But there's something missing, what are `fieldChanged` and `values`, they currently don't exist.

## Handling user input

To handle the user input, we're going to need two things, somewhere to store that input, and a function to do the updating. Let's start with the storage, which is going to be a new bit of state in Hooks:

```jsx
const Form = ({ formData }) => {
    const [page, setPage] = useState(0);
    const [currentPageData, setCurrentPageData] = useState(formData[page]);
    const [values, setValues] = useState({});
    // snip
```

The `values` object is going to act as a dictionary so we can do `values[field._uid]` to get the value out for a field, but as per the requirements of a Controlled Component, we need to initialise the value, and we can do that with the `useEffect` Hook:

```jsx
const Form = ({ formData }) => {
    const [page, setPage] = useState(0);
    const [currentPageData, setCurrentPageData] = useState(formData[page]);
    const [values, setValues] = useState({});

    // this effect will run when the `page` changes
    useEffect(() => {
        const upcomingPageData = formData[page];
        setCurrentPageData(upcomingPageData);
        setValues(currentValues => {
            const newValues = upcomingPageData.fields.reduce((obj, field) => {
                if (field.component === "field_group") {
                    for (const subField of field.fields) {
                        obj[subField._uid] = "";
                    }
                } else {
                    obj[field._uid] = "";
                }

                return obj;
            }, {});

            return Object.assign({}, newValues, currentValues);
        });
    }, [page, formData]);
    // snip
```

This Effect has two dependencies, `page` and `formData`, so if either changes (although it really will only be `page` that changes) it will run. When it runs it'll get the next page we're going to from the `page` state value, and set that as the current page using `setCurrentPageData`. Once that's done, we'll initialise any new fields on the `values` state using a callback to the `setValues` updater function that uses a `reduce` method to iterate over the fields and builds up a new object containing the newly initialised fields. Finally, it'll merge the newly initialised field values with any existing values to produce the new `values` state.

_Tip: using `Object.assign` like this will merge the objects in the order specified, meaning the right-most object values will take precedence, so if you navigate backwards on the form, your previous values are still there._

With the values now available to the Controlled Components, all that's left is creating a function to update them.

```jsx
const Form = ({ formData }) => {
    const [page, setPage] = useState(0);
    const [currentPageData, setCurrentPageData] = useState(formData[page]);
    const [values, setValues] = useState({});

    // this effect will run when the `page` changes
    useEffect(() => {
        const upcomingPageData = formData[page];
        setCurrentPageData(upcomingPageData);
        setValues(currentValues => {
            const newValues = upcomingPageData.fields.reduce((obj, field) => {
                if (field.component === "field_group") {
                    for (const subField of field.fields) {
                        obj[subField._uid] = "";
                    }
                } else {
                    obj[field._uid] = "";
                }

                return obj;
            }, {});

            return Object.assign({}, newValues, currentValues);
        });
    }, [page, formData]);

    const fieldChanged = (fieldId, value) => {
        setValues(currentValues => {
            currentValues[fieldId] = value;
            return currentValues;
        });

        setCurrentPageData(currentPageData => {
            return Object.assign({}, currentPageData);
        });
    };
    // snip
```

The `fieldChanged` function will receive the `fieldId` (`field._uid`) and the new `value`. When called it'll update the `values` state with the new value and then force a render by faking an update of the `currentPageData` state value, using `Object.assign`.

_We need to fake the `currentPageData` update when the values change so that render phase of our component will be run, if not, the `map` function won't be aware of the updated values and the inputs will never show the entered data._

Now our full form is looking like this:

```jsx
const Form = ({ formData }) => {
    const [page, setPage] = useState(0);
    const [currentPageData, setCurrentPageData] = useState(formData[page]);
    const [values, setValues] = useState({});

    // this effect will run when the `page` changes
    useEffect(() => {
        const upcomingPageData = formData[page];
        setCurrentPageData(upcomingPageData);
        setValues(currentValues => {
            const newValues = upcomingPageData.fields.reduce((obj, field) => {
                if (field.component === "field_group") {
                    for (const subField of field.fields) {
                        obj[subField._uid] = "";
                    }
                } else {
                    obj[field._uid] = "";
                }

                return obj;
            }, {});

            return Object.assign({}, newValues, currentValues);
        });
    }, [page, formData]);

    const fieldChanged = (fieldId, value) => {
        setValues(currentValues => {
            currentValues[fieldId] = value;
            return currentValues;
        });

        setCurrentPageData(currentPageData => {
            return Object.assign({}, currentPageData);
        });
    };
    const onSubmit = e => {
        e.preventDefault();
        // todo - send data somewhere
    };

    return (
        <form onSubmit={onSubmit}>
            <h2>{currentPageData.label}</h2>
            {currentPageData.fields.map(field => {
                switch (field.component) {
                    case "field_group":
                        return (
                            <FieldGroup
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                values={values}
                            />
                        );
                    case "options":
                        return (
                            <Option
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                value={values[field._uid]}
                            />
                        );
                    default:
                        return (
                            <Field
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                value={values[field._uid]}
                            />
                        );
                }
            })}
        </form>
    );
};
```

## Adding navigation

Buttons, the form is missing buttons to do anything, be it submit the data or navigate between steps, let's add those now:

```jsx
const Form = ({ formData }) => {
    const [page, setPage] = useState(0);
    const [currentPageData, setCurrentPageData] = useState(formData[page]);
    const [values, setValues] = useState({});

    // this effect will run when the `page` changes
    useEffect(() => {
        const upcomingPageData = formData[page];
        setCurrentPageData(upcomingPageData);
        setValues(currentValues => {
            const newValues = upcomingPageData.fields.reduce((obj, field) => {
                if (field.component === "field_group") {
                    for (const subField of field.fields) {
                        obj[subField._uid] = "";
                    }
                } else {
                    obj[field._uid] = "";
                }

                return obj;
            }, {});

            return Object.assign({}, newValues, currentValues);
        });
    }, [page, formData]);

    const fieldChanged = (fieldId, value) => {
        setValues(currentValues => {
            currentValues[fieldId] = value;
            return currentValues;
        });

        setCurrentPageData(currentPageData => {
            return Object.assign({}, currentPageData);
        });
    };
    const onSubmit = e => {
        e.preventDefault();
        // todo - send data somewhere
    };

    return (
        <form onSubmit={onSubmit}>
            <h2>{currentPageData.label}</h2>
            {currentPageData.fields.map(field => {
                switch (field.component) {
                    case "field_group":
                        return (
                            <FieldGroup
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                values={values}
                            />
                        );
                    case "options":
                        return (
                            <Option
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                value={values[field._uid]}
                            />
                        );
                    default:
                        return (
                            <Field
                                key={field._uid}
                                field={field}
                                fieldChanged={fieldChanged}
                                value={values[field._uid]}
                            />
                        );
                }
            })}
            {page > 0 && (
                <button onClick={() => setPage(page + 1)}>Next</button>
            )}
            &nbsp;
            {page < formData.length - 1 && (
                <button onClick={() => setPage(page - 1)}>Back</button>
            )}
        </form>
    );
};
```

For navigation we'll increment or decrement the page index that we're on which will trigger the effect and update `currentPageData`, forcing a render of the new fields.

And with that, the basics of our dynamic form is done, time to ship to production!

But in Amy's case there were two more things that needed to be handled, let's start with conditional fields.

## Conditional fields

It's not uncommon to have a form that when an option is set other information is required from the user. This is where conditional fields come into play, and to support them let's update our data structure a little bit:

```json
[
    {
        "component": "page",
        "label": "Page 1",
        "_uid": "0c946643-5a83-4545-baea-055b27b51e8a",
        "fields": [
            {
                "component": "field_group",
                "label": "Name",
                "_uid": "eb169f76-4cd9-4513-b673-87c5c7d27e02",
                "fields": [
                    {
                        "component": "text",
                        "label": "First Name",
                        "type": "text",
                        "_uid": "5b9b79d2-32f2-42a1-b89f-203dfc0b6b98"
                    },
                    {
                        "component": "text",
                        "label": "Last Name",
                        "type": "text",
                        "_uid": "6eff3638-80a7-4427-b07b-4c1be1c6b186"
                    }
                ]
            },
            {
                "component": "text",
                "label": "Email",
                "type": "email",
                "_uid": "7f885969-f8ba-40b9-bf5d-0d57bc9c6a8d"
            },
            {
                "component": "text",
                "label": "Phone",
                "type": "text",
                "_uid": "f61233e8-565e-43d0-9c14-7d7f220c6020"
            }
        ]
    },
    {
        "component": "page",
        "label": "Page 2",
        "_uid": "3a30803f-135f-442c-ab6e-d44d7d7a5164",
        "fields": [
            {
                "component": "options",
                "label": "Radio Buttons",
                "type": "radio",
                "_uid": "bd90f44a-d479-49ae-ad66-c2c475dca66b",
                "options": [
                    {
                        "component": "option",
                        "label": "Option 1",
                        "value": "one"
                    },
                    {
                        "component": "option",
                        "label": "Option 2",
                        "value": "two"
                    }
                ]
            },
            {
                "component": "text",
                "label": "Conditional Field",
                "type": "text",
                "_uid": "bd90f44a-d479-49ae-ad66-c2c475daa66b",
                "conditional": {
                    "value": "two",
                    "field": "3a30803f-135f-442c-ab6e-d44d7d7a5164_bd90f44a-d479-49ae-ad66-c2c475dca66b"
                }
            }
        ]
    }
]
```

We've added a second page and the last field on the page has a new property on it, `conditional`, that has two properties, `value` being the value that the field must have to force a display and `field` is the field that should have that value, made up of the `uid` of the page and field.

Now we're going to have to update our rendering logic to make sure we only render the fields that should be displayed. We'll start by creating a function that returns whether a field should be rendered or not:

```javascript
const fieldMeetsCondition = values => field => {
    if (field.conditional && field.conditional.field) {
        const segments = field.conditional.field.split("_");
        const fieldId = segments[segments.length - 1];
        return values[fieldId] === field.conditional.value;
    }
    return true;
};
```

The `fieldMeetsCondition` function is a function that returns a function, sort of like [partial application in F#](https://fsharpforfunandprofit.com/posts/partial-application), we do this so that we can simplify how it's passed to the `Array.filter` before the `Array.map` call.

Within the function it will attempt to find the field in the `values` dictionary and match it with the required value. If no condition exists then we'll bail out and render the field.

Now we can update our render logic:

```jsx
  // snip
  return (
    <form onSubmit={onSubmit}>
      <h2>{currentPageData.label}</h2>
      {currentPageData.fields
        .filter(fieldMeetsCondition(values))
        .map((field) => {
            // snip
```

And we're conditionally showing fields based on user input. Now to conditionally show pages.

## Conditional pages

The last requirement Amy had was to be able to display steps based on the user input, so that steps could be skipped if they aren't relevant. This is a little trickier than conditional fields, as we can no longer just increment the page index, we'll need to search for the appropriate page index.

Let's extract a function to work out the next/previous process:

```javascript
const navigatePages = direction => () => {
    const findNextPage = page => {
        const upcomingPageData = formData[page];
        if (
            upcomingPageData.conditional &&
            upcomingPageData.conditional.field
        ) {
            const segments = upcomingPageData.conditional.field.split("_");
            const fieldId = segments[segments.length - 1];

            const fieldToMatchValue = values[fieldId];

            if (fieldToMatchValue !== upcomingPageData.conditional.value) {
                return findNextPage(direction === "next" ? page + 1 : page - 1);
            }
        }
        return page;
    };

    setPage(findNextPage(direction === "next" ? page + 1 : page - 1));
};
const nextPage = navigatePages("next");
const prevPage = navigatePages("prev");
```

Again, we'll use a function that returns a function, but this time we'll pass in the direction of navigation, `next` or `prev`, and then it'll work out whether to `+` or `-`, allowing us to reuse the function.

This function contains a recursive function called `findNextPage` that when the button is clicked we'll call to start our discovery process. Within that function we'll grab the next sequential page and if it doesn't have any `conditional` information, we'll return the index of it. If it does have a `conditional` field, we'll unpack it in a similar fashion to the conditional field test and compare the required value to the user value, and if they don't match, we'll go to the next (or previous) page in the stack. We'll repeat the process again until we find a page that meets the condition or a page without a condition.

_Note: There is a limitation here, if you start or end with conditional fields you can end up exceeding the index range because it doesn't check if you're hitting the edges. That is something you can tackle yourself._

## Conclusion

Throughout this post we've taken a look at how we can use React to create a dynamic form, starting with what state we need to store as React Hooks, how we can handle the user input with Controlled Components and eventually implemented conditional logic for showing fields and navigating between steps.

You can check out the full sample on Codesandbox:

{{< codesandbox id="react-dynamic-form-9ryxt" >}}
