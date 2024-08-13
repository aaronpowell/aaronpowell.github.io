+++
title = "Building a Smart Home - Part 15 Generative AI and Notifications"
date = 2024-08-13T06:01:47Z
description = "Let's have some fun with Generative AI"
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Generative AI and Notifications"
+++

Like many people, I've been diving into Generative AI (GenAI) over the past 12 or so months and looking at how to use it in the sorts of solutions we can build. I'm also the kind of tinkerer that is looking for how to use technology in weird and wonderful ways. So, I've been looking at how to use GenAI in my smart home.

Before we get into that part of the story, a little bit of context around something I was doing recently. For the better part of a year I've had a daily notification that runs for our kids which tells them what they have on that day at school, whether it's their library day, they have sport, after school care, etc. This runs at 8.30am, which is just before we leave the house and, well, it's been a bit of a "Pavlov's bell" for them. They hear the notification and they know what's coming up that day and that it's time to be ready to leave.

The thing is, this message is pretty static, I run a template that looks at a bunch of helpers setup in Home Assistant and then generates a message. It's a bit boring because it's very static, like "<child name> here are your school reminders. It's sports day, don't forget your sports shoes. You have after school care today." It's the same generalised message, just plugging a few different variables in, so it solves the problem but it's not very interesting.

## Enter GenAI

After upgrading the hardware my Home Assistant instance runs on (from a Pi4 to a NUC), I have a bit more power to play with, so I had been running some Small Language Models (SLMs) on the NUC to see what I could do with them. The NUC itself is too underpowered to be used as a local GenAI server to back the Assistants part of Home Assistant (I tried, Phi3-mini doesn't have a large enough token cap for the system message, let alone a user message, and anything larger takes so long to response that it's completely impractical 🤣), but if it's running a SLM that is only serving responses on occasions, well that should be fine.

## Hello Ollama

The first thing we need to do is have a way in which we can run the SLM and get a response. I'm going to be using [Ollama](https://ollama.com), as it's a nifty little tool for working with models like this, and it can be run either as a standalone executable, or as a Docker container. Follow their guide on how to get it running on whatever host you have (I'm using Docker on my NUC).

Next, we'll need to pick a model to use. Because I'm running this on a NUC, I don't really have a GPU to play with, so I've decided to go with a pretty small model, [Phi3](https://azure.microsoft.com/blog/introducing-phi-3-redefining-whats-possible-with-slms/) using the `mini` variant of it, which is only about 2gb of disk size and has 3.82B parameters. It's not really that big, but given we're going to be CPU-bound for this, we'll have to make some tradeoffs (let's just say, I won't be running llama3.1:405b anytime soon 😅).

With everything setup, I can hit ollama with a request:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"prompt": "What should I tell the kids today?", "model": "phi3", "stream": false}' http://ollama.local:11434/api/generate
```

_Note: We set `stream: false` in the JSON payload to ensure we get the whole completion as a single response rather than a stream of responses. This is important because a streamed response isn't really useful in this context._

And get back a response (this one took just over a minute to generate):

```json
{
  "model": "phi3",
  "created_at": "2024-08-13T06:45:23.253914122Z",
  "response": " As an AI, I can help you come up with a variety of ideas for what to share with children. Here are some suggestions based on different themes:\n\n\n1. **Science**: Share interesting facts about space exploration or explain how plants grow using simple experiments they can try at home.\n\n2. **History/Social Studies**: Discuss the importance of a historical figure like Martin Luther King Jr., and explore his contributions to civil rights in an age-appropriate manner.\n\n3. **Literature**: Read a story or fable from Aesop, highlighting moral lessons within them. Encourage children to share their interpretations afterward.\n\n4. **Arts/Crafts**: Have the kids engage in an art project using recycled materials to teach creativity and environmental responsibility.\n\n5. **Daily Life Lesson**: Explain a simple concept like sharing or being kind, perhaps through interactive role-playing activities.\n\n6. **Physical Activity/Health**: Teach the kids about staying active and healthy with fun exercises they can do together or games that encourage movement.\n\n\nRemember to adjust the complexity of your message based on the age group you're addressing, ensuring it's engaging and understandable for them.",
  "done": true,
  "done_reason": "stop",
  "context": [
    32010, 1724, 881, 306, 2649, 278, 413, 4841, 9826, 29973, 32007, 32001,
    1094, 385, 319, 29902, 29892, 306, 508, 1371, 366, 2041, 701, 411, 263,
    12875, 310, 7014, 363, 825, 304, 6232, 411, 4344, 29889, 2266, 526, 777,
    10529, 2729, 373, 1422, 963, 267, 29901, 13, 13, 13, 29896, 29889, 3579,
    29903, 15277, 1068, 29901, 26849, 8031, 17099, 1048, 2913, 3902, 12418, 470,
    5649, 920, 18577, 6548, 773, 2560, 15729, 896, 508, 1018, 472, 3271, 29889,
    13, 13, 29906, 29889, 3579, 20570, 29914, 6295, 1455, 16972, 1068, 29901,
    8565, 1558, 278, 13500, 310, 263, 15839, 4377, 763, 6502, 24760, 4088,
    13843, 1696, 322, 26987, 670, 20706, 304, 7631, 10462, 297, 385, 5046,
    29899, 932, 6649, 403, 8214, 29889, 13, 13, 29941, 29889, 3579, 24938, 1535,
    1068, 29901, 7523, 263, 5828, 470, 285, 519, 515, 319, 267, 459, 29892,
    12141, 292, 14731, 3109, 787, 2629, 963, 29889, 11346, 283, 6617, 4344, 304,
    6232, 1009, 6613, 800, 1156, 1328, 29889, 13, 13, 29946, 29889, 3579, 1433,
    1372, 29914, 29907, 4154, 29879, 1068, 29901, 6975, 278, 413, 4841, 3033,
    482, 297, 385, 1616, 2060, 773, 1162, 11078, 839, 17279, 304, 6860, 907,
    28157, 322, 29380, 23134, 29889, 13, 13, 29945, 29889, 3579, 29928, 8683,
    4634, 27898, 265, 1068, 29901, 12027, 7420, 263, 2560, 6964, 763, 19383,
    470, 1641, 2924, 29892, 6060, 1549, 28923, 6297, 29899, 1456, 292, 14188,
    29889, 13, 13, 29953, 29889, 3579, 25847, 936, 13414, 29914, 3868, 4298,
    1068, 29901, 1920, 496, 278, 413, 4841, 1048, 7952, 292, 6136, 322, 9045,
    29891, 411, 2090, 24472, 3476, 267, 896, 508, 437, 4208, 470, 8090, 393,
    13731, 6617, 10298, 29889, 13, 13, 13, 7301, 1096, 304, 10365, 278, 13644,
    310, 596, 2643, 2729, 373, 278, 5046, 2318, 366, 29915, 276, 3211, 292,
    29892, 5662, 3864, 372, 29915, 29879, 3033, 6751, 322, 2274, 519, 363, 963,
    29889, 32007
  ],
  "total_duration": 76865873877,
  "load_duration": 1001112,
  "prompt_eval_duration": 266416000,
  "eval_count": 292,
  "eval_duration": 76556834000
}
```

Great, now let's plug this into Home Assistant.

## Home Assistant Integration

Home Assistant has an [Ollama integration](https://www.home-assistant.io/integrations/ollama/), but it's not quite what I want. This is if you want to plug Ollama (or any other GenAI service) into Home Assistant as an Assistant, so you can ask it questions and get responses. I want to use it as a notification, so I can generate a message and send it to the kids (or really, any broadcast notification), which means I'm going to be using a [RESTful Command](https://www.home-assistant.io/integrations/rest_command/) to call the Ollama API. Here's the configuration for that:

```yaml
ollama_phi3_completion:
  method: POST
  url: http://ollama.local:11434/api/generate
  content_type: "application/json; charset=utf-8"
  payload: "{{ payload }}"
  verify_ssl: false
  timeout: 300
```

Reload the RESTful Command config and then there will be a new entity in Home Assistant, `rest_command.ollama_phi3_completion`, which we can call from anywhere that allows us to call an action. To test it out, navigate to the Developer Tools -> Actions page in Home Assistant, select `rest_command.ollama_completion` from the dropdown, and then enter the following into the `Service Data` field:

```yaml
action: rest_command.ollama_phi3_completion
data:
  payload: |
    {
      "prompt": "What should I tell the kids today?",
      "model": "phi3",
      "stream": false
    }
```

And we can see a result:

![Ollama RESTful Command](/images/2024-08-13-building-a-smart-home---part-15-genai-and-notifications/001.png)

Awesome, time to plug it into an automation.

## Automation

I already have an automation that runs to generate the message that we then broadcast on the speakers around the house using a TTS (text-to-speech) service. I'm going to modify this automation to call the Ollama RESTful Command before calling the TTS service. But there's a catch, the Ollama API can take a while to respond, from testing it can take a few minutes with a "real" payload size, so to keep the 8.30am notification on time, I'm going to run the Ollama API call at 5.30am and "cache" the response up until it's needed.

Unfortunately, while Home Assistant has a `input_text` helper that we can use, it has a max length of 255 characters, which is not enough for the response we're going to get back from Ollama, so instead, we'll just have the automation wait around for 8.30am.

Here's the automation:

```yaml
- alias: Kids school announcements (AI)
  description: ""
  trigger:
    - platform: time
      at: 05:30:00
  condition:
    - condition: state
      entity_id: binary_sensor.school_is_school_day
      state: "on"
  action:
    - metadata: {}
      data:
        payload: "<snip>"
      response_variable: kid1_completion
      action: rest_command.ollama_phi3_completion
      alias: Generate kid1's announcement
    - metadata: {}
      data:
        payload: "<snip>"
      response_variable: kid2_completion
      action: rest_command.ollama_phi3_completion
      alias: Generate kid2's announcement
    - wait_for_trigger:
        - platform: time
          at: 08:30:00
    - if:
        - condition: template
          value_template: "{{ kid1_completion['status'] == 200 }}"
      then:
        action: tts.cloud_say
        data:
          cache: false
          entity_id: media_player.whole_house
          message: "{{ kid1_completion['content']['response'] }}"
      alias: Broadcast kid1 announcement
    - wait_for_trigger:
        - platform: state
          entity_id:
            - media_player.whole_house
          from: playing
          to: idle
      timeout:
        hours: 0
        minutes: 2
        seconds: 0
        milliseconds: 0
    - if:
        - condition: template
          value_template: "{{ kid2_completion['status'] == 200 }}"
      then:
        action: tts.cloud_say
        data:
          cache: false
          entity_id: media_player.whole_house
          message: "{{ kid2_completion['content']['response'] }}"
      alias: Broadcast kid2 Announcement
  mode: single
```

I've removed the actual payload from the automation, but you can see that we're calling the Ollama API at 5.30am, storing the response in a response variable, then using the `wait_for_trigger` action to wait until 8.30am before broadcasting the message. If the Ollama API call fails, we just skip that child's announcement. We also wait for the TTS service to finish before moving onto the next child's announcement.

### Example Run

Today, one of my kids didn't have any "special" activities at school, so the message that was sent to the SLM was:

```
Create a friendly response that will announced over our house speakers in the morning to inform a child of their activities that they have today.

Keep it short, it should be announced in the space of about 1 minute.

The child's name is '<child>', and the following is a description of what their day involves.

## Description

There are no special activities at school today.
```

And the response back from Ollama was:

```
Good morning <child>! It's time to get ready for another exciting day ahead. School starts just like any other day with learning, playing, and making new memories. Remember, even without special activities, every day brings opportunities to discover something amazing. Have a fantastic day at school, buddy!
```

## Conclusion

This was a fun little project to work on, and it's a great example of how you can use GenAI in your smart home to make things a little more interesting.

I've had this running for a few days now (it was running in the background to test generation for a bit before I did the TTS and deprecated the original one) and the first time it ran I heard a call from my kids of "Dad, the house said something different today!" which is either a good sign, or a sign that Pavlov's bell has been replaced with a new one 🤣.

There's still a few tweaks I need to do in the context around the message, for example, it will sometimes return emojis which the TTS service then reads out (we had "sparkle smiley face" the other day), but that's all part of the fun of working with GenAI.

It was also funny when we had school sport, as we use an acronym to refer to it, but that acronym the model doesn't know about, so it made something up for it with... less that helpful results!

My next plan is to plug this into the automations that announce when our various appliances have finished the cycles (see [Part 3]({{<ref "/posts/2022-08-18-building-a-smart-home---part-3-smart-appliances.md">}}) of this series on how I did that), so that we can get something _better_ than "The washing machine has finished" 🤣.
