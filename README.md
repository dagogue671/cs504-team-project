# CS504-Team-Project
Team Project for CS504

## Authors
David Gogue
Lanxi Luo
Sumeet Singh

## Project Description: A Multi-Factor Authentication System  

The group project consists of designing and implementing a multi-factor authentication system. The system should allow for two tasks: 

1. Creating usernames and passwords 

2. Logging in using the username, password, and PIN 

## Project Details
- Framework: Next.js

## Identity Platforms
- Google's Identity Platform (Firebase)
- Okta Auth0


## Running Project

Each demo requires that you create an app and generate the API keys needed for this project.
To create the keys, please go to both Firebase (https://firebase.google.com/) and Auth0 (https://auth0.com/) and sign up for an account.

**Instructions for setup is provided within both firebase-demo and okta-demo folders.**

To run your project, simply change into one of the demo folders and run the project, using the example below:
```
cd <platform name>-demo
npm run dev
```

## What has been done
> Built a SignUpForm.js and SignInForm.js using the [Best Practices for Identity Management](https://web.dev/identity) for the firebase-demo
> Added SMS Multi-factor Authenticator into the demo using the firebase reference found here [SMS Multi-factor Auth](https://firebase.google.com/docs/auth/web/multi-factor)
> Created okta-demo and implemented Auth0 into the app using reference found here [Add Login to Your Next.js Application](https://auth0.com/docs/quickstart/webapp/nextjs)



## Reference Links
[Best Practices for Identity Management](https://web.dev/identity)
[SMS Multi-factor Auth](https://firebase.google.com/docs/auth/web/multi-factor)
[Add Login to Your Next.js Application](https://auth0.com/docs/quickstart/webapp/nextjs)