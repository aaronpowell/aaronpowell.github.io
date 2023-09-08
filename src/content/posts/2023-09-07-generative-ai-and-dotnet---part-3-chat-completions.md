+++
title = "Generative AI and .NET - Part 3 Chat Completions"
date = 2023-09-07T06:30:42Z
description = "Chatty - finish this sentence for me"
draft = false
tags = ["dotnet", "ai"]
tracking_area = "dotnet"
tracking_id = "100129"
series = "ai-dotnet"
series_title = "Chat Completions"
cover_image = "/images/2023-09-07-generative-ai-and-dotnet---part-3-chat-completions/banner.png"
+++

If you followed the code sample in the [last post]({{< ref "/posts/2023-09-04-generative-ai-and-dotnet---part-2-sdk.md" >}}) you'll have a console application that can generate chat completions, but what I didn't do was explain what chat completions are or why we'd use them; that's the purpose of this post.

## What is a Chat Completion

A chat completion is a way of generating text based on a prompt. The prompt is a piece of text that you provide, and the completion is the text that is generated by the model. The model is a machine learning model that has been trained on a large corpus of text, and the prompt is used to seed the model to generate the completion.

We saw this in action with the first blog post and that if I was to give a prompt of **"The quick brown fox"** then the completion would be **"jumps over the lazy dog"**. But this is only part of what we're looking at here, that is a _completion_ but with OpenAI we use _chat completions_.

A chat completion is a completion that is generated based on a conversation, and is intended to come across as a natural response to the conversation. And here is how we're starting to break away from our LLM being a glorified auto-complete for your phone keyboard and into something that is more like carrying on a conversation.

Now this isn't _truly_ a conversation, the model doesn't understand what you're saying, it's just generating text based on the prompt and the model, but it's been trained in a manner that makes it appear to be conversational.

## Creating a Chat Completion

We saw this in the last sample, that we execute a chat completion using the `GetChatCompletionsAsync` method, passing in the model (or deployment in Azure OpenAI Service's case) and an instance of `ChatCompletionOptions`.

The `ChatCompletionOptions` class is used to provide configuration parameters to our all to the service, matching [the parameters in the REST API](https://platform.openai.com/docs/api-reference/chat/create).

Initially, we'll leave the parameters as their default value and focus on the one thing you **must** provide, the prompt, which we can either provide in the constructor or by adding it to the `Messages` property of the object:

```csharp
string prompt = "Describe the most recent Star Wars film.";

ChatCompletionsOptions options = new(new[] { new ChatMessage(ChatRole.User, prompt) });
```

You'll notice here that we're providing the `prompt` variable to a `ChatMessage` object in which we set a `ChatRole.User` as the `role` for this message. We'll cover prompt engineering in depth at a later date, but the quick view of it is that we use the _role_ to help our model understand context around what the prompt is, because while the prompt _can be_ just a single sentence, to make it really conversational we're going to likely want to provide more context around that. Since the `prompt` is from user input, we indicate that with the `ChatRole.User`, making the model know that this is something to response to. We could add a response from the model by adding a `ChatRole.Agent` message to the `Messages` property. There's also `System` and `Function`, but we'll cover them when we look at prompt engineering.

If we were to execute this prompt:

```csharp
Response<ChatCompletions> completions = await client.GetChatCompletionsAsync(model, options);

foreach (ChatChoice choice in completions.Value.Choices)
{
    string content = choice.Message.Content;

    Console.WriteLine(content);
}
```

We'd get a response like this:

> As an AI language model, I cannot have personal feelings, opinions, or experiences. But, I can provide an objective description of the movie "Star Wars: The Rise of Skywalker."

> "Star Wars: The Rise of Skywalker" is a 2019 epic space opera film directed by J. J. Abrams and serves as a concluding chapter in the Skywalker Saga. The movie follows the story of Rey, Finn, Poe, and their allies as they embark on a mission to find Exogol, the hidden planet where the evil Palpatine has been resurrected and is preparing to launch a final attack against the Resistance.

> Throughout the movie, the characters undergo various challenges and confrontations against Palpatine's forces. They also uncover deep secrets about their families and their connections to the Force.

> The musical score, visual effects, and action sequences depicted in the film received praise from critics and audiences. However, some fans and critics criticized the movie's pacing, storylines, and inconsistency with previous installments in the franchise. Despite this, "Star Wars: The Rise of Skywalker" was a box-office success, grossing over $1 billion worldwide.

_Note: Your result would likely be different as the output won't be word-for-word consistent, it'll only be consistent in the general theme - this is generative after all._

## Tweaking our Chat Completion

When we are working with our model we might want to tweak how it behaves and we can do that by providing additional parameters to the `ChatCompletionOptions` object. Since it will be "making up" an answer we run the risk of a [hallucination](<https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)>) in which the model gives as a result that is completely fabricated with no basis in reality.

To adjust this, we can play with the `Temperature` property. By default, this is set to 1.0 and must be between 0 and 2. Let's execute our chat completion with a temperature of 0.5 (you can use the [Polyglot Notebook in my repo](https://github.com/aaronpowell/aaronpowell.github.io/blob/main/notebooks/2023-09-07-generative-ai-and-dotnet---part-3-chat-completions.ipynb)):

```csharp
ChatCompletionsOptions options = new(new[] { new ChatMessage(ChatRole.User, prompt) })
{
    Temperature = 0.5f
};
```

Running it again yields a result such as this:

> As an AI language model, I do not have personal experience or emotions, but I can provide an objective description of the most recent Star Wars movie.

> The most recent Star Wars movie is "Star Wars: The Rise of Skywalker," which was released in December 2019. The movie is directed by J.J. Abrams and follows the story of Rey, Finn, and Poe as they try to defeat the evil First Order and its leader, Kylo Ren.

> The movie begins with the discovery of a mysterious transmission from the late Emperor Palpatine, who has somehow returned from the dead and is threatening to destroy the galaxy. Rey, Finn, and Poe embark on a dangerous mission to find and destroy the Emperor once and for all.

> Throughout the movie, the characters face many challenges and obstacles, including battles with the First Order, encounters with new and old allies, and personal struggles with their own identities and pasts.

> In the end, the movie culminates in a final battle between the Resistance and the First Order, with Rey and Kylo Ren facing off against the Emperor in a dramatic and emotional showdown. The movie ends with a sense of closure and resolution, as the characters come to terms with their pasts and look towards a new future.

It's a little more _clinical_ than the original, arguably less creative, but it's also less likely to be completely made up (although we are using a fairly well documented movie, so there is a lot of grounding data that the model would have been trained on).

Let's go the other way and turn the creativity all the way up to 2:

```csharp
ChatCompletionsOptions options = new(new[] { new ChatMessage(ChatRole.User, prompt) })
{
    Temperature = 2.0f
};
```

Now let's see a result:

> As an AI language model, I cannot Recent mostly Subject to Human's Reaction.

> The Star Wars series witnessed the december "without grandeur": chaotic reviews reminded observers advance weaknesses; quarantine-amperf_likelyturned expectation ainvolk_monolith front-cricket media_machine difference years directly sharpen memorable grandfilm inspired director galaxies making Rey fighter_clinks awakened baby_yorzutan cliff_news sources attempts, ensure timing humorous monsters-story full_score writers fuelde motion_center_technybots intense-\_energy universe tale unmistakize background hope defntt_difference audience vast_difference symbolism incredible_Tolkien esacaranthros tozkheeri. Being recours_referred_epoe experts found simply entire points unmatched movie fascinating_author had awink_pepping movie approach towards fall dramatically restared '9_genre continues did excellent years!".

Well, that's pretty terrible! I ran the same prompt a few times and each time I got an equally terrible result. But this is to be expected. We "told" the model to go completely wild and it did, and it's not going to be able to generate something that is coherent when that's done because all it is trying to do is combine letters together to make something that looks like a word. After all, if we look at the output there _are_ words in there and some of those words are relevant to Star Wars, _galaxies_, _Rey_, _fighter_, _hope_, and so on, but they aren't words forming sentences.

Realistically, you would likely want a `Temperature` of just below 1 as this gives you a good balance between creativity and coherence, but it's the sort of thing you need to experiment with in your own applications.

There are also other parameters that you can tweak, such as `TopP` and `FrequencyPenalty`, that you can use to adjust the output of your model. I'll leave it to you to experiment with those.

### Playing with TopP

While `Temperature` is one way to control the output, the other useful one is `top_p`, or as it's exposed in the .NET SDK, `NucleusSamplingFactor` (which is what it refers to in AI terminology). While `Temperature` controls the randomness of the output generated, `NucleusSamplingFactor` controls the _diversity_ of the output by controlling the number of tokens that are considered when generating the output, the higher the value the more tokens are considered.

Using a low value for `NucleusSamplingFactor`, say `0.1f`, the result from the model will only consider words in the top 10% of confidence that that would be the next word to come in the completion, meaning that the completion should seem "more correct", but it will also be less creative and less diverse in the set of words used. Swinging to the other end of the spectrum and using `1f` (it must be a value between 0 and 1) will mean that all words are considered, so the completion will be more creative, but it will also run the risk of being less coherent.

It's important that when you're tweaking these values that you chose whether you want to control the Temperature or the Nucleus Sampling Factor, as you only want to adjust one of them, not both, as they are both controlling the same thing, just in different ways.

## Resulting Object

The `GetChatCompletionsAsync` returns a `Response<ChatCompletions>` in which the `Response<T>` is a wrapper type from Azure with some info about the response, such as the HTTP status, what we're really interested in is the `ChatCompletions` object. From here we can look at info from the service, such as the `Id` of the completion, the usage information of the available tokens, and most importantly the `Choices` property.

`Choices` are the responses from the model and contains the `Message` (we'll come back to that), `FinishReason` (why the model stopped generating text), and `Index` (the index of the choice in the list of choices), and `ContentFilterResults` (was there any flagging for hate, sexual context, etc.).

The `Message` property is an instance of `ChatMessage` and contains the `Content` which is the generated text that you are going to display to the user, as well as information about the function, but OpenAI functions are a topic for a later date.

So far we've only seen a single choice come back, which is because that's the default on `ChatCompletionOptions`, but you can change this with the `ChoiceCount` property, although that doesn't guarantee that you'll get that many choices back, it's just the maximum number of choices you'll get back.

## Conclusion

To core of a text-based application with Generative AI is around chat completions. We've seen that with a call to `GetChatCompletionsAsync` we can generate a response to a prompt, and that we can tweak the parameters to get different results.

We saw that by tweaking the `Temperature` and `NucleusSamplingFactor` we can control the creativity and coherence of the response. If we go too far in either extreme the output really stops being useful - especially an "overly creative" temperature setting. We also saw that we can use the `ChoiceCount` to control the maximum amount of responses that we want to get back.

There are other properties on the `ChatCompletionOptions` that we can adjust to control the output, and as we dive deeper into more advanced aspects of working with Generative AI we'll look at those.

If you want to play with this sample, check out the [Polyglot Notebook in my repo](https://github.com/aaronpowell/aaronpowell.github.io/blob/main/notebooks/2023-09-07-generative-ai-and-dotnet---part-3-chat-completions.ipynb).