# application-service-pocs-pubsub

1. install local redis

2. run redis

```
redis-server
```

3. run subscribe project

```
node application-service-pocs-subscribe/index.js
```

4. go to graph explorer at localhost

5. setup subscription (specifically for id 3 so we only get updates for this post)

```
subscription PostAdded {
  postAdded(id: 3) {
    id
    contents
  }
}
```

6. run publish project to send external event

```
node application-service-pocs-publish/index.js
```

7. external event should show up in subscribed response
