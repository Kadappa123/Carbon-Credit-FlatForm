Your Jenkins job is configured correctly. ✅

I can see that **"GitHub hook trigger for GITScm polling"** is enabled.

Now the remaining step is to configure the **GitHub webhook**.

## Step 1: Open your GitHub repository

Go to:

```
GitHub Repository
→ Settings
→ Webhooks
→ Add webhook
```

### Configure it like this

**Payload URL**

```
http://54.236.134.206:8080/github-webhook/
```

> If you're using HTTPS, use:
>
> ```
> https://your-domain/github-webhook/
> ```

**Content type**

```
application/json
```

**Secret**

Leave empty.

**Which events?**

Select:

```
Just the push event
```

Click **Add webhook**.

---

## Step 2: Test

Push a change:

```bash
git add .
git commit -m "Test webhook"
git push origin main
```

Jenkins should automatically start a build.

---

## Step 3: If it doesn't trigger

Go to:

```
GitHub
→ Settings
→ Webhooks
```

Click your webhook.

Then click:

```
Recent Deliveries
```

Check the latest delivery.

If you see:

* ✅ **200** → Webhook reached Jenkins successfully.
* ❌ **404** → Wrong webhook URL.
* ❌ **403** → Authentication or CSRF issue.
* ❌ **500** → Jenkins server error.

---

## Step 4: Verify Jenkins is reachable

From another browser or device, open:

```
http://54.236.134.206:8080/github-webhook/
```

If Jenkins is reachable, you'll get a response (it won't be a web page, but it shouldn't time out).

---

## Step 5: Check your EC2 Security Group

Since Jenkins is running on AWS, ensure the Security Group allows:

| Port | Source                                                             |
| ---- | ------------------------------------------------------------------ |
| 8080 | `0.0.0.0/0` (or GitHub's IP ranges if you want to restrict access) |
| 22   | Your IP                                                            |

Without port **8080**, GitHub cannot send the webhook.

---

### Please send one more screenshot

Open:

```
GitHub Repository
→ Settings
→ Webhooks
```

and send a screenshot of the webhook configuration (or the list of webhooks). That will let me verify whether the webhook URL and event settings are correct.
