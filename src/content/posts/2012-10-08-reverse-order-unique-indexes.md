---
  title: "Reverse order unique queries in IndexedDB"
  metaTitle: "Reverse order unique queries in IndexedDB"
  description: "The quirk of reverse index querying in IndexedDB and in turn db.js"
  revised: "2012-10-08"
  date: "2012-10-08"
  tags: 
    - "indexeddb"
    - "web"
  migrated: "true"
  urls: 
    - "/web/reverse-order-unique-indexes"
  summary: ""
---
[In my post my db.js querying](https://www.aaron-powell.com/web/dbjs-indexes-and-queries) I covered how to do reverse unique queries with db.js using the `desc().distinct()` method chaining which will query an index for the unique items, but it'll do it in reverse order, essentially it will set a [`IDBCursor` direction of `prevunique`](http://www.w3.org/TR/IndexedDB/#cursor-concept).

When covering off I mentioned that the way it works is a little unusual and here I'll explain why.

# How an index "looks"

So you've got an index in your object store, an index which is non-unique, and it contains duplicate values. Say you created an index like this:

    store.createIndex('foo', 'foo', { unique: false });

Next you've pushed a few items into it:

    store.add({ foo: 'bar' });
    store.add({ foo: 'bar' });
    store.add({ foo: 'baz' });

The data which has been stored in the index can be visualised as so:

<table>
    <thead>
        <tr>
            <th>Key</th>
            <th>Value</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>bar</code></td>
            <td>
                <pre>
{
    id: 1,
    foo: 'bar'
}
                </pre>
            </td>
        </tr>
        <tr>
            <td><code>bar</code></td>
            <td>
                <pre>
{
    id: 2,
    foo: 'bar'
}
                </pre>
            </td>
        </tr>
        <tr>
            <td><code>baz</code></td>
            <td>
                <pre>
{
    id: 3,
    foo: 'baz'
}
                </pre>
            </td>
        </tr>
    </tbody>
</table>

# Walking our index

From the diagram you can see the order of the data in our index, let's assume we're wanting to just walk through the index normally, using the `next` direction (the default if you don't set anything). We'll get back the records in the order of id 1, 2, 3, or by their key, `bar`, `bar`, `baz`. Now this makes sense, we're walking top-to-bottom just as the spec states and as we'd expect from looking at our index.

Now let's turn that into a `nextunique` query, this time we get back the records with the id 1, 3, or the index keys `bar`, `baz`.

This is again to be expected, if you review the spec it states (emphasis is mine):

> "nextunique". This direction causes the cursor to be opened at the start of the source. When iterated, the cursor should not yield records with the same key, but otherwise yield all records, in monotonically increasing order of keys. **For every key with duplicate values, only the first record is yielded.** When the source is an object store or a unique index, this direction has the exact same behavior as "next".

So what's interesting here is that there are deterministic rules as to how the item to be returned is selected from the index, basically it's what ever is first in the index for that key. This is basically what we'd expect, no surprised so far.

# Walking backwards through our index

We've looked at walking forward through our index, but what if we want to walk backwards through it? Well that's where the `prev` cursor direction is for. Say we were to do a read-all operation using a `prev` cursor, we'll have the records in the order of id 3, 2, 1, or `baz`, `bar`, `bar`.

Not particularly shocking here, again that's what we'd be expecting, we've started at the end of the index and we've grabbed the item then gone to the one before it in the index and so on.

Now it's over to the `prevunique` query so that we can get just a unique item for each index key from our index. The items we get back have an ID order of 3, 1 or the index keys `baz`, `bar`. Wait something doesn't look right there, the ID's were:

    3
    1

And this is where it starts getting confusing...

## Understanding `prevunique`

Let's have a look at the spec for `prevunique` (emphasis is mine):

> "prevunique". This direction causes the cursor to be opened at the end of the source. When iterated, the cursor should not yield records with the same key, but otherwise yield all records, in monotonically decreasing order of keys. **For every key with duplicate values, only the first record is yielded**. When the source is an object store or a unique index, this direction has the exact same behavior as "prev".

Do you see the confusing point, it states that when a duplicate item is found of a key you take _the first record_ and this is where I was tripped up. When I first read this I took it as the first record _found_ in the index, so when walking backwards in our example index above, we would get the ID of `2` as it was the first record with the `bar` key. But this is not the case, it is actually the first record _in the index_ with that key, and since the record with the id `1` appears first in the index it will be returned. The key order is correct, we've reverse-walked it based on that, but it was the item order that trips people up. In fact I raised a [bug on Chrome](http://code.google.com/p/chromium/issues/detail?id=152879) as I was assuming that they had got it wrong. The bug has since been closed as it is implemented correctly.

The order can be summed up as:

> Reverse order by keys, items by index position

# Conclusion

The way IndexedDB handles reverse index walking is a little bit confusing on first read, but the more you review it the more that it starts to make some sense.

Currently IE10 doesn't handle this correctly though, it incorrectly reverses the order of the items in the index, I raised the question to them and you can find out more in the [thread on the mailing list](http://lists.w3.org/Archives/Public/public-webapps/2012OctDec/0043.html).

Admittedly this is a pretty esoteric problem to come across though, I can't think of an instance where the ordering of items in an index when traversed in reverse would be important, but then that may really just be a failure of imagination. If order is _really_ that important you're probably best structuring your data so that the key can be unique.