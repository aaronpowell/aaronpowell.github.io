---
  title: "The great Umbraco API misconception"
  metaTitle: "The great Umbraco API misconception"
  description: "Sometimes the truth hurts"
  revised: "2010-10-04"
  date: "2010-04-08"
  tags: 
    - "umbraco"
    - "cms"
    - ".net"
    - "caution"
  migrated: "true"
  urls: 
    - "/the-great-umbraco-api-misconception"
  summary: ""
---
When Umbraco 4 was released it was a very exciting that there was an event model around everything in the back-end. This meant you could more powerful ActionHandlers firing on pre and post events (even though they are named against the standard .NET naming conventions).

Also, people were very excited that when a pre, sorry, before event fired it was possible to do a cancel on the event args. This was really good for a Save event, it meant for more custom actions, business logic around the saving, you name it.

But there's a problem, canceling the save doesn't do anything, the data is still saved!
But what, that's not right, I canceled the event.

And here is the problem, calling Save on a Document object does nothing! Nothing at all except firing the events.

So when does the data get saved, well that happens in this line:

    doc.getProperty("my_property").Value = "Hello World!";

That's right, the Set statement of the Value property of a Property object (well actually the Set statement of the associated IData.Value property, which is what's called from Property.set_Value).

Well yeah, that's the problem right there, if the Set statement does the save, doing the Save method has been rather pointless.
It's also got a really horrible problem of doing a shit load of database calls.

So next time you try and hook into the Save event to try and prevent a Save from happening, well sorry to break it to you, it just wont work!
Sure you could tie into the rollback feature as well so when you're doing a canceled save you can rollback to the previous version, just make sure you don't recall the Save method and get stuck in a rollback loop! :P

I think we may fix this in v5, but you don't want all the fun nuance of Umbraco going now do you? :P 

### What can I do? ###

So is there anything that you can do to get around the eventing order with Umbraco? The answer is [yes, yes you can][1].

### Why is it like this?

If you're interested in knowing why this happens check out my article on the [design of data types][2].


  [1]: /umbraco-event-improvments
  [2]: /umbraco-data-type-design