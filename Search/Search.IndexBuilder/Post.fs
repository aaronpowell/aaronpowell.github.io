module Search

open System

type Post =
    { title: string
      content: string
      url: string
      tags: string []
      description: string
      date: DateTimeOffset }

type SearchData =
    { posts: Post [] }
