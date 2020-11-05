+++
title = "Building a Video Chat App, Part 3 - Displaying Video"
date = 2020-11-05T09:43:26+11:00
description = "We've got access to the camera, now to display the feed"
draft = false
tags = ["javascript", "azure"]
series = "building-video-chat"
series_title = "Displaying Video"
tracking_area = "javascript"
tracking_id = "10722"
+++

On my [Twitch channel](https://twitch.tv/NumberOneAaron) we're continuing to build our video chat application on [Azure Communication Services (ACS)](https://azure.microsoft.com/blog/build-rich-communication-experiences-at-scale-with-azure-communication-services/?{{<cda>}}).

[Last time]({{<ref "/posts/2020-10-22-building-a-video-chat-app-part-2-accessing-cameras.md">}}) we learnt how to access the camera and microphone using the ACS SDK, and today we'll look to display that camera on the screen.

## Displaying Video

As we learnt in the last post, cameras are available via a [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) in the browser, which we get when the user grants us access to their cameras. With raw JavaScript this can be set as the `src` attribute of a `<video>` element and the camera feed is displayed. But there's some orchestration code to setup and events to handle, so thankfully ACS gives us an API to work with, `LocalVideoStream` and `Renderer`.

## Creating a `LocalVideoStream`

The `LocalVideoStream` type requires a `VideoDeviceInfo` to be provided to it, and this type is what we get back from the `DeviceManager` (well, we get an array of them, you then pick the one you want).

We'll start by creating a new React context which will contain all the information that a user has selected for the current call.

```typescript
export type UserCallSettingsContextType = {
    setCurrentCamera: (camera?: VideoDeviceInfo) => void;
    setCurrentMic: (mic?: AudioDeviceInfo) => void;
    setName: (name: string) => void;
    setCameraEnabled: (enabled: boolean) => void;
    setMicEnabled: (enabled: boolean) => void;
    currentCamera?: VideoDeviceInfo;
    currentMic?: AudioDeviceInfo;
    videoStream?: LocalVideoStream;
    name: string;
    cameraEnabled: boolean;
    micEnabled: boolean;
};

const nie = <T extends unknown>(_: T): void => {
    throw Error("Not Implemented");
};

const UserCallSettingsContext = createContext<UserCallSettingsContextType>({
    setCurrentCamera: nie,
    setCurrentMic: nie,
    setName: nie,
    setCameraEnabled: nie,
    setMicEnabled: nie,
    name: "",
    cameraEnabled: false,
    micEnabled: false
});
```

_Note: I've created a stub function that throws an exception for the default hook setter functions called `nie`._

The context will provide a few other pieces of data that the user is selecting, such as their preferred mic and their name, but we're really focusing on the `videoStream` which will be exposed.

Now let's implement the context provider:

```typescript
export const UserCallSettingsContextProvider = (props: {
    children: React.ReactNode;
}) => {
    const [currentCamera, setCurrentCamera] = useState<VideoDeviceInfo>();
    const [currentMic, setCurrentMic] = useState<AudioDeviceInfo>();
    const [videoStream, setVidStream] = useState<LocalVideoStream>();
    const { clientPrincipal } = useAuthenticationContext();
    const [name, setName] = useState("");
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);

    useEffect(() => {
        if (clientPrincipal && !name) {
            setName(clientPrincipal.userDetails);
        }
    }, [clientPrincipal, name]);

    useEffect(() => {
        // TODO - handle camera selection
    }, [currentCamera, videoStream]);

    return (
        <UserCallSettingsContext.Provider
            value={{
                setCurrentCamera,
                setCurrentMic,
                currentCamera,
                currentMic,
                videoStream,
                setName,
                name,
                setCameraEnabled,
                cameraEnabled,
                setMicEnabled,
                micEnabled
            }}
        >
            {props.children}
        </UserCallSettingsContext.Provider>
    );
};

export const useUserCallSettingsContext = () =>
    useContext(UserCallSettingsContext);
```

When the `currentCamera` is changed (by user selection or otherwise) we're going to want to update the `LocalVideoStream`, and that's the missing `useEffect` implementation. First off, we'll need to create one if it doesn't exist, but since we can't create it until there's a selected camera, we'll check for that:

```typescript
useEffect(() => {
    if (currentCamera && !videoStream) {
        const lvs = new LocalVideoStream(currentCamera);
        setVidStream(lvs);
    }
}, [currentCamera, videoStream]);
```

## Using the `LocalVideoStream`

We've got ourselves a video stream, but what do we do with it? We need to create `Renderer` that will handle the DOM elements for us.

Let's create a component that uses the context to access the `LocalVideoStream`:

```jsx
const VideoStream = () => {
    const { videoStream } = useUserCallSettingsContext();

    return <div>Show video here</div>;
};

export default VideoStream;
```

The `Renderer`, which we're going to create shortly, gives us a DOM element that we need to inject into the DOM that React is managing for us, and to do that we'll need access to the DOM element, obtained using a `ref`.

```jsx
const VideoStream = () => {
    const { videoStream } = useUserCallSettingsContext();
    const vidRef = useRef < HTMLDivElement > null;

    return <div ref={vidRef}>Show video here</div>;
};
```

Since our `videoStream` might be null (camera is off or just unselected), we'll only create the `Renderer` when needed:

```jsx
const VideoStream = () => {
    const { videoStream } = useUserCallSettingsContext();
    const vidRef = useRef<HTMLDivElement>(null);
    const { renderer, setRenderer } = useState<Renderer>();

    useEffect(() => {
        if (videoStream && !renderer) {
            setRenderer(new Renderer(videoStream));
        }
    }, [videoStream, renderer]);

    return (
        <div ref={vidRef}>Show video here</div>
    );
};
```

With the `Renderer` created, the next thing to do is request a view from it, which displays the camera feed. We'll do this in a separate hook for simplicities sake:

```jsx
const VideoStream = () => {
    const { videoStream } = useUserCallSettingsContext();
    const vidRef = useRef<HTMLDivElement>(null);
    const { renderer, setRenderer } = useState<Renderer>();

    useEffect(() => {
        if (videoStream && !renderer) {
            setRenderer(new Renderer(videoStream));
        }
    }, [videoStream, renderer]);

  useEffect(() => {
    if (renderer) {
      renderer.createView().then((view) => {
        vidRef.current!.appendChild(view.target);
      });
    }

    return () => {
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [renderer, vidRef]);

    return (
        <div ref={vidRef}></div>
    );
};
```

The `createView` method from the `Renderer` will return a `Promise<RendererView>` that has information on the scaling mode and whether the video is mirrored (so you could apply your own mirror transform), as well as the `target` DOM element, that we can append to the children of the DOM element captured via the `vidRef` ref. You'll notice that I'm doing `!.` before `appendChild`, and this is to trick the TypeScript compiler, as it doesn't properly understand the `useRef` assignment. Yes, it's true that the `vidRef` _could_ be `null` (its default value), but that'd require the hooks and Promise to execute synchronously, which isn't possible, so we can override the type check using the [`!` postfix assertion](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-type-assertions).

## Changing Camera Feeds

It's possible that someone has multiple cameras on their machine and they want to switch between them, how would you go about doing that?

The first thought might be that we create a new `LocalVideoStream` and `Renderer`, but it's actually a lot simpler than that as the `LocalVideoStream` provides a `switchSource` method that will change the underlying camera source and in turn cascade that across to the `Renderer`.

We'll update our context with that support:

```typescript
useEffect(() => {
    if (currentCamera && !videoStream) {
        const lvs = new LocalVideoStream(currentCamera);
        setVidStream(lvs);
    } else if (
        currentCamera &&
        videoStream &&
        videoStream.getSource() !== currentCamera
    ) {
        videoStream.switchSource(currentCamera);
    }
}, [currentCamera, videoStream]);
```

This new conditional branch will make sure we have a camera, video stream and the selected camera isn't already set (this was a side effect of React hooks and not something you'd necessarily need to do), and that's all we need for switching, we don't need to touch our `Renderer` at all.

## Conclusion

There we have it, we're now displaying the camera feed and you can see yourself. The use of the `LocalVideoStream` and `Renderer` from the ACS SDK makes it a lot simpler to handle the events and life cycle of the objects we need to work with.

If you want to see the full code from the sample application we're building, you'll find it [on my GitHub](https://github.com/aaronpowell/super-duper-enigma/tree/part-04).

If you want to catch up on the whole episode, as well as look at how we integrate this into the overall React application, you can catch the recording on [YouTube](https://www.youtube.com/watch?v=qRHnKav1ZF0), along with the [full playlist](https://www.youtube.com/watch?v=ryf1011Qvzw&list=PLo-HK2IT4q4jr7n4jnMM5SHO2A2o1jE25)

{{<youtube "qRHnKav1ZF0">}}
