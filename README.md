This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.25.


- [Getting Started] 
  - [Installation and Quick Start] 
- [Development Quick Reference] 
  - [Development server] 
  - [Code scaffolding] 
  - [Build] 
  - [Running unit tests] 
  - [Running end-to-end tests] 
  - [Key files and folders for development] 
  - [The Application Structure] 
- [The Development/Release Cycle]  
  - [The Branches] 
  - [The Process]  
- [Design] 
  - [Material Design] 
  - [Angular Material] 
- [Technology] 
  - [Angular] 
  - [The Structure of an Angular Application] 
- [AWS Services]
  - [AWS Amplify] 
  - [AWS Cognito] 
    - [Creating a Live User] 
    - [Setting a Users Password] 
  - [AWS Route 53] 
  - [AWS S3 & CloudFront] 
- [Testing] 
  - [End to End with Cypress] 
      - [Using Fixtures and Stubbing Services] 
        - [Live.json] 
        - [GraphQL (DynamoDB access)] 
      - [Cross-Browser Testing] 
- [Issue Tracking] 

# Getting Started

### Installation and Quick Start

<https://aws-amplify.github.io/docs/js/start?platform=angular>

Make sure you are in the top level of the project and follow the instructions below.

1. Install NPM if not already installed

2. Install Angular
 
         npm install -g @angular/cli
 
         ng serve --open
         
    If you leave ```ng serve```  running it will serve up the application and reload upon file changes.

3. Install Amplify 

       npm install -g @aws-amplify/cli 

       amplify status
       
       
## Development Quick Reference

### Development server

Run ```./bin/dev.sh``` for a development server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

#### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build or `--aot` to check that it builds under the AOT compiler.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io). (TODO: At present I have not written **any** unit tests, these are all stubs. I've focussed on getting integration tests working.) 

### Running end-to-end tests

<https://docs.aws.amazon.com/amplify/latest/userguide/running-tests.html>

<https://docs.cypress.io/guides/getting-started/installing-cypress.html#Opening-Cypress>

End to end tests are peformed using [Cypress](https://cypress.io). All end to end (integration) tests will be executed on a build.

To run the tests you need to run the following, substituting username and password.

    export TEST_AC_USER=<username>,TEST_AC_PASS=<password> ./bin/cypress.sh
   
The test folder is [cypress](/cypress) and the tests themselves are in the [integration](/cypress/integration) folder.

See the [Testing] section for more in depth description of the tests.
       
### Key files and folders for development

The [src](/src) folder is the main folder for development and contains all the source code for the app. 

Within the src folder you will find the [app](/src/app) folder which contains the application source code which is covered in [The Application Structure] - best make sure you know [The Structure of an Angular Application] first.

The [environments](/src/environments) folder contains application variables that are environment specific.

The [amplify](/amplify) folder contains all the amplify generated configuration and should not be manually edited.


### The Application Structure

Please make sure you have read through [Angular] and especially [The Structure of an Angular Application].

Much of the code used in the application that did not come from Angular boilerplating or Amplify is taken from <https://github.com/mlabieniec/AngularMaterialPWA> (MIT License) try reading the blog posts to learn more : <https://itnext.io/part-1-building-a-progressive-web-application-pwa-with-angular-material-and-aws-amplify-5c741c957259>


You will see in the [/src/app](/src/app) folder: 

####  [app-routing.module.ts](/src/app/app-routing.module.ts)

Routing is the terminology for deciding how a URL maps to code. See <https://angular.io/guide/router>

You will notice the use of authentication guards https://angular.io/guide/router#milestone-5-route-guards which can be found in the [Authentication Component (auth)]  

#### [app.component.ts](/src/app/app.component.ts)

#### [app.component.scss](/src/app/app.component.scss)

#### [app.component.html](/src/app/app.component.html)



And the following subfolders:

#### [services](/src/app/services)

Please ignore for now (todo: document)

#### Authentication Component ([auth](/src/app/auth))

The Authentication Component has two guards, a sign-in component and a few modules due for deletion (sign-up, confirm-code and country-code-select).

##### [auth.guard.ts](/src/app/auth/auth.guard.ts) 
Forces redirect to the [Sign-in Component (sign-in)]  page. 

##### [unauth.guard.ts](/src/app/auth/unauth.guard.ts)
Forces redirect to the ```/``` page if already authenticated.

#### Sign-in Component ([sign-in](/src/app/auth/sign-in))

This component provides the sign-in page. Although Amplify+Cognito can provide pre-built pages it is easier with the requirements of this application to have a custom page which uses the Auth.XXX() methods.

Details can be found at <https://aws-amplify.github.io/docs/js/angular> and <https://aws-amplify.github.io/docs/js/authentication>.

 Please read to learn more about how this is specifically implemented: <https://itnext.io/part-1-building-a-progressive-web-application-pwa-with-angular-material-and-aws-amplify-5c741c957259>


#### Home Page ([home](/src/app/home))

#### The UK Map Application ([map](/src/app/map)) 

#### [material](/src/app/material)

## The Development/Release Cycle

### The Branches

The following are the key branches ```release/x.y.z```, ```feature/xxx```, staging and master.

When a developer starts working on a feature it must be associated with a release. For example ```feature/frontend-10``` will be released in ```release/1.1```. 

### The Process

So firstly if there is no release branch create it from the *master* branch, then create a feature branch from the release branch. The developer then makes changes to the codebase in ```feature/XXX```. Amplify automatically builds, tests and deploys to a temporary environment (the console will show the name of the environment). The developer manually tests their code. 

When all tests are passing and there has been some degree of manual testing done it should then be merged into the ```release/x.y.z``` branch. The ```feature/XXX``` can then be deleted and then delete the amplify branch using the supplied script. For feature/XXX this would be:
    
    ./bin/delete-branch.sh XXX

Amplify automatically builds, tests and deploys to the release environment. The team tests all the features when ready for the release. If the team are happy and the release is ready for live testing the team issues a pull request (PR) on GitHub to request merging on to the ```staging``` branch from ```release/x.y.z```. Lead (or just other) Developer reviews the code tests the branch environment and then decides to accept or reject the PR.

If PR is accepted, GitHub merges the changes into ```staging```. The team and possibly customer reps. test the release in staging which is a production environment running against the live data and backend. When everyone is happy a PR is issued to merge ```staging``` into ```master```. It is enforced that at least one other person must okay that PR. The merging of the PR triggers amplify to build a new production environment and instantly deploys to production.


## Technology

### Angular

Angular (and angular CLI) - the application is built using Angular. Angular provides the structure to produce modular applications. The version of the application in socialsensingbot/frontend is built using Angular. The key files are in src directory as you would imagine. The application can be tested locally using the 

    ```ng serve --open' command```

#### Typescript

Main Page: <https://www.typescriptlang.org/>

In 5 mins: <https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html>

Playground: <http://www.typescriptlang.org/play>

Angular uses Typescript. Typescript is a type safe and more advanced version of JavaScript, it compiles down to JavaScript. Most of TypeScript will be familiar to use if you use recent versions of JavaScript. When adding new libraries you will need to make sure they are added the 'Angular way' so that you get the Typescript headers for type safety (and usually proper integration with Angular and it's lifecycle). Typescript is not scary - and can be learnt and implemented incrementally.

## Design
### Material Design

<https://material.io/design/>

The application has been set up to use Material design, Google's standardized design for web applications.

### Angular Material

<https://material.angular.io/>

The implementation of [Material Design] for Angular is Angular Material. 


#### The Structure of an Angular Application

I recommend you familiarize yourself with this guide: <https://angular.io/guide/file-structure>

[app/](/src/app/) Contains the component files in which your application logic and data are defined. See [The Application Structure].

[assets/](/src/assets) Contains image and other asset files to be copied as-is when you build the application.

[environments/](/src/environments)Contains build configuration options for particular target environments. By default there is an unnamed standard development environment and a production ("prod") environment. You can define additional target environment configurations.

[favicon.ico](/src/favicon.ico)	An icon to use for the application in the bookmark bar. (todo: At present this is the default Angular icon)

[index.html](/src/index.html)	The main HTML page that is served when someone visits your site. The CLI automatically adds all JavaScript and CSS files when building your app, so you typically don't need to add any &lt;script&gt; or &lt;link&gt; tags here manually.

[main.ts](/src/main.ts)	The main entry point for your application. Compiles the application with the JIT compiler and bootstraps the application's root module (AppModule) to run in the browser. You can also use the AOT compiler without changing any code by appending the --aot flag to the CLI build and serve commands.

[polyfills.ts](/src/polyfills.ts)	Provides polyfill scripts for browser support.

[styles.scss](/src/styles.scss)	Lists CSS files that supply styles for a project. This is 


[test.ts](/src/test.ts)	The main entry point for your unit tests, with some Angular-specific configuration. You don't typically need to edit this file.


   todo: what other tech do I assume you know?

  
## AWS Services 

**Before you use any AWS service**

You'll need to [install the AWS command line](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) first. Then create credentials in the [IAM console](https://console.aws.amazon.com/iam/home?region=eu-west-2#) .

Next run 

```aws configure```

The region is eu-west-2.

Please make sure you have an AWS credential profile on your local machine called 'socialsensing' as those credentials will be used in various scripts. See <https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html>

Your ~/.aws/credentials file should look like:

```
[default]
aws_access_key_id=AKIAZ74O2XPJWDOOTT3D
aws_secret_access_key=MfiH/sdg676534567fhu+iC5olNF77DsTpmZuEx

[socialsensing]
aws_access_key_id=AKIAZ74O2XPJWDOOTT3D
aws_secret_access_key=MfiH/sdg676534567fhu+iC5olNF77DsTpmZuEx
```

You will need to add the following to your ```~/.aws/config``` file

```
[profile socialsensing]
region=eu-west-2
```

### AWS Amplify

<https://aws-amplify.github.io/docs/js/start?platform=angular>

Here is the magic, Amplify gives: continuous deployment from GitHub, CloudFormation templates, integration with core AWS services including Cognito & S3 . It does a lot of the heavy lifting and is they key techonology to understand.

During development you will very rarely need to interact with AWS Amplify. The following command will give you the status of the components that make up an Amplify application

      amplify status

The Amplify Console is probably the most useful place to start:

<https://eu-west-2.console.aws.amazon.com/amplify/home?region=eu-west-2&#/d2iqaupxgo2qh0>

And the user guide:

<https://aws.amazon.com/amplify/console/>

Please now read about [Branches, Environments and Deployments] to understand what the different environments are for.
 
### AWS Cognito

<https://aws.amazon.com/cognito/>

This is what is used for user management, you will see there are two user pools, one for [production](https://eu-west-2.console.aws.amazon.com/cognito/users/?region=eu-west-2#/pool/eu-west-2_dkJC8ZcOU/details?_k=9e2wps) and one for [development](https://eu-west-2.console.aws.amazon.com/cognito/users/?region=eu-west-2#/pool/eu-west-2_L3RQGANbS/details?_k=kpehkf). 

#### Creating a Live User

<https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/admin-create-user.html>

There is a script in the bin directory called create-user.sh and is used as follows

```
    ./bin/create-user.sh <email> <passsword>
```

#### Setting a Users Password

<https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/admin-set-user-password.html>

There is a script in the bin directory called set-live-password.sh and is used as follows

```
    ./bin/set-live-password.sh <user> <passsword>
```


### AWS S3 & CloudFront

These are used for deployment of the [SPA](https://en.wikipedia.org/wiki/Single-page_application) 

The app is 100% stateless and serverless from a deployment perspective - this means that it can be deployed, reverted smoothly and has no server to go down.

Typically you won't interact with these services directly while working on or maintaining the app. The S3/Cloudfront deployment is managed by amplify.


### GraphQL & AWS DynamoDB

TODO:

### AWS Route 53

Currently the GoDaddy registry for socialsensing.com points to AWS Route 53 for all DNS records. 

Route 53 is Amazon's DNS service. It ties heavily into the whole AWS stack as records in the DNS service can be aliases to services with changeable IP addresses. This also allows failover, geo DNS, blue/green, redudancy and more.

The recordset is:

<https://console.aws.amazon.com/route53/home?region=eu-west-2#resource-record-sets:Z1LO4TCPI221J5>

And within this recordset are the entries for the live and development environments which [AWS Amplify] Console manages.

    

# Testing

## End to End with Cypress

<https://docs.aws.amazon.com/amplify/latest/userguide/running-tests.html>

<https://docs.cypress.io/guides/getting-started/installing-cypress.html#Opening-Cypress>

End to end tests are peformed using [Cypress](https://cypress.io). All end to end (integration) tests will be executed on a build in a release branch and the quick tests on a feature branch.

To run the tests you need to run the following, substituting username and password.

    export TEST_AC_USER=<username>,TEST_AC_PASS=<password> ./bin/cypress.sh
   
The test folder is [cypress](/cypress) and the tests themselves are in the [integration](/cypress/integration) folder.

Within the [cypress](/cypress) folder there are the following that you will need to use:

The quick tests are run during builds of feature and release branches and can be found in [integration/quick](/cypress/integration/quick), tests that are directly related to issues are in the [integration/quick/issues](/cypress/integration/quick/issues) folder and are prefixed with the issue id from GitHub.

The slow tests are run during builds of release branches (or manually) only and can be found in [integration/slow](/cypress/integration/slow), tests that are directly related to issues are in the [integration/slow/issues](/cypress/integration/slow/issues) folder and are prefixed with the issue id from GitHub. The difference is simply how long a test takes to run.

### Writing custom commands

<https://docs.cypress.io/api/cypress-api/custom-commands.html>

The [commands.js](cypress/support/commands.js) file contains custom commands that can be used in Cypress tests. They are very straightforward to write and basically are defined like:

```javascript
Cypress.Commands.add("twitterPanelHeader", (text) => {
  cy.get("twitter-panel");
  cy.get(".tinfo-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
  cy.wait(1000);
  cy.get(".tinfo-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
  cy.get("twitter-panel .tweets-header", {timeout: LONG_TIMEOUT});
  cy.get("twitter-panel .tweets-header  mat-card > span > b", {timeout: LONG_TIMEOUT}).should("contain.text", text);
});
```

and used like

```javascript
 describe('select county and date range', () => {
    const url = "http://localhost:4200/map?selected=scottish%20borders&min_offset=-1439&max_offset=0&zoom=5";
    it('with no tweets', () => {
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time-max .slider-date").should("contain.text","15-Oct-18");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "12 AM");
      cy.get(".tweet-drawer", {timeout: 60000}).should("be.visible");
      cy.url().should("equal", url);
      
      cy.twitterPanelHeader("No Tweets from Scottish Borders");

      cy.logout();
    });
  });
```

### Using Fixtures and Stubbing Services

The [fixtures](/cypress/fixtures) folder contains data used to stub out remote services for testing purposes. In our case this is the live.json data retrieved from S3. In the commands.js file you will see how they are used.

This is a huge topic please, please read the Cypress docs on fixtures and the ```cy.route(...)``` command. But let's quickly focus in on the key parts:

#### Live.json

The live.json file is usually retrieved from S3 securely by the app. However certain bugs only manifest with sepcific data. For example a region where every tweet has been deleted. So to test those issues we need to capture the live.json for the issue then save it to the [fixtures](/cypress/fixtures) folder and then tell the test we're writing to use that data set.
 
You will see something like this in [commands.js](cypress/support/commands.js)

```javascript
    Cypress.Commands.add("stubLiveJson", (file) => {
    // prepare network responses
      cy.server();
    // this is where we tell cypress to intercept
    // certain XHR calls,
    // and to stub in our fixture instead
      cy.route({
             // our example is a GET call, but you could also
             // have a POST, if you're pushing data up
             method:   "GET",
             // more on the URL below
             url:      /.*\/public\/live.json?.*/g,
             // the fixture: shortcut will know to
             // look in cypress/fixtures,
             // unless you configure cypress to
             // put it somewhere else
             response: "fixture:" + file + ".json"
           });

});
```

This creates a command we can use in Cypress tests called cy.stubLiveJson() that takes a file name (minus the .json extension) of a fixture to use replace the live.json normally loaded by the app. It is usually used like this :

```javascript
      beforeEach(function () {
                ...
          cy.stubLiveJson("live-old");
                ...
      });
```

    
#### GraphQL (DynamoDB access)

This is a work in progress, the initial hack just turns off all tweet ignores and is called using:

```javascript
    cy.mockGraphQL();
```

It is a complex subject that had me wracking my brains for hours. The solution I've done is sub par but works. Expect more work on this at a later date.    

### Retries

The [Cypress Retries Plugin](https://github.com/Bkucera/cypress-plugin-retries) is used to make Cypress retry flakey tests. In the [cypress.json](cypress.json) file we configure the retries.

```json
{
  "env": {
    "RETRIES": 2
  }
}
```

The retry count is overidden by the CYPRESS_RETRIES environment variable in the [Amplify Console](https://eu-west-2.console.aws.amazon.com/amplify/home?region=eu-west-2#/dtmxl3q3i7oix/settings/variables).


### Cross-Browser Testing

At present this is not automated but there is a script that runs through all the main browsers supported by cypress in ```bin/test-browsers.sh``` pass the path to the test or tests as the first argument.

##  Issue Tracking 

The issues are tracked at:

 <https://github.com/socialsensingbot/frontend/issues>

For managing issues and tasks please see the Kanban board:
 
 <https://github.com/socialsensingbot/frontend/projects/1>

To see the latest development milestones: 

 <https://github.com/socialsensingbot/frontend/milestones> 

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

[The Application Structure]: #the-application-structure
[The Structure of an Angular Application]: #the-structure-of-an-angular-application

[AWS Amplify]: #aws-amplify
[Angular]: #angular
[Getting Started]: #getting-started
[Development Quick Reference]: #development-quick-reference
[AWS Services]: #aws-services
[Technology]: #technology
[AWS Cognito]: #aws-cognito
[AWS Route 53]: #aws-route-53
[AWS S3 & CloudFront]: #aws-s3--cloudfront
[Development server]: #development-server
[Code scaffolding]: #code-scaffolding
[Build]: #build
[Running unit tests]: #running-unit-tests
[Running end-to-end tests]: #running-end-to-end-tests
[Key files and folders for development]: #key-files-and-folders-for-development
[Installation and Quick Start]: #installation-and-quick-start
[Testing]: #testing
[Issue Tracking]: #issue-tracking
[Authentication Component (auth)]: #authentication-component-auth
[Sign-in Component (sign-in)]: #sign-in-component-sign-in
[The Development/Release Cycle]: #the-developmentrelease-cycle
[Design]: #design
[Material Design]: #material-design
[Angular Material]: #angular-material
[Creating a Live User]: #creating-a-live-user
[Setting a Users Password]: #setting-a-users-password
[End to End with Cypress]: #end-to-end-with-cypress
[Using Fixtures and Stubbing Services]: #using-fixtures-and-stubbing-services
[GraphQL (DynamoDB access)]: #graphql-dynamodb-access
[The Branches]: #the-branches
[The Process]: #the-process
[Live.json]: #livejson
[Cross-Browser Testing]: #cross-browser-testing










































