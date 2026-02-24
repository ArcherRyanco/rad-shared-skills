# Vercel Deployment Skill for OpenClaw

This skill provides a convenient way to interact with Vercel for deploying projects, managing environment variables, checking deployment status, and more.

## Prerequisites

Before using this skill, you need to have the Vercel CLI installed and authenticated.

### 1. Install Vercel CLI

If you don't have the Vercel CLI installed, you can install it globally using npm:

```bash
npm install -g vercel
```

### 2. Authenticate Vercel CLI

You need to authenticate the Vercel CLI with your Vercel account. Run the following command and follow the prompts:

```bash
vercel login
```

This will typically open a browser window for you to log in.

### 3. Link Your Project (if not already linked)

If your project is not already linked to Vercel, navigate to your project directory and run:

```bash
vercel link
```

## Available Commands and Usage

Here's how you can use the Vercel skill within OpenClaw:

### 1. Deploy Projects

Deploy your project to Vercel.

-   **Deploy to production:**
    ```bash
    vercel --prod
    ```
-   **Create a new deployment (preview):**
    ```bash
    vercel
    ```

### 2. Manage Environment Variables

Manage environment variables for your Vercel projects.

-   **Add an environment variable:**
    ```bash
    vercel env add <name> <value>
    ```
    You will be prompted to select the environments (e.g., development, preview, production).

-   **List environment variables:**
    ```bash
    vercel env ls
    ```

-   **Edit an environment variable:**
    ```bash
    vercel env edit <name>
    ```

-   **Remove an environment variable:**
    ```bash
    vercel env rm <name>
    ```

### 3. Create Preview Deployments from Branches

When you deploy from a Git repository connected to Vercel, Vercel automatically creates preview deployments for each push to a Git branch (excluding the production branch).

To manually create a preview deployment from your current branch:

```bash
vercel deploy
```

Vercel will detect your Git branch and deploy it as a preview.

### 4. Link/Unlink Projects

-   **Link a project:**
    If you're in a project directory that hasn't been linked to Vercel, run:
    ```bash
    vercel link
    ```

-   **Unlink a project:**
    To unlink a project from the current directory:
    ```bash
    vercel unlink
    ```

### 5. Check Deployment Status and Logs

-   **List deployments:**
    ```bash
    vercel ls
    ```

-   **View logs for a deployment:**
    First, get the deployment URL or ID using `vercel ls`. Then, run:
    ```bash
    vercel logs <deployment-url-or-id>
    ```

-   **Check the status of a specific deployment:**
    You can often infer status from `vercel ls` or by trying to access the deployment URL.

### 6. Rollback Deployments

To rollback to a previous deployment, you first need to identify the deployment ID using `vercel ls`.

-   **Rollback to a specific deployment:**
    ```bash
    vercel rollback <deployment-url-or-id>
    ```

## Example Workflow

1.  **Navigate to your project:**
    ```bash
    cd ~/clawd/clients/my-project
    ```
2.  **Deploy to production:**
    ```bash
    vercel --prod
    ```
3.  **Add a new environment variable:**
    ```bash
    vercel env add MY_API_KEY <your-api-key>
    ```
    (Follow the prompts to select environments)
4.  **Check recent deployments:**
    ```bash
    vercel ls
    ```
