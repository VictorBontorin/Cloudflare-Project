# Cloudflare OAuth Project

Web application deployed on Cloudflare Pages with OAuth authentication using Google and GitHub.

## Technologies

- JavaScript
- Cloudflare Pages
- OAuth 2.0
- Google OAuth
- GitHub OAuth

## Authentication

The project implements OAuth authentication flows for:

- Google
- GitHub

OAuth callback endpoints:

```text
/oauth/callback/google
/oauth/callback/github
```

## Deployment

The application is deployed using Cloudflare Pages.

Environment-specific configuration is handled through Cloudflare environment variables and encrypted secrets.

## Environment Variables

The application uses environment variables for OAuth configuration:

```text
PUBLIC_BASE_URL
GOOGLE_CLIENT_ID
GITHUB_CLIENT_ID
```

Sensitive credentials and secrets are not stored directly in the source code.

## Purpose

This project was developed to practice OAuth authentication, external identity providers, environment configuration, and cloud deployment using Cloudflare Pages.

## Author

João Victor Bontorin

[GitHub](https://github.com/VictorBontorin)
