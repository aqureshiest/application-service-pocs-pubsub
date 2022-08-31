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

5. setup subscription
```
subscription PostAdded {
  postAdded {
    id
    contents
  }
}
```

5. run publish project to send external event
```
node application-service-pocs-publish/index.js
```

6. external event should show up in subscribed response
