---
  title: "Building LINQ to Umbraco"
  metaTitle: "building-linq-to-umbraco"
  description: "Ever wondered how LINQ to Umbraco was build? Well look no further"
  revised: "2010-08-27"
  date: "2010-04-07"
  tags: 
    - "umbraco"
    - "linq"
    - "linq-to-umbraco"
  migrated: "true"
  urls: 
    - "/building-linq-to-umbraco"
  summary: ""
---
# In the beginning #

LINQ to Umbraco is actually a lot old a project that most people realise, in fact the initial idea of LINQ to Umbraco started when I had a discussion with Niels Hartvig (founder of Umbraco) at the end of 2007 when he was running training in Melbourne.

Back then C# 3.0 was just released, Visual Studio 2008 was just out and everyone was very excited about this new technology *LINQ*. I discussed it with him and he really liked the idea of having a LINQ provider, but it was nothing more than a "That would be awesome!" idea. Keep in mind, this is before Umbraco 4.0 had even been released!

About 6 months later I had got fed up with working directly with the Document API (as we were doing a lot of Document creation at the time) and I decided that I would write a wrapper for it. This project was called **Umbraco Interaction Layer**, and was really just a new way to create/ edit/ delete documents. As an afterthought I decided to add "LINQ" to it, but it was again nothing more than a wrapper on top of the Document API so it was really shit slow (and would **really** hammer a database!).

After I released the initial version there was a lot of community excitement about having LINQ to Umbraco, so after raising it with Niels that I was planning on writing a *proper* LINQ provider, one which wouldn't bring a server to its knees I was asked to join the core team and include it in the Umbraco 4.5 release.
