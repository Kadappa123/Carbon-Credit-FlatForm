Yes, a **multi-repo** workflow **can** support this. The problem is **not** that it's multi-repo.

The problem is that your webhook payload only contains:

```json
{
  "owner": "Kadappa123",
  "repo_name": "basu",
  "pull_request": 1
}
```

It does **not** contain GitHub's original fields like:

* `pull_request.comments_url`
* `pull_request.files_url`

A multi-repo workflow **doesn't require** those fields, but if your workflow references them, they'll be `undefined`.

### I need to understand your architecture

Please answer **one question**:

**How is n8n receiving the webhook?**

1. **GitHub → n8n directly** ✅
2. **GitHub → Python/Flask/FastAPI → n8n**
3. **GitHub → Jenkins → n8n**
4. Something else

From your screenshots, it looks like **GitHub is not sending the original webhook payload to n8n**. Instead, n8n receives a simplified payload (`owner`, `repo_name`, `pull_request`, etc.).

If that's intentional, we can absolutely make the workflow multi-repo by building the URLs dynamically. If not, we need to find where the original payload is being transformed.

**Tell me which of the four options above matches your setup.**
