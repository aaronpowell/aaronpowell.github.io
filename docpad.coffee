# DocPad Configuration File
# http://docpad.org/docs/config

# Define the DocPad Configuration
docpadConfig = {
    templateData:
        site:
            title: 'LINQ to Fail'
            author: 'Aaron Powell'
            github: 'aaronpowell'
            twitter: 'slace'
        contentTrim: (str) ->
            if str.length > 200
                str.slice(0, 197) + '...'
            else
                str
        relatedPosts: (post) ->
            posts = @getCollection 'posts' 
            posts.map((p) ->
                matches = post.tags.map((tag) ->
                    (if p.tags.indexOf tag >= 0 then 1 else 0)
                ).reduce((x, y) ->
                    x + y
                , 0)
                post: p
                matches: matches
            ).sort((x, y) ->
                x.matches < y.matches
            )
    collections:
        posts: ->
            @getCollection('html').findAllLive({relativeOutDirPath: 'posts'}).on 'add', (model) ->
                model.setMetaDefaults({layout: 'post'})
}

# Export the DocPad Configuration
module.exports = docpadConfig