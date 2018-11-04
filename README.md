# Pirple-Assignment-2

You are building the API for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager:  
  
1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.  
  
2. Users can log in and log out by creating or destroying a token.  
  
3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system).  
  
4. A logged-in user should be able to fill a shopping cart with menu items  
  
5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards  
  
6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account  
  
Important Note: If you use external libraries (NPM) to integrate with Stripe or Mailgun, you will not pass this assignment. You must write your API calls from scratch. Look up the "Curl" documentation for both APIs so you can figure out how to craft your API calls.   
  
This is an open-ended assignment. You may take any direction you'd like to go with it, as long as your project includes the requirements. It can include anything else you wish as well.  

## Endpoints

### `/users`

##### POST

- Create a new user with a unique email address.  
Required fields: (in JSON payload) `name`, `email`, `password`, `address`.  

##### GET

- Retrieve data for an existing user.  
Required fields: (in query string) `email`  
Requires token: Yes

##### PUT

- Update an existing user.  
Required fields: (in JSON payload) `email`  
Optional fields: (in JSON payload) `name`, `password` (at least one must be specified)  
Requires token: Yes

##### DELETE

- Delete an existing user.  
Required fields: (in query string) `email`  
Requires Token: Yes

### `/tokens`

##### POST

- Create a token for a user. (log in)  
Required fields: (in JSON payload) `email`, `password`  
Requires token: No

##### GET

- Lookup the token for a user.  
Required fields: (in query string) `id`   
Requires token: No

##### PUT 

- Extend a token for a user.  
Required fields: (in JSON payload) `email`, `extend`  
Requires token: Yes 

##### DELETE
  
- Remove a token configuring the user's log out.
Required fields: (in query string) `id`  
Requires token: Yes 
  
### `/menus`
  
##### GET

- Lookup the available menus.
Required fields: none
Required token: Yes

### `/shoppingcarts`
   
##### POST

- Add a new product item, only a user admin can do it.  
Required fields: (in JSON payload) `sku`, `name`  
Requires token: Yes 

##### GET

- Returns all product is no fields specified, if `sku` specified get single product and if `reviews` is specified gets products reviews.  
Required fields: none  
Optional fields: (in query string)`sku`, (in headers)`reviews`  
Requires token: Yes

##### DELETE

- Remove a review, only the user how posted the review can do it.  
Required fields: (in query string)`email`, (in headers)`sku`  
Requires token: Yes 

##### PUT 

- Extend a token for a user.  
Required fields: (in JSON payload) `email`, `extend`  
Requires token: Yes 

### `/orders`

##### POST

- Create a new product review.  
Required fields: (in query string) `email`  
Requires token: Yes  


