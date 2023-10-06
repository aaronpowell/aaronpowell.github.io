+++
title = "Generative AI and .NET - Part 4 Images"
date = 2023-10-06T03:58:48Z
description = "Everything is better with visuals."
draft = false
tags = ["dotnet", "ai"]
tracking_area = "dotnet"
tracking_id = "100129"
series = "ai-dotnet"
series_title = "Images"
cover_image = "/images/2023-10-06-generative-ai-and-dotnet---part-4-images/banner.jpg"
+++

After text generation the most common thing you're likely wanting to generate with an LLM is going to be images. We've all seen those awesome images generated with Midjourney, Stable Diffusion, DALL-E, and others. In this post we'll look at how to generate images with .NET and an LLM, specifically the DALL-E models from OpenAI. We'll use DALL-E 2 because at the time of writing [DALL-E 3](https://openai.com/dall-e-3) isn't available, but I anticipate that it will work the same from a .NET perspective.

## Calling the API

Since the DALL-E models are part of the OpenAI LLM family, we'll use the same `OpenAIClient` class that we used in the previous posts in this series, with the only difference being the method that we call, `GetImageGenerationsAsync`.

```csharp
string prompt = "A painting of a cat sitting on a chair";

Response<ImageGenerations> response = await client.GetImageGenerationsAsync(new ImageGenerationOptions {
  Prompt = prompt
});

ImageGenerations imageGeneration = response.Value;
Uri imageUri = imageGeneration.Data[0].Uri;

Console.WriteLine($"Image URI: {imageUri}");
```

Really, it's just _that easy_.

## Image Generation Options

With the `ImageGenerationOptions` class we're able to control some aspects of the image generation process. The options are:

- `ImageCount`: how many images you want back (defaults to 1 but you can get up to 10).
- `ResponseFormat`: do you want a URL to the image or a base64 encoded string of the image (defaults to URL).
- `Size`: how big an image do you want from the options of 256, 512, or 1024 (defaults to 1024).
  - Note: Images are always square.
- `User`: a unique identifier for the user who the image is generated for. This isn't needed and will default to nothing, but OpenAI uses it to monitor for abuse, so if you're creating an app where _anyone_ can generate an image, it could be useful to include.

What you'll notice is that you don't have some of the other controls that we had when doing text generation, around things like `Temperature` and `TopP`. This is because these properties are used to influence how the model would generate the next token (word) in the sequence for the completion, but since we aren't dealing with a text output there's no need for them.

## Conclusion

That's it! It's really that easy to generate images with .NET and an LLM.

And yes, the banner image for this post was generated with AI (I might have cheated and used the newly released DALL-E 3 model via [Bing Create](https://bing.com/create)) using the prompt `I need a banner image for a blog post about generating images with AI. Make something creative and abstract`.

![The AI image generated for the blog](/images/2023-10-06-generative-ai-and-dotnet---part-4-images/banner.jpg)
