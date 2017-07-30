---
  title: "Working with dates and LINQ to SQL"
  metaTitle: "Working with dates and LINQ to SQL"
  description: "DateTime.MinValue doesn't match the SQL server minimum date. So how do you deal with it using LINQ to SQL?"
  revised: "2010-04-25"
  date: "2010-04-25"
  tags: 
    - "linq-to-sql"
    - "c#"
    - "datetime"
    - "sql"
  migrated: "true"
  urls: 
    - "/working-with-dates-and-linq-to-sql"
  summary: ""
---
Something I've heard developers complain about on numerous occasion is that DateTime comparisons between SQL and .NET is a real pain. Often you need to do a comparison of the date against either a Min or Max value.

With raw .NET this is really quite easy, you can just use the DateTime struct and grab DateTime.MinValue or DateTime.MaxValue.

But if you've ever done this:

    var res = from item in Collection 
              where item.CreatedDate != DateTime.MinValue 
              select item;

You'll get the following exception thrown:

    SqlTypeException: SqlDateTime overflow. Must be between 1/1/1753 12:00:00 AM and 12/31/9999 11:59:59 PM.

The problem is that `DateTime.MinValue` is actually **01/01/0001 12:00:00 AM**.

So I've quite often seen hacks where a new date is being created which represent the minimum value of the SQL server, and all kinds of weird things, but that's all redundant.
The comparision value is built into the .NET framework.

All you need to use is [System.Data.SqlTypes.SqlDateTime][1] structure. This exposes two fields, [MinValue][2] and [MaxValue][3]. All you need to do is access the Value property of these and pass it into your LINQ statement.
The date will be parsed correctly as a SQL valid date and you can do your comparisons!

So please, stop with any silly workaround for date comparisons with SQL and .NET :P


  [1]: http://msdn.microsoft.com/en-us/library/system.data.sqltypes.sqldatetime.aspx
  [2]: http://msdn.microsoft.com/en-us/library/system.data.sqltypes.sqldatetime.minvalue.aspx
  [3]: http://msdn.microsoft.com/en-us/library/system.data.sqltypes.sqldatetime.maxvalue.aspx