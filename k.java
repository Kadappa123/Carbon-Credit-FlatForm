The screenshot confirms the webhook data is correct:

```text
owner: Kadappa123
repo_name: basu
pull_request: 2
```

So the problem is **not the Webhook node**.

The problem is **HTTP Request2 is not reading from the Webhook node**.

### Do this to verify

In **HTTP Request2**, temporarily change the URL to just:

```javascript
{{ $node["Webhook"].json.body.owner }}
```

If the preview shows:

```text
Kadappa123
```

then the node can access the Webhook.

If it still shows:

```text
undefined
```

then the node cannot access the Webhook directly.

---

### Most likely fix

Since `HTTP Request2` is after several nodes (`Build Markdown Report`, `Aggregate`, etc.), use:

```javascript
{{ $items("Webhook")[0].json.body.owner }}
```

If that works, then use the full URL:

```javascript
{{ "https://api.github.com/repos/" +
$items("Webhook")[0].json.body.owner +
"/" +
$items("Webhook")[0].json.body.repo_name +
"/issues/" +
$items("Webhook")[0].json.body.pull_request +
"/comments" }}
```

---

## One final thing I need

Click **HTTP Request2** → **Settings** and tell me:

* Is **Execute Once** enabled?
* Is **Always Output Data** enabled?

Or send a screenshot of the **Settings** tab.

Also tell me your **n8n version** (I can see 2.30.4 earlier, but confirm if that's still the version). This affects which expression syntax (`$node`, `$items`, or `$input`) works correctly.
