---
  title: "Analyzers in Lucene.Net"
  metaTitle: "Analyzers in Lucene.Net"
  description: ""
  revised: "2010-05-27"
  date: "2010-05-27"
  tags: 
    - "lucene.net"
    - "c#"
    - ".net"
    - "examine"
    - "umbraco-examine"
  migrated: "true"
  urls: 
    - "/lucene-analyzer"
  summary: ""
---
## What is an Analyzer?##

When you want to insert data into a Lucene index, or when you want to get the data back out of the index you will need to use an Analyzer to do this.

Lucene ships with many different Analyzers and picking the right one really comes down to the needs of your implementation. There are ones for working with different languages, ones which determine how words are treated (and which words to be ignored) or how whitespace is handled.

Because Analyzers are used for both indexing and searching you can use different ones for each operation if you want. It's not generally best practice to use different Analyzers, if you do you may have terms handled differently. If you used a WhitespaceAnalyzer when you do your indexing but a StopAnalyzer for retrieval although the word "and" is fine for indexing it wont be found when searching.

## Common Analyzers##

Not all of the Analyzers are useful in common scenarios, hopefully this will help you work out which one to use for your scenarios.

### Keyword Analyzer###

This Analyzer will treat the string as a single search term, so if you needed to handle say a product name (which has spaces in it) as a single search term then this is likely the one you want. It doesn't concern itself with stop words or anything of the like, but it's not really that good if you've got a large block of text that you want to insert into the index.

### Stop Analyzer & Standard Analyzer###

These are the most common Analyzers you'll come across when working with Lucene, in fact the StandardAnalyzer is the default one which is used within Examine (you can specify in the config the Analyzer for both indexing and searching though).

The StandardAnalyzer actually combines parts of the StopAnalyzer, StandardFilter & LowerCaseFilter. The StandardAnalyzer understands English punctuation for breaking down words (hyphens, etc), words to ignore (via the StopAnalyzer) and **technically** case insensitive searching (by doing lowercase comparisons).

The StopAnalyzer (which is **kind of** a lesser version of the StandardAnalyzer) understands standard English words to ignore. This actually got me unstuck at one point, I was trying to search on the letter A in a field (which only contained a single letter) and any match with the letter A was being ignored. This is because the following list of words are skipped over by the Analyzer:

    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", 
    "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", 
    "to", "was", "will", "with"

So if I was to search on `this world rocks` then I'd only have matches on `world` or `rocks`, the word `this` is ignored.

### Whitespace Analyzer###

The WhitespaceAnalyzer is also a bit of a sub-set of the StandardAnalyzer, where it understands word breaks in English text, based on spaces and line breaks.

This Analyzer is great if  you want to search on any English word, it doesn't ignore stop words so you can search on `a` or `the` if required. This was how I got around the problem I described above.

## Conclusion##

Understanding Analyzers can be a tricky aspect of Lucene, and it can be the cause of some grief if they are not properly handled.

The general rule of the thumb is that the StandardAnalyzer will do what you require, giving you well structured results and filter out irrelevant English language words, but the other main Analyzers will help filter down results based in your requirements.

And if you feel like getting really crazy (or you're dealing with non-English content) there are plenty of other Analyzers within Lucene you can look int.
