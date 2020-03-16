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
- [Technology] 
  - [Angular] 
  - [The Structure of an Angular Application] 
- [AWS Services]
  - [AWS Amplify] 
  - [AWS Cognito] 
  - [AWS Route 53] 
  - [AWS S3 & CloudFront] 
- [Branches, Environments and Deployments] 
  - [Github] 
    - [GitFlow] 
  - [Testing] 
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
       
       
### Development Quick Reference

#### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

#### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

##### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

#### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

#### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
       
       
#### Key files and folders for development

The [src](/src) folder is the main folder for development and contains all the source code for the app. 

Within the src folder you will find the [app](/src/app) folder which contains the application source code which is covered in [The Application Structure] - best make sure you know [The Structure of an Angular Application] first.

The [environments](/src/environments) folder contains application variables that are environment specific.

The [amplify](/amplify) folder contains all the amplify generated configuration and should not be manually edited.


#### The Application Structure

Please make sure you have read through [Angular] and especially [The Structure of an Angular Application].
 
## Technology

### Angular

Angular (and angular CLI) - the application is built using Angular. Angular provides the structure to produce modular applications. The version of the application in socialsensingbot/frontend is built using Angular. The key files are in src directory as you would imagine. The application can be tested locally using the 

    ```ng serve --open' command```

#### Typescript

Angular uses Typescript. Typescript is a type safe and more advanced version of JavaScript, it compiles down to JavaScript. Most of TypeScript will be familiar to use if you use recent versions of JavaScript. When adding new libraries you will need to make sure they are added the 'Angular way' so that you get the Typescript headers for type safety (and usually proper integration with Angular and it's lifecycle). Typescript is not scary - and can be learnt and implemented incrementally.

#### The Structure of an Angular Application

todo: what other tech do I assume you know?

  
## AWS Services 


### AWS Amplify

<https://aws-amplify.github.io/docs/js/start?platform=angular>

Here is the magic, Amplify gives: continuous deployment from GitHub, CloudFormation templates, integration with core AWS services including Cognito & S3 . It does a lot of the heavy lifting and is they key techonology to understand.

During development you will very rarely need to interact with AWS Amplify. The following command will give you the status of the components that make up an Amplify application

      amplify status

The Amplify Console is probably the most useful place to start:

https://eu-west-2.console.aws.amazon.com/amplify/home?region=eu-west-2&#/d2iqaupxgo2qh0

And the user guide:

https://aws.amazon.com/amplify/console/

Please now read about [Branches, Environments and Deployments] to understand what the different environments are for.
 
### AWS Cognito

<https://aws.amazon.com/cognito/>

This is what is used for user management, you will see there are two user pools, one for production and one for development.

 todo: More details here

### AWS S3 & CloudFront

These are used for deployment of the [SPA](https://en.wikipedia.org/wiki/Single-page_application) 

The app is 100% stateless and serverless from a deployment perspective - this means that it can be deployed, reverted smoothly and has no server to go down.

### AWS Route 53

Currently the GoDaddy registry for socialsensing.com points to AWS Route 53 for all DNS records. 

Route 53 is Amazon's DNS service. It ties heavily into the whole AWS stack as records in the DNS service can be aliases to services with changeable IP addresses. This also allows failover, geo DNS, blue/green, redudancy and more.

The recordset is:

https://console.aws.amazon.com/route53/home?region=eu-west-2#resource-record-sets:Z1LO4TCPI221J5

And within this recordset are the entries for the live and development environments which [AWS Amplify] Console manages.

    

  
## Branches, Environments and Deployments

###  Github

I have created an additional branch called develop. Amplify then builds two environments - one for development and one production (built from master). Also any branches that start with feature/** will be built and have an environment created for them. Environments can further be created for pull requests but that needs the project to be private. I would of course suggest that the application does become private again on GitHub.

#### GitFlow

This a good standard way of managing changes - in uber summary it goes. Dev codes into develop or creates a branch from develop. Developer checks in code. The dev environment is built by Amplify (and available at <https://dev.socialsensing.com/> ). The developer issues a pull request on GitHub to bring the changes into master. Those changes are potentially reviewed and (tested) then the pull request is accepted (or declined!). The pull request merges the code into master - which triggers Amplify to build production ( <https://new.socialsensing.com/> ).

### Testing

There is a lot of boiler plate code for testing in the app, as you can imagine that has not been within scope during the work to get this together. However going forward using continuous deployment it will be necessary - as continuous deployment mandates automated testing. For now, you don't need to implement full continuous deployment. Which leads me onto ...



###  Issue Tracking 
Finally there are two problems with my version both of which are trivial for me to fix: 1) The massive lag. That's because I load all the large JSON files from a secure S3 location (giving you genuine app security). However I need to move some of them to an insecure S3 bucket which can be cached as a normal web resource.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

[The Application Structure]: #the-application-structure
[The Structure of an Angular Application]: #the-structure-of-an-angular-application
[Branches, Environments and Deployments]: #branches-environments-and-deployments
[AWS Amplify]: #aws-amplify
[Angular]: #angular
[Getting Started]: #getting-started
[Development Quick Reference]: #development-quick-reference
[AWS Services]: #aws-services
[Technology]: #technology
[AWS Cognito]: #aws-cognito
[AWS Route 53]: #aws-route-53
[AWS S3 & CloudFront]: #aws-s3--cloudfront
[Github]: #github
[GitFlow]: #gitflow
[Development server]: #development-server
[Code scaffolding]: #code-scaffolding
[Build]: #build
[Running unit tests]: #running-unit-tests
[Running end-to-end tests]: #running-end-to-end-tests
[Key files and folders for development]: #key-files-and-folders-for-development
[Installation and Quick Start]: #installation-and-quick-start
[Testing]: #testing
[Issue Tracking]: #issue-tracking























