---
  title: "Indexes and Queries in db.js"
  metaTitle: "Indexes and Queries in db.js"
  description: "An overview of how to create indexes and execute powerful queries against them using db.js"
  revised: "2012-10-02"
  date: "2012-10-02"
  tags: 
    - "indexeddb"
    - "web"
    - "winjs"
  migrated: "true"
  urls: 
    - "/web/dbjs-indexes-and-queries"
  summary: ""
---
In my [last post](/web/hello-dbjs) I introduced a new library I've been working on for [IndexedDB](http://www.w3.org/TR/IndexedDB/) called [db.js](https://github.com/aaronpowell/db.js).

One thing that I was slow in my understanding of with IndexedDB is how [indexes](http://www.w3.org/TR/IndexedDB/#index-concept) work, and just how powerful they can be. Now that I've got that _down pat_ the support in db.js is greatly improved. Also a big shout out to [Bob Wallis](https://github.com/bobwallis) who did a great job at adding the initial revision of index range queries.

# Creating a key path

When creating an object store, or table if you will, you're most likely going to want to have some kind of unique identifier for each record; this is what the role of the key path is. To create a key path when you define the schema for your database you can provide it with the `key` property:

    db.open({
        name: 'my-app',
        version: 1,
        schema: {
            people: {
                key: {
                    keyPath: 'id',
                    autoIncrement: true
                }
            }
        }
    });

What I've done here is defined that I want to have a property added to my objects called `id` which will be auto-incrementing (which will make it a number). Now when I add a new person the object will have a new property:

    server.people
        .add({
            firstName: 'Aaron',
            lastName: 'Powell'
        })
        .done(function (person) {
            console.log(person.id); //on a clean db this will be 1
        });

This key is useful if you want to access unique records from your store.

# Creating an index

While a key path is useful for a narrow set of scenarios it's likely that you'll be doing queries that are against other information in the store. Let's take our example and say we wanted to be able to query against the `firstName` property. For this we would want to create a non-unique index for our records:

    db.open({
        name: 'my-app',
        version: 1,
        schema: {
            people: {
                key: {
                    keyPath: 'id',
                    autoIncrement: true
                },
                indexes: {
                    firstName: { }
                }
            }
        }
    });

Now if we were to inspect our `person` store we would find an `indexName` of `firstName`. This allows us to perform queries against said index and have it perform much faster than manually filtering the records ourselves, especially in large data sets.

You can create multiple indexes here by adding more properties to the `indexes` property on the schema. If you want to set any of the [index parameters (IDBIndexParameters)](http://www.w3.org/TR/IndexedDB/#dfn-options-object) you can provide them as properties of the object for the index.

# Querying an index

Initially I didn't really wrap my head around indexes very well and when I started db.js there wasn't a whole lot of useful IndexedDB articles, most of the stuff you had to work out by reading the specification (which is so not written for consumers of an API!). Luckily now db.js has really good support for indexes and how you can query them.

Let's look at how we could query an index for all people with the first name of _Aaron_:

    server.people
        .query('firstName')
        .only('Aaron')
        .execute()
        .done(function (people) {
            //Do stuff with all the Aaron's
        });

The first thing that's different compared to the query in my [last post](/web/hello-dbjs) is when we invoke the `query` method we are providing it with the name of the index we want to query.

Next off we're using the `only` method. This method opens up a [IDBKeyRange](http://www.w3.org/TR/IndexedDB/#dfn-key-range) of type [only](http://www.w3.org/TR/IndexedDB/#widl-IDBKeyRange-only-static-IDBKeyRange-any-value) which will then select values that match that value exactly. This is very quick for reducing the amount of records returned from the object store itself.

# Querying across ranges

Sometimes you want a range of data, say you want people who are in a certain age bracket. Let's pretend that we have a numerical `age` property on our person object and we've created an index for it exactly the same way we created the `firstName` index. Now through the magic of db.js (well, IndexedDB :P) we can perform a set of range queries:

    server.people
        .query('age')
        .lowerBound(28 /*, true */) //by default it's an inclusive query, set to `true` to be exclusive
        .execute()
        .done(function (people) {
            //all the people who are 28 years or older
        });

    server.people
        .query('age')
        .upperBound(28 /*, true */) //by default it's an inclusive query, set to `true` to be exclusive
        .execute()
        .done(function (people) {
            //all the people who are 28 years or younger
        });

    server.people
        .query('age')
        .bound(25 ,35 /*, true , true */) //by default it's an inclusive query, set to `true` to be exclusive
        .execute()
        .done(function (people) {
            //all the people who are between 25 and 35, inclusive
        });

This shows the usage of:

- [`lowerBound`](http://www.w3.org/TR/IndexedDB/#widl-IDBKeyRange-lowerBound-static-IDBKeyRange-any-lower-boolean-open)
    - Get records using the provided value as a starting point
    - Optional second argument to if we want an exclusive query instead of inclusive, which is the default
- [`upperBound`](http://www.w3.org/TR/IndexedDB/#widl-IDBKeyRange-upperBound-static-IDBKeyRange-any-upper-boolean-open)
    - Get records using the provided value as an ending point
    - Optional second argument to if we want an exclusive query instead of inclusive, which is the default
- [`bound`](http://www.w3.org/TR/IndexedDB/#widl-IDBKeyRange-bound-static-IDBKeyRange-any-lower-any-upper-boolean-lowerOpen-boolean-upperOpen)
    - Gets values between a range
    - The 3rd and 4th arguments represent the exclusive nature, both default to `false`, implying inclusive but you can control the boundaries individually

These methods are from IndexedDB in pretty much their raw format but exposed in db.js so we can easily use the chaining to do the querying. And the advantages of these ranges is the same as when you look at a _real_ database, we only take a subset of the record set so it should be quicker.

# Advanced querying of indexes

So now we've got the basics down of creating a query against an index let's look at some of the more advanced features of db.js's query API.

## Sort order

By default db.js (well more accurately IndexedDB) will return your data in ascending order. Assuming we've stored the following information:

    var people = [{
        firstName: 'Aaron',
        lastName: 'Powell',
        age: 28
    }, {
        firstName: 'John',
        lastName: 'Smith',
        age: 30
    }, {
        firstName: 'Bill',
        lastName: 'Jones',
        age: 50
    }];

We've got three people with three different ages. If we were to do a `bound` query of `bound(25, 35)` we'll have the records returned in the order of 'Aaron' then 'John'. What if we want that order reversed?

Easy, add a `desc` call:

    server.people
        .query('age')
        .bound(25 ,35)
        .desc()
        .execute()
        .done(function (people) {
            //all the people who are between 25 and 35
        });

With the `desc` call we tell IndexedDB that we want to use [`IDBCursor.prev`](http://www.w3.org/TR/IndexedDB/#cursor-concept) which will tell IndexedDB to go backwards through our index.

## Unique items

When you create an index you can specify if you want the data to be unique but often this wont be the case, you just want to have an index of commonly searched terms. But what if you want to get just a single entry for each record out of the index, regardless of how many there are. A use case for this would be you want to know how many unique first names there are in your store. For this we can use the `distinct` method:

    server.people
        .query('firstName')
        .all()
        .distinct()
        .execute()
        .done(function (people) {
            //only one entry per name
        });

The `distinct` method also augments the `IDBCursor` state by using `nextunique` or `prevunique` cursor directions which the clued in reader will realise means you can do a descending unique query as well as an ascending unique query.

_Note: The way `prevunique` works is a little confusing and better covered off in a separate blog post._

## Unique keys

While the previous example is good it is not exactly what we wanted for the scenario laid forth. Even though we're able to query the index and get back the unique records we get back the _whole_ record. This is somewhat problematic as we're still pulling out more data than we really would want to be getting out, for the scenario we only wanted the keys. Well we can get just that information out if we need to:

    server.people
        .query('firstName')
        .all()
        .distinct()
        .keys()
        .execute()
        .done(function (names) {
            //only one entry per name
        });

By adding the `keys()` call we use an `openKeyCursor` call in IndexedDB, giving us just the keys that the index has. We can also use that in a range query:

    server.people
        .query('age')
        .bound(25, 35)
        .distinct()
        .keys()
        .execute()
        .done(function (ages) {
            //only one entry per age
        });

This time we'll know what ages are covered by our data set.

A key query doesn't have to be unique though, say you want to know how many entries you have for each key:

    server.people
        .query('firstName')
        .only('Aaron')
        .keys()
        .execute()
        .done(function (names) {
            //only the keys, if you have multiple entries of one key then you will get multiples in the result set
        });

This would be useful if you wanted to create a heat map from an index, you could do a map/ reduce to calculate:

    server.people
        .query('firstName')
        .all()
        .keys()
        .execute()
        .done(function (names) {
            var dataMap = names.map(function(x) {
              return {
                key: x,
                count: 1
              };
            });

            var dataGrouped = {};

            dataMap.forEach(function (x) {
              if (!dataGrouped[x.key]) {
                dataGrouped[x.key] = x.count;
              } else {
                dataGrouped[x.key]++;
              }
            });

            console.log(dataGrouped);
        });

## Record counting

Need to know how many items there are that match a query? Useful if you're implementing a paging system. Well you could perform your query and check the length of the result set or alternatively you could use the `count` method and not wait for the entries to be hydrated:

    server.people
        .query('firstName')
        .only('Aaron')
        .count()
        .execute()
        .done(function (count) {
            //the number of records matching the query
        });

*Note:* This time the argument provided to the `done` handler _won't_ be an array, it will be a number.

## Completely custom filtering

The indexes in IndexedDB are only single key indexes so there are times that you're going to be trying to create a query in a way that can't be done, say you want to query against two properties. Well that's not going to be possible to do with an index and this is where db.js can help.

With db.js there is a `filter` method that is exposed, this method allows you to provide it with a function that will be used to filter the results, this function must return a boolean result (`true` if you want the record, `false` if you don't). You can add as many of these as you want, but be aware of the performance hit that you may take as essentially they are provided to the `Array.filter` method:

    server.people
        .query('firstName')
        .only('Aaron')
        .filter(function (person) {
            return person.lastName === 'Powell';
        })
        .execute()
        .done(function (people) {
            //only the Aaron Powell's of the world
        });

Ideally you want to be using this in conjunction with an index. As you'll see in the above example I'm doing an initial `only` query to reduce our dataset base on the first names and then doing an additional filter against the persons last name to reduce our dataset event more. The `filter` method doesn't have to be applied to an index though, if you don't have an index that can represent the data you want back (say you're implementing search) you can call `filter` directly off the `query` method.

# Conclusion

Throughout this post we've dived deeper into the query engine of db.js, and by extension got a better understanding of how IndexedDB's indexes work.

We've looked at how to create a primary key of such in our object store through the schema mechanism of db.js.

Next we looked at how to create custom indexes against any property on our object in our store. We then took this and looked at how to go about querying against the index in a variety of different ways that are exposed in db.js.