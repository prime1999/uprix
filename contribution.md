# Contributing to Uprix

Thank you for contributing to Uprix.

To maintain code quality, consistency, and a smooth development experience, all contributors are expected to follow the guidelines below.

---

# Project Workflow

Uprix follows a Pull Request-based workflow.

Contributors are responsible for:

- Picking assigned tasks
- Creating feature branches
- Implementing changes
- Testing their work
- Opening Pull Requests

Project maintainers are responsible for:

- Reviewing code
- Requesting changes when necessary
- Approving Pull Requests
- Merging approved changes into `main`

Direct pushes to the `main` branch are not allowed.

---

# Getting Started

## Clone the Repository

```bash
git clone https://github.com/YOUR_ORG/uprix.git
cd uprix
```

## Install Dependencies

```bash
npm install
```

## Start Development Server

```bash
npm run dev
```

---

# Task Management

Before starting work:

1. Check the project board.
2. Select or accept an assigned task.
3. Move the task status to **In Progress**.
4. Create a branch for the task.

Task statuses:

- Pending
- In Progress
- Review
- Done

Do not begin work on a task already assigned to another contributor unless instructed.

---

# Branch Naming Convention

Never work directly on `main`.

Create a dedicated branch for every task.

## Features

```bash
git checkout -b feature/hero-section
```

## Bug Fixes

```bash
git checkout -b fix/navbar-mobile
```

## Refactoring

```bash
git checkout -b refactor/auth-flow
```

## Documentation

```bash
git checkout -b docs/contributing-guide
```

---

# Verify Current Branch

Before making commits:

```bash
git status
```

or

```bash
git branch --show-current
```

Ensure you are not working on `main`.

---

# Commit Guidelines

Write clear and meaningful commit messages.

Examples:

```bash
git commit -m "feat: add hero section"
git commit -m "fix: resolve mobile navigation issue"
git commit -m "refactor: improve authentication flow"
git commit -m "docs: update contribution guide"
```

## Commit Types

| Type     | Description           |
| -------- | --------------------- |
| feat     | New feature           |
| fix      | Bug fix               |
| refactor | Code improvement      |
| docs     | Documentation changes |
| style    | UI or styling changes |
| chore    | Maintenance tasks     |

---

# Pushing Changes

## First Push

```bash
git push -u origin feature/hero-section
```

## Subsequent Pushes

```bash
git push
```

---

# Pull Requests

After completing your task:

1. Push your branch.
2. Open a Pull Request.
3. Link the related task.
4. Move the task to **Review**.
5. Wait for feedback.

Do not merge your own Pull Request.

All Pull Requests must be reviewed and approved by a project maintainer.

---

# Pull Request Template

Use the following format:

```md
## Summary

Brief description of the change.

## Changes Made

- Added ...
- Updated ...
- Fixed ...

## Testing

- Tested on desktop
- Tested on mobile
- No console errors

## Screenshots

Attach screenshots if applicable.
```

---

# Code Quality Requirements

Before opening a Pull Request:

- Code builds successfully
- No TypeScript errors
- No linting errors
- No console errors
- Responsive on mobile and desktop
- Existing functionality remains intact

---

# Review Process

A Pull Request may be:

### Approved

The maintainer approves and merges the PR.

### Changes Requested

The maintainer requests modifications.

Make the requested updates and push them to the same branch.

```bash
git add .
git commit -m "fix: address PR review feedback"
git push
```

The Pull Request will update automatically.

---

# After Merge

Once your Pull Request has been merged:

```bash
git checkout main
git pull origin main
```

Delete your local branch:

```bash
git branch -d feature/hero-section
```

Delete the remote branch if needed:

```bash
git push origin --delete feature/hero-section
```

---

# Communication

If a task is unclear:

- Ask questions before implementation.
- Discuss major architectural changes before coding.
- Keep Pull Requests focused on a single task.

---

# Uprix Development Principles

When contributing to Uprix:

- Prioritize clean and maintainable code.
- Keep components reusable.
- Follow existing project patterns.
- Optimize for performance and accessibility.
- Test before submitting work.
- Document significant changes.

---

Thank you for helping build Uprix.
